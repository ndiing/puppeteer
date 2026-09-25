# @ndiinginc/puppeteer

Helper wrapper around [`puppeteer-core`](https://www.npmjs.com/package/puppeteer-core) that connects to (or auto-launches) a real, persistent Chrome instance via the DevTools remote-debugging protocol — instead of spinning up a fresh, disposable Chromium each run.

## Features

- 🔄 **Reuses an existing Chrome instance** if one is already running on the debug port, avoiding redundant launches.
- 🚀 **Auto-launches Chrome** with a persistent user profile when none is found.
- 👤 **Persistent user data directory**, so cookies, logins, and extensions survive across runs.
- 🖥️ Sensible defaults for window size, viewport, and a realistic desktop `User-Agent`.
- 🔇 Silences `console.log` inside pages opened via `browser.newPage()`.
- 🧩 Built on top of [`@ndiinginc/chrome-path`](https://www.npmjs.com/package/@ndiinginc/chrome-path) to auto-resolve the local Chrome executable.

## Installation

```bash
npm install @ndiinginc/puppeteer puppeteer-core @ndiinginc/chrome-path
```

> `puppeteer-core` and `@ndiinginc/chrome-path` are peer dependencies and must be installed alongside this package.

## Usage

```js
const { launch } = require("@ndiinginc/puppeteer");

(async () => {
    const browser = await launch();
    const page = await browser.newPage();

    await page.goto("https://example.com");
    console.log(await page.title());

    // Note: browser is not automatically closed, since it may be a
    // shared, persistent instance. Close it explicitly if needed:
    // await browser.close();
})();
```

## How it works

1. `launch()` first checks `http://127.0.0.1:9223/json/version` to see if a Chrome instance with remote debugging is already running.
2. If found, it connects to that instance's WebSocket debugger URL directly — no new process is spawned.
3. If not found, it spawns a new, detached Chrome process with `--remote-debugging-port=9223` and the options below, then polls (up to 10 × 500ms) until the debug endpoint becomes available.
4. Either way, `puppeteer-core`'s `connect()` is used to attach to the browser over the DevTools protocol.

Because the launched Chrome process is `detached` and `unref()`'d, it keeps running independently of your Node process — handy for reusing the same browser/session across multiple script runs.

## API

### `launch(options?): Promise<Browser>`

Returns a connected [`puppeteer-core` `Browser`](https://pptr.dev/api/puppeteer.browser) instance.

| Option              | Type      | Default                                             | Description                                                                 |
|---------------------|-----------|------------------------------------------------------|-------------------------------------------------------------------------------|
| `executablePath`    | `string`  | resolved via `@ndiinginc/chrome-path`                | Path to the Chrome executable.                                               |
| `defaultViewport`   | `object`  | `null`                                                | Passed through to `puppeteer-core`'s `connect()`.                           |
| `userDataDir`       | `string`  | OS-specific app data path (see below)                | Chrome user-data directory, for a persistent profile.                       |
| `profileDirectory`  | `string`  | `"Default"`                                           | Chrome profile folder name (e.g. `"Default"`, `"Profile 1"`).               |
| `headless`          | `boolean` | `true`                                                | Launches Chrome with `--headless=new` when `true`.                          |
| `devtools`          | `boolean` | `false`                                               | Auto-opens DevTools for new tabs.                                            |
| `userAgent`         | `string`  | a desktop Chrome/Windows UA string                    | Overrides the browser's User-Agent.                                          |
| `...restOptions`    | `object`  | —                                                      | Any other `puppeteer-core` `connect()` option (forwarded as-is).            |

**Default `userDataDir` by platform:**

| Platform  | Path                                                          |
|-----------|----------------------------------------------------------------|
| `win32`   | `%HOMEPATH%\AppData\Local\App Name\User Data`                 |
| `darwin`  | `~/Library/Application Support/App Name`                       |
| other     | `~/.config/app-name`                                           |

> ⚠️ Update the `"App Name"` / `"app-name"` placeholders in `getUserDataDir()` to match your actual application/product name before publishing, so the profile directory doesn't collide with unrelated apps.

### Behavior notes

- **Fixed debug port**: always uses port `9223`. Running two instances of your app simultaneously will make the second one connect to the first one's browser rather than opening a separate one.
- **`browser.newPage()` is patched** to call `page.evaluateOnNewDocument("console.log = {};")` on every new page, disabling `console.log` inside the page context.
- Chrome is launched with a fixed `1920x1080` window/screen size (`--start-maximized`, `--window-size`, `--ozone-override-screen-size`, `--screen-info`).

## Requirements

- Node.js with `fetch` available globally (Node 18+).
- A local Chrome/Chromium installation resolvable by `@ndiinginc/chrome-path`.

## License

ISC (or update to match your actual license).
