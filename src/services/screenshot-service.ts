import puppeteer, { Page } from "puppeteer";
import { loadImage, Image } from "canvas";

export default class ScreenshotService {
    async captureScreenshot(): Promise<Buffer> {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://www.nytimes.com/games/connections', { waitUntil: "networkidle2" });

        // Hide the ToS
        const tosButton = await page.$('.purr-blocker-card__button');
        if (tosButton) {
            await tosButton.click();
        }

        console.log('ToS button hidden');

        // Click the Play button
        await this.clickButton("//button[contains(text(), 'Play')]", page);
        console.log('Play button clicked');

        // Close the Hint tooltip if one exists
        await this.clickButton("//*[contains(@class, 'Tooltip-module_close')]", page, false);
        console.log('Hints tooltip closed, if it existed');

        // Get element for screenshotting
        const element = await page.waitForSelector('#default-choices', { visible: true, timeout: 5000 });

        if (element) {
            console.log('Game board found');
            const screenshot = await element.screenshot();
            console.log('Screenshot taken');
            await browser.close();
            const screenshotBuffer = Buffer.from(screenshot);
            return screenshotBuffer;
        } else {
            throw new Error('default choices was not found');
        }
    }

    private async clickButton(selector : string, context : Page, required = false) {
        // Click the Play button
        await context.evaluate((selector : string, required : boolean) => {
            const button = document.evaluate(
                selector,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue as HTMLElement;
            if (button) {
                button.click();
            } else if (required) {
                throw new Error(`no button found with selector "${selector}`);
            }
        }, selector, required);
    }
}
