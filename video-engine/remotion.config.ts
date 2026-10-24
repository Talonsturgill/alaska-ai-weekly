import { Config } from '@remotion/cli/config';
import {existsSync, readdirSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
// Use the pre-installed Playwright headless-shell Chromium; never download a browser.
// Keep the CI path while allowing the same checkout to render on the production Mac.
const bundledBrowser = process.platform === 'darwin'
  ? join(homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1194/chrome-mac/headless_shell')
  : '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
// The sandbox image's Playwright revision moves (1194 on the original image, 1243 on the 2026-10-24 one), so fall back to whatever headless shell is installed.
const findShell = (): string | undefined => {
  try {
    const root = '/opt/pw-browsers';
    for (const d of readdirSync(root).filter((x) => x.startsWith('chromium_headless_shell-')).sort().reverse()) {
      for (const sub of readdirSync(join(root, d))) {
        for (const name of ['headless_shell', 'chrome-headless-shell']) {
          const c = join(root, d, sub, name);
          if (existsSync(c)) return c;
        }
      }
    }
  } catch { /* no playwright browsers here */ }
  return undefined;
};
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || (existsSync(bundledBrowser) ? bundledBrowser : findShell() ?? bundledBrowser);
if (!existsSync(browserExecutable)) {
  throw new Error(`Remotion browser executable not found: ${browserExecutable}`);
}
Config.setBrowserExecutable(browserExecutable);
Config.setChromeMode('headless-shell');
