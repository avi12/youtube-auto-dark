//! What the launchers read from the built `manifest.json`.

use std::path::Path;

use serde::Deserialize;

use crate::error::Result;

#[derive(Debug, Deserialize)]
pub(super) struct Manifest {
    pub(super) name: String,
    browser_specific_settings: Option<BrowserSettings>,
}

#[derive(Debug, Deserialize)]
struct BrowserSettings {
    gecko: Gecko,
}

#[derive(Debug, Deserialize)]
struct Gecko {
    id: String,
}

impl Manifest {
    pub(super) fn read(extension_dir: &Path) -> Result<Self> {
        let text = std::fs::read_to_string(extension_dir.join("manifest.json"))?;
        Ok(serde_json::from_str(&text)?)
    }

    pub(super) fn gecko_id(&self) -> Option<&str> {
        self.browser_specific_settings
            .as_ref()
            .map(|settings| settings.gecko.id.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_gecko_id_is_only_present_in_firefox_manifests() -> Result<()> {
        let firefox: Manifest = serde_json::from_str(
            r#"{"name":"a","browser_specific_settings":{"gecko":{"id":"a@b"}}}"#,
        )?;
        let chrome: Manifest = serde_json::from_str(r#"{"name":"a"}"#)?;
        assert_eq!((firefox.gecko_id(), chrome.gecko_id()), (Some("a@b"), None));
        Ok(())
    }
}
