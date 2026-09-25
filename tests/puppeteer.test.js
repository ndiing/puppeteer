const puppeteer = require("../src/puppeteer.js");
// const puppeteer = require("puppeteer-core");

const fs = require("fs");

describe("puppeteer", () => {
    test("test", async () => {
        const browser = await puppeteer.launch({
            // headless: false,
        });
        const page = await browser.newPage();
        const urls = [
            // /* 0 */"https://www.google.com/recaptcha/api2/demo",
            // /* 1 */"https://www.apivoid.com/tools/bot-detection-test",
            // /* 2 */"https://bot.sannysoft.com",
            /* 3 */"https://pixelscan.net/bot-check",
            // /* 4 */"https://pixelscan.dev/bot",
            // /* 5 */"https://abrahamjuliot.github.io/creepjs/",
            // /* 6 */"https://browserleaks.com/",
            // /* 7 */"https://amiunique.org/",
            // /* 8 */"https://deviceinfo.me/",
            // /* 9 */"https://bsinet.bankbsi.co.id/",
        ];
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            await page.goto(url, {waitUntil: "networkidle2",});
            await new Promise((resolve) => setTimeout(resolve, 5000));
            // await page.screenshot({ path: `./tests/page${i}.png`, fullPage: true });
            // const html = await page.content()
            // fs.writeFileSync('./tests/page'+i+'.html',html)
        }
        await page.close();
        console.log('done')
    });
});
