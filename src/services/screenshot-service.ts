import puppeteer, { Page } from "puppeteer";
import { setTimeout } from 'timers/promises';
import { GameConfig } from '../config/games';

export default class ScreenshotService {
    async captureScreenshot(gameConfig: GameConfig): Promise<Buffer> {
        console.log(`Launching Puppeteer browser for ${gameConfig.name}`);

        // Build browser args - disable sandbox if requested (needed for some Docker/ARM setups)
        const args: string[] = [];
        if (process.env.PUPPETEER_DISABLE_SANDBOX === 'true') {
            args.push('--no-sandbox', '--disable-setuid-sandbox');
        }

        const browser = await puppeteer.launch({
            headless: true,
            args
        });
        const page = await browser.newPage();
        await page.goto(gameConfig.url, { waitUntil: "networkidle2" });

        // Execute all screenshot actions
        await this.executeScreenshotActions(page, gameConfig);

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

    private async executeScreenshotActions(page: Page, gameConfig: GameConfig): Promise<void> {
        for (const action of gameConfig.screenshotActions) {
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
                    if (action.selector) {
                        await this.hideElements(action.selector, page);
                    }
                    break;
                case 'dismissPopups':
                    await this.dismissPopups(page, gameConfig.screenshotSelector);
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

    private async hideElements(selector: string, page: Page) {
        await page.evaluate((selector: string) => {
            document.querySelectorAll<HTMLElement>(selector)
                .forEach(el => el.style.setProperty('display', 'none', 'important'));
        }, selector);
    }

    /**
     * Repeatedly press Esc and click 'x' buttons of any visible popup, until none are left.
     * Then hide anything that still remains (and doesn't contain the screenshot target).
     */
    private async dismissPopups(page: Page, targetSelector: string, maxRounds = 5) {
        const popupSelector = [
            '[role="dialog"]', '[role="alertdialog"]', '[aria-modal="true"]', 'dialog[open]',
            '[class*="modal" i]', '[class*="popover" i]', '[class*="tooltip" i]', '[class*="popup" i]',
            '[class*="banner" i]', '[class*="overlay" i]', '[class*="toast" i]', '[class*="blocker" i]',
            '[id*="modal" i]', '[id*="banner" i]', '[id*="popup" i]'
        ].join(',');
        const closeSelector = [
            '[aria-label*="close" i]', '[aria-label*="dismiss" i]', '[title*="close" i]',
            '[class*="close" i]', '[class*="dismiss" i]', '[data-testid*="close" i]'
        ].join(',');
        // Button labels that make a popup go away without committing to anything
        const closeText = '^(close|dismiss|×|✕|✖|x|got it|ok|okay|no thanks|not now|maybe later|reject all|skip)$';

        for (let round = 0; round < maxRounds; round++) {
            await page.keyboard.press('Escape').catch(() => null);

            const dismissed: string[] = await page.evaluate((popupSelector: string, closeSelector: string, closeText: string, targetSelector: string) => {
                const closeTextRegex = new RegExp(closeText, 'i');
                const target = document.querySelector(targetSelector);
                const results: string[] = [];

                const popups = Array.from(document.querySelectorAll<HTMLElement>(popupSelector)).filter(el => {
                    const style = getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    return rect.width > 1 && rect.height > 1
                        && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
                        // Only try each popup once; leftovers get hidden afterwards
                        && !el.hasAttribute('data-screenshot-dismissed')
                        // Never touch the game itself
                        && !(target && (el.contains(target) || target.contains(el)));
                });

                for (const popup of popups) {
                    const buttons = Array.from(popup.querySelectorAll<HTMLElement>('button, [role="button"]'))
                        .filter(b => b.getBoundingClientRect().width > 0);
                    // Prefer explicit close controls (on the button or a wrapper inside the popup), then dismissive labels
                    const closeButton = buttons.find(b => {
                            const closeControl = b.closest(closeSelector);
                            return closeControl !== null && closeControl !== popup && popup.contains(closeControl);
                        })
                        ?? buttons.find(b => closeTextRegex.test((b.innerText || b.getAttribute('aria-label') || '').trim()));

                    popup.setAttribute('data-screenshot-dismissed', '');
                    if (closeButton) {
                        closeButton.click();
                        results.push(`${popup.id || popup.className.toString().split(' ')[0] || popup.tagName} -> "${(closeButton.getAttribute('aria-label') || closeButton.innerText || '').trim()}"`);
                    }
                }
                return results;
            }, popupSelector, closeSelector, closeText, targetSelector);

            if (dismissed.length > 0) {
                console.log(`Dismissed popups: ${dismissed.join('; ')}`);
            } else if (round > 0) {
                // Always do at least two passes, as popups can still be animating in on the first
                break;
            }
            await setTimeout(500);
        }

        // Last resort: hide any floating popup-like or fixed-position element that is still visible
        const hidden: string[] = await page.evaluate((popupSelector: string, targetSelector: string) => {
            const target = document.querySelector(targetSelector);
            const results: string[] = [];
            for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
                const style = getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                const isDialog = el.matches('[role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog[open]');
                const isFloatingPopup = el.matches(popupSelector) && style.position === 'absolute';
                if ((isDialog || isFloatingPopup || style.position === 'fixed')
                    && rect.width > 1 && rect.height > 1
                    && style.display !== 'none' && style.visibility !== 'hidden'
                    && !(target && (el.contains(target) || target.contains(el)))) {
                    el.style.setProperty('display', 'none', 'important');
                    results.push(el.id || el.className.toString().split(' ')[0] || el.tagName);
                }
            }
            return results;
        }, popupSelector, targetSelector);

        if (hidden.length > 0) {
            console.log(`Hid popups that could not be closed: ${hidden.join(', ')}`);
        }
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
