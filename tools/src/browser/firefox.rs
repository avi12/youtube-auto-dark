//! The installed Firefox, driven over its Remote Agent (`WebDriver` `BiDi`).

use std::env;
use std::path::PathBuf;

use dev_hot::driver::bidi::BidiClient;
use dev_hot::driver::{BrowserDriver, YOUTUBE_ORIGIN};
use tokio::process::Child;

use crate::browser::manifest::Manifest;
use crate::browser::startup::{claim_port, wait_until_listening};
use crate::browser::Launch;
use crate::error::{Error, Result};
use crate::process::Invocation;
use crate::profile;

/// Next to Chrome's CDP port.
const PREFERRED_REMOTE_PORT: u16 = 9272;
const LISTENING_MARKER: &str = "WebDriver BiDi listening on";
const MAC_BINARY: &str = "/Applications/Firefox.app/Contents/MacOS/firefox";
const LINUX_BINARY: &str = "firefox";
const WINDOWS_BINARY_PATH: &str = "Mozilla Firefox/firefox.exe";
const PROGRAM_FILES_VARIABLES: [&str; 2] = ["ProgramFiles", "ProgramFiles(x86)"];

fn find_firefox() -> Result<PathBuf> {
    if cfg!(target_os = "macos") {
        return Ok(PathBuf::from(MAC_BINARY));
    }
    if !cfg!(windows) {
        return Ok(PathBuf::from(LINUX_BINARY));
    }
    PROGRAM_FILES_VARIABLES
        .iter()
        .filter_map(env::var_os)
        .map(|root| PathBuf::from(root).join(WINDOWS_BINARY_PATH))
        .find(|candidate| candidate.is_file())
        .ok_or_else(|| Error::Browser("could not find Firefox".to_owned()))
}

pub(crate) async fn launch(launch: Launch<'_>) -> Result<(Child, impl BrowserDriver)> {
    let manifest = Manifest::read(launch.extension_directory)?;
    let gecko_id = manifest
        .gecko_id()
        .ok_or_else(|| Error::Browser("the manifest has no gecko id".to_owned()))?;
    profile::firefox::setup(launch.profile_directory, launch.environment, gecko_id)?;
    let port = claim_port(PREFERRED_REMOTE_PORT, "Firefox Remote Agent")?;
    let mut command = Invocation::new(find_firefox()?)
        .arg("-profile")
        .arg(launch.profile_directory)
        .args(["-no-remote", "--remote-debugging-port"])
        .arg(port.get().to_string());
    if cfg!(windows) {
        // Keeps the launched process alive as long as the browser, so its exit means "closed"
        command = command.arg("-wait-for-browser");
    }
    let mut child = command.spawn_kill_on_drop()?;
    wait_until_listening(&mut child, LISTENING_MARKER).await?;
    let driver = BidiClient::new(port, launch.extension_directory.to_path_buf());
    driver.reload_extension().await?;
    driver.open_in_first_tab(YOUTUBE_ORIGIN).await?;
    Ok((child, driver))
}
