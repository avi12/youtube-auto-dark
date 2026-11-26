//! The Chrome dev profile: its own user-data directory, seeded once from the real profile and never
//! writing to the real one.

use std::path::{Path, PathBuf};

use serde_json::{json, Map, Value};

use crate::error::Result;
use crate::launcher::log_event;
use crate::profile::{clone_files, Environment};

pub(crate) const CHROME_PROFILE_NAME: &str = "Default";
const SEEDED_SENTINEL: &str = ".seeded";
/// Names the real profile to seed from, when it is not the default one.
const SOURCE_PROFILE_VARIABLE: &str = "DEV_CHROME_SOURCE_PROFILE";
const USER_DATA_FILES: [&str; 1] = ["Local State"];
/// Not the real `Preferences`: Chrome for Testing refuses to sideload on top of an installed
/// Chrome's.
const PROFILE_FILES: [&str; 2] = ["Network/Cookies", "Network/TransportSecurity"];

fn user_data_directory(environment: &Environment) -> PathBuf {
    if cfg!(windows) {
        return environment
            .directory("LOCALAPPDATA")
            .join("Google/Chrome/User Data");
    }
    if cfg!(target_os = "macos") {
        return environment
            .home()
            .join("Library/Application Support/Google/Chrome");
    }
    environment.home().join(".config/google-chrome")
}

/// The object under `key`, replacing whatever else sits there.
fn object<'map>(
    map: &'map mut Map<String, Value>,
    key: &str,
) -> Option<&'map mut Map<String, Value>> {
    let entry = map.entry(key).or_insert_with(|| json!({}));
    if !entry.is_object() {
        *entry = json!({});
    }
    entry.as_object_mut()
}

/// Reloading an unpacked extension needs developer mode, which a cloned profile may have off.
fn with_developer_mode(stored: &str) -> Value {
    let mut preferences: Map<String, Value> = serde_json::from_str(stored).unwrap_or_default();
    if let Some(interface) =
        object(&mut preferences, "extensions").and_then(|map| object(map, "ui"))
    {
        interface.insert("developer_mode".to_owned(), Value::Bool(true));
    }
    Value::Object(preferences)
}

pub(crate) fn setup(profile: &Path, environment: &Environment) -> Result<()> {
    let sentinel = profile.join(SEEDED_SENTINEL);
    let source = user_data_directory(environment);
    if !sentinel.exists() && source.is_dir() {
        log_event(&format!(
            "Seeding the dev Chrome profile from {}",
            source.display()
        ));
        clone_files(&source, profile, &USER_DATA_FILES)?;
        let name = environment
            .get(SOURCE_PROFILE_VARIABLE)
            .unwrap_or(CHROME_PROFILE_NAME);
        clone_files(
            &source.join(name),
            &profile.join(CHROME_PROFILE_NAME),
            &PROFILE_FILES,
        )?;
    }
    let default = profile.join(CHROME_PROFILE_NAME);
    std::fs::create_dir_all(&default)?;
    std::fs::write(sentinel, "")?;
    let preferences = default.join("Preferences");
    let stored = std::fs::read_to_string(&preferences).unwrap_or_default();
    std::fs::write(preferences, with_developer_mode(&stored).to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::profile::chrome::*;

    #[test]
    fn developer_mode_is_added_without_losing_preferences() {
        let next = with_developer_mode(r#"{"a":1,"extensions":{"b":2}}"#);
        assert_eq!(
            next,
            json!({"a":1,"extensions":{"b":2,"ui":{"developer_mode":true}}})
        );
        assert_eq!(
            with_developer_mode("not json"),
            json!({"extensions":{"ui":{"developer_mode":true}}})
        );
    }
}
