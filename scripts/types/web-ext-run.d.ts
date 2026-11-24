declare module "web-ext-run" {
  interface ExtensionRunner {
    reloadAllExtensions: () => Promise<void>;
    exit: () => Promise<void>;
    registerCleanup: (cleanupCallback: () => void) => void;
  }

  interface RunOptions {
    target: "chromium" | "firefox-desktop";
    sourceDir: string;
    startUrl: string[];
    keepProfileChanges: boolean;
    noReload: boolean;
    noInput: boolean;
    args: string[];
    chromiumProfile?: string;
    firefoxProfile?: string;
    firefox?: string;
    customPrefs?: Record<string, boolean | number | string>;
  }

  interface RunCommand {
    run: (options: RunOptions, config?: { shouldExitProgram?: boolean }) => Promise<ExtensionRunner>;
  }

  const webExtRun: {
    cmd: { run: RunCommand["run"] };
  };
  export default webExtRun;
}

declare module "web-ext-run/util/logger" {
  interface ConsoleStream {
    write: (entry: { level: number; msg: string; name?: string; time?: string }) => void;
  }
  export const consoleStream: ConsoleStream;
}
