//! The two dev browsers: what differs between them, and how each is launched.

mod cft;
pub(crate) mod chrome;
pub(crate) mod firefox;
mod manifest;
mod startup;

use std::path::{Path, PathBuf};

use crate::profile::Environment;

const BUILD_DIRECTORY: &str = "build";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Browser {
    Chrome,
    Firefox,
}

impl Browser {
    pub(crate) const fn name(self) -> &'static str {
        match self {
            Self::Chrome => "Chrome",
            Self::Firefox => "Firefox",
        }
    }

    pub(crate) const fn wxt_name(self) -> &'static str {
        match self {
            Self::Chrome => "chrome",
            Self::Firefox => "firefox",
        }
    }

    /// WXT's output folder under `build/`, distinct per browser so two dev servers never race one
    /// directory.
    pub(crate) const fn out_dir_template(self) -> &'static str {
        match self {
            Self::Chrome => "chrome-mv3-development",
            Self::Firefox => "firefox-mv3-development",
        }
    }

    pub(crate) fn output_dir(self, project_root: &Path) -> PathBuf {
        project_root
            .join(BUILD_DIRECTORY)
            .join(self.out_dir_template())
    }
}

/// What a launch needs.
#[derive(Debug, Clone, Copy)]
pub(crate) struct Launch<'a> {
    pub(crate) project_root: &'a Path,
    pub(crate) profile_dir: &'a Path,
    pub(crate) extension_dir: &'a Path,
    pub(crate) environment: &'a Environment,
}
