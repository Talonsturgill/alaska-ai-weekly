import { Config } from '@remotion/cli/config';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(4);
// Use the pre-installed Playwright headless-shell Chromium; never download a browser.
// Keep the CI path while allowing the same checkout to render on the production Mac.
const bundledBrowser = process.platform === 'darwin'
  ? join(homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1194/chrome-mac/headless_shell')
  : '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || bundledBrowser;
if (!existsSync(browserExecutable)) {
  throw new Error(`Remotion browser executable not found: ${browserExecutable}`);
}
Config.setBrowserExecutable(browserExecutable);
Config.setChromeMode('headless-shell');
