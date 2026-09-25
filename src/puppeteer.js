const { spawn } = require("child_process");
const { connect } = require("puppeteer-core");
const path = require("path");
const os = require("os");
const chromePath = require("@ndiinginc/chrome-path");

const PORT = 9223;
const DEBUG_URL = `http://127.0.0.1:${PORT}/json/version`;

async function isChromeRunning() {
    try {
        const response = await fetch(DEBUG_URL);
        if (response.ok) {
            const json = await response.json();
            return json.webSocketDebuggerUrl || null;
        }
    } catch (err) {
        return null;
    }
    return null;
}

function getUserDataDir() {
    const homeDir = os.homedir();

    if (os.platform() === "win32") {
        return path.join(homeDir, "AppData", "Local", "App Name", "User Data");
    } else if (os.platform() === "darwin") {
        return path.join(homeDir, "Library", "Application Support", "App Name");
    } else {
        return path.join(homeDir, ".config", "app-name");
    }
}

async function ensureChromeInstance({
    executablePath,
    userDataDir,
    profileDirectory,
    headless,
    devtools,
    userAgent,
} = {}) {
    let webSocketDebuggerUrl = await isChromeRunning();
    if (webSocketDebuggerUrl) {
        return webSocketDebuggerUrl;
    }

    const width = 1920;
    const height = 1080;

    const args = [
        `--remote-debugging-port=${PORT}`,
        "--no-first-run",
        "--no-default-browser-check",
        "--start-maximized",
        `--window-size=${width},${height}`,
        `--ozone-override-screen-size=${width},${height}`,
        `--screen-info={${width}x${height}}`,
    ];

    if (userAgent) args.push(`--user-agent=${userAgent}`);
    if (userDataDir) args.push(`--user-data-dir=${userDataDir}`);
    if (profileDirectory) args.push(`--profile-directory=${profileDirectory}`);
    if (headless) args.push("--headless=new");
    if (devtools) args.push("--auto-open-devtools-for-tabs");

    const chromeProcess = spawn(executablePath, args, {
        detached: true,
        stdio: "ignore",
    });

    chromeProcess.unref();

    for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        webSocketDebuggerUrl = await isChromeRunning();
        if (webSocketDebuggerUrl) return webSocketDebuggerUrl;
    }

    throw new Error("Failed to start a new Chrome instance");
}

/**
 * @param {import('puppeteer-core').LaunchOptions} options
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
async function launch(options = {}) {
    const {
        executablePath = chromePath(),
        defaultViewport = null,
        userDataDir = getUserDataDir(),
        profileDirectory = "Default",
        headless = true,
        devtools = false,
        userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
        ...restOptions
    } = options;

    const browserWSEndpoint = await ensureChromeInstance({
        executablePath,
        userDataDir,
        profileDirectory,
        headless,
        devtools,
        userAgent,
    });

    const browser = await connect({
        browserWSEndpoint,
        defaultViewport,
        ...restOptions,
    });

    const originalNewPage = browser.newPage.bind(browser);
    browser.newPage = async function (...args) {
        const page = await originalNewPage(...args);
        await page.evaluateOnNewDocument(`console.log = {};`);
        return page;
    };

    return browser;
}

module.exports = { launch };
