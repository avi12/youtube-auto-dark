//! `devtool dev`: build, set up the isolated profile, launch the browser with the extension and
//! rebuild on every save until the browser closes or Ctrl+C.

mod build;
mod log;
mod wxt_worker;

use std::path::{Path, PathBuf};
use std::time::Duration;

use clap::Args;
use dev_hot::changes::scope::SOURCE_DIRECTORY;
use dev_hot::changes::watcher::{self, ChangeBatch, WatchConfig};
use dev_hot::driver::BrowserDriver;
use dev_hot::orchestrator;
use dev_hot::types::RelPath;
use tokio::process::Child;
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

use self::build::WxtBuilder;
use self::log::install_log_layer;
pub(crate) use self::log::log_event;
use crate::browser::{chrome, firefox, Browser, Launch};
use crate::error::Result;
use crate::profile::{self, Environment};

/// Build inputs besides the source and the env files.
const WATCHED_CONFIG_FILES: [&str; 3] = ["wxt.config.ts", "package.json", "bun.lock"];
const WATCH_POLL_INTERVAL: Duration = Duration::from_millis(500);
const REBUILD_DEBOUNCE: Duration = Duration::from_millis(50);

#[derive(Debug, Args)]
pub(crate) struct DevArgs {
    /// Develop in Firefox instead of Chrome.
    #[arg(long = "firefox")]
    is_firefox: bool,
    /// The extension project.
    #[arg(long, default_value = ".")]
    project_root: PathBuf,
}

fn watch_config(root: &Path) -> WatchConfig {
    let paths = std::iter::once(SOURCE_DIRECTORY)
        .chain(WATCHED_CONFIG_FILES)
        .chain(profile::ENV_FILES_MOST_SPECIFIC_FIRST)
        .map(RelPath::new)
        .collect();
    WatchConfig {
        root: root.to_path_buf(),
        paths,
        poll_interval: WATCH_POLL_INTERVAL,
        debounce: REBUILD_DEBOUNCE,
    }
}

/// Everything the rebuild loop runs on, whichever browser it drives.
struct Session {
    batches: mpsc::Receiver<ChangeBatch>,
    builder: WxtBuilder,
    shutdown: CancellationToken,
}

impl Session {
    /// Rebuilds on every save until the dev browser closes or Ctrl+C. Returning drops the
    /// browser's handle, which ends a browser still running.
    async fn serve(self, browser: Browser, mut process: Child, driver: impl BrowserDriver) {
        log_event(&format!(
            "{} launched with the extension sideloaded - watching for changes",
            browser.name()
        ));
        let rebuilds = orchestrator::run(self.batches, self.builder, driver, self.shutdown.clone());
        tokio::select! {
            () = rebuilds => {}
            _ = process.wait() => log_event("The browser closed"),
            _ = tokio::signal::ctrl_c() => {}
        }
        self.shutdown.cancel();
    }
}

pub(crate) async fn run(args: DevArgs) -> Result<()> {
    let browser = if args.is_firefox {
        Browser::Firefox
    } else {
        Browser::Chrome
    };
    let project_root = std::path::absolute(&args.project_root)?;
    install_log_layer()?;

    let environment = Environment::read(&project_root);
    let profile_directory = profile::directory(&project_root, browser);
    profile::stop_leftover_instances(&profile_directory).await?;

    log_event(&format!(
        "Building for {} (development, inline source maps)",
        browser.name()
    ));
    // Watching starts before the build, so a save made while the browser starts is not lost
    let shutdown = CancellationToken::new();
    let batches = watcher::spawn(watch_config(&project_root), shutdown.clone())?;
    let mut builder = WxtBuilder::new(project_root.clone(), browser);
    builder.build_with_lock_retry().await?;

    let extension_directory = browser.output_directory(&project_root);
    let launch = Launch {
        project_root: &project_root,
        profile_directory: &profile_directory,
        extension_directory: &extension_directory,
        environment: &environment,
    };
    let session = Session {
        batches,
        builder,
        shutdown,
    };
    match browser {
        Browser::Chrome => {
            let (process, driver) = chrome::launch(launch).await?;
            session.serve(browser, process, driver).await;
        }
        Browser::Firefox => {
            let (process, driver) = firefox::launch(launch).await?;
            session.serve(browser, process, driver).await;
        }
    }
    log_event("Dev server stopped");
    Ok(())
}
