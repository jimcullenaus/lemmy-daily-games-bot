import puppeteer, { Page } from "puppeteer";
import { setTimeout } from 'timers/promises';

export default class ScreenshotService {
    async captureScreenshot(): Promise<Buffer> {
        console.log('Launching Puppeteer browser');
        const browser = await puppeteer.launch({
            headless: true,
        });
        const page = await browser.newPage();
        await page.goto('https://www.nytimes.com/games/connections', { waitUntil: "networkidle2" });

        // Hide the ToS
        const tosButton = await page.$('.purr-blocker-card__button');
        if (tosButton) {
            await tosButton.click();
        }

        // Click the Play button
        await this.clickButton("//button[contains(text(), 'Play')]", page);

        // Wait 2 seconds to allow fade-in effect
        await setTimeout(2000);

        // Close the Hint tooltip if one exists
        await this.clickButton("//*[contains(@class, 'Tooltip-module_close')]//button", page, false);
        await this.clickButton("//*[contains(@class, 'Popover-module_popover')]//button", page, false);

        // Fade out
        await setTimeout(200);

        // Close login button and Hint tooltip
        // Yes, Hint tooltip is theoretically done above, but it wasn't working, so brute force it
        await this.clickButton("//*[@role='button']", page, false);
        await setTimeout(200);
        await this.clickButton("//*[@role='button']", page, false);
        await setTimeout(500);

        // Get element for screenshotting
        const element = await page.waitForSelector('#default-choices', { visible: true, timeout: 5000 });

        if (element) {
            const screenshot = await element.screenshot();
            console.log('Connections screenshot taken');
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
                console.log(`no button found with selector "${selector}`);
            }
        }, selector, required);
    }
}
