//! Chrome for Testing: a Chrome build that still sideloads with `--load-extension`.

use dev_hot::driver::cdp::CdpClient;
use dev_hot::driver::{BrowserDriver, YOUTUBE_ORIGIN};
use tokio::process::Child;

use crate::browser::cft::ensure_chrome;
use crate::browser::manifest::Manifest;
use crate::browser::startup::{claim_port, wait_until_listening};
use crate::browser::Launch;
use crate::error::Result;
use crate::process::Invocation;
use crate::profile::{self, CHROME_PROFILE_NAME};

/// Clear of sibling dev servers' ports (9222 is what other apps' `WebView2` debuggers grab first).
const PREFERRED_CDP_PORT: u16 = 9270;
const LISTENING_MARKER: &str = "DevTools listening on";

pub(crate) async fn launch(launch: Launch<'_>) -> Result<(Child, impl BrowserDriver)> {
    profile::chrome::setup(launch.profile_directory, launch.environment)?;
    let executable = ensure_chrome(launch.project_root).await?;
    let extension_name = Manifest::read(launch.extension_directory)?.name;
    let port = claim_port(PREFERRED_CDP_PORT, "Chrome CDP")?;
    let mut child = Invocation::new(executable)
        .args([
            format!("--user-data-dir={}", launch.profile_directory.display()),
            format!("--profile-directory={CHROME_PROFILE_NAME}"),
            format!("--load-extension={}", launch.extension_directory.display()),
            "--remote-debugging-address=127.0.0.1".to_owned(),
            format!("--remote-debugging-port={}", port.get()),
            "--no-first-run".to_owned(),
            "--no-default-browser-check".to_owned(),
            "--disable-blink-features=AutomationControlled".to_owned(),
            "--mute-audio".to_owned(),
            YOUTUBE_ORIGIN.to_owned(),
        ])
        .spawn_kill_on_drop()?;
    wait_until_listening(&mut child, LISTENING_MARKER).await?;
    Ok((child, CdpClient::new(port, extension_name)))
}
