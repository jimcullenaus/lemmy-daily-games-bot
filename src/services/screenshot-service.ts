import puppeteer, { Page } from "puppeteer";
import { setTimeout } from 'timers/promises';
import { GameConfig, ScreenshotAction } from '../config/games';

export default class ScreenshotService {
    async captureScreenshot(gameConfig: GameConfig): Promise<Buffer> {
        console.log(`Launching Puppeteer browser for ${gameConfig.name}`);
        const browser = await puppeteer.launch({
            headless: true,
        });
        const page = await browser.newPage();
        await page.goto(gameConfig.url, { waitUntil: "networkidle2" });

        // Execute all screenshot actions
        await this.executeScreenshotActions(page, gameConfig.screenshotActions);

        // Get element for screenshotting
        const element = await page.waitForSelector(gameConfig.screenshotSelector, { visible: true, timeout: 5000 });

        if (element) {
            const screenshot = await element.screenshot();
            console.log(`${gameConfig.name} screenshot taken`);
            await browser.close();
            const screenshotBuffer = Buffer.from(screenshot);
            return screenshotBuffer;
        } else {
            throw new Error(`${gameConfig.screenshotSelector} was not found`);
        }
    }

    private async executeScreenshotActions(page: Page, actions: ScreenshotAction[]): Promise<void> {
        for (const action of actions) {
            switch (action.type) {
                case 'click':
                    if (action.selector) {
                        await this.clickButton(action.selector, page, action.required);
                    } else if (action.text) {
                        await this.clickButtonByText(action.text, page, action.required);
                    }
                    break;
                case 'wait':
                    if (action.duration) {
                        await setTimeout(action.duration);
                    }
                    break;
                case 'hide':
                    // Future: implement hiding elements
                    break;
            }
        }
    }

    private async clickButton(selector : string, context : Page, required = false) {
        await context.evaluate((selector : string, required : boolean) => {
            let button: HTMLElement | null = null;

            // Check if it's an XPath expression (starts with // or contains XPath syntax)
            if (selector.startsWith('//') || selector.includes('[') && selector.includes(']')) {
                button = document.evaluate(
                    selector,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue as HTMLElement;
            } else {
                // CSS selector
                button = document.querySelector(selector) as HTMLElement;
            }

            if (button) {
                button.click();
            } else if (required) {
                console.log(`no button found with selector "${selector}`);
            }
        }, selector, required);
    }

    private async clickButtonByText(text : string, context : Page, required = false) {
        await context.evaluate((text : string, required : boolean) => {
            const button = document.evaluate(
                `//button[contains(text(), '${text}')]`,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue as HTMLElement;
            if (button) {
                button.click();
            } else if (required) {
                console.log(`no button found with text "${text}`);
            }
        }, text, required);
    }
}
