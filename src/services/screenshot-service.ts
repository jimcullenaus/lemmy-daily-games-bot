import puppeteer, { Page } from "puppeteer";
import { setTimeout } from 'timers/promises';
import { GameConfig, ScreenshotAction } from '../config/games';

export default class ScreenshotService {
    async captureScreenshot(gameConfig: GameConfig): Promise<Buffer> {
        console.log(`Launching Puppeteer browser for ${gameConfig.name}`);
        const launchOptions: any = {
            headless: true,
            args: [
                // '--no-sandbox',
                // '--disable-setuid-sandbox',
                // '--disable-dev-shm-usage',
                // '--disable-accelerated-2d-canvas',
                // '--no-first-run',
                // '--disable-gpu',
                // '--disable-background-networking',
                // '--disable-background-timer-throttling',
                // '--disable-backgrounding-occluded-windows',
                // '--disable-breakpad',
                // '--disable-client-side-phishing-detection',
                // '--disable-component-update',
                // '--disable-default-apps',
                // '--disable-domain-reliability',
                // '--disable-extensions',
                // '--disable-features=AudioServiceOutOfProcess',
                // '--disable-hang-monitor',
                // '--disable-ipc-flooding-protection',
                // '--disable-notifications',
                // '--disable-offer-store-unmasked-wallet-cards',
                // '--disable-popup-blocking',
                // '--disable-print-preview',
                // '--disable-prompt-on-repost',
                // '--disable-renderer-backgrounding',
                // '--disable-speech-api',
                // '--disable-sync',
                // '--hide-scrollbars',
                // '--ignore-gpu-blacklist',
                // '--metrics-recording-only',
                // '--mute-audio',
                // '--no-default-browser-check',
                // '--no-pings',
            ]
        };

        // Use system Chromium if available (for ARM/Raspberry Pi)
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
            console.log(`Using system Chromium at: ${launchOptions.executablePath}`);
        }

        const browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.goto(gameConfig.url, { waitUntil: "networkidle2" });

        // Execute all screenshot actions
        await this.executeScreenshotActions(page, gameConfig.screenshotActions);

        // Try to find element in main page first
        let element = await page.waitForSelector(gameConfig.screenshotSelector, { visible: true, timeout: 2000 }).catch(() => null);

        // If not found in main page, try to find it in iframes
        if (!element) {
            console.log(`Element ${gameConfig.screenshotSelector} not found in main page, searching in iframes...`);
            element = await this.findElementInIframes(page, gameConfig.screenshotSelector);
        }

        if (element) {
            const screenshot = await element.screenshot();
            console.log(`${gameConfig.name} screenshot taken`);
            await browser.close();
            const screenshotBuffer = Buffer.from(screenshot);
            return screenshotBuffer;
        } else {
            throw new Error(`${gameConfig.screenshotSelector} was not found in main page or any iframe`);
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
                `//button[.//text()[contains(., '${text}')]]`,
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

    private async findElementInIframes(page: Page, selector: string): Promise<any> {
        // Get all iframes on the page
        const iframes = await page.frames();

        for (const frame of iframes) {
            // Skip the main frame (we already checked it)
            if (frame === page.mainFrame()) {
                continue;
            }

            try {
                console.log(`Searching for ${selector} in iframe: ${frame.url()}`);

                // Wait for the element in this iframe
                const element = await frame.waitForSelector(selector, {
                    visible: true,
                    timeout: 3000
                }).catch(() => null);

                if (element) {
                    console.log(`Found element ${selector} in iframe: ${frame.url()}`);
                    return element;
                }
            } catch (error) {
                console.log(`Error searching in iframe ${frame.url()}: ${error}`);
                // Continue to next iframe
            }
        }

        return null;
    }
}
