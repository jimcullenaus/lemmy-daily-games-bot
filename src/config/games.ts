export interface GameConfig {
    name: string;
    url: string;
    titlePrefix: string;
    screenshotSelector: string;
    screenshotActions: ScreenshotAction[];
    startDate: string; // ISO date for day numbering
}

export interface ScreenshotAction {
    type: 'click' | 'wait' | 'hide';
    selector?: string;
    text?: string;
    duration?: number;
    required?: boolean;
}

export const GAMES: GameConfig[] = [
    {
        name: 'Connections',
        url: 'https://www.nytimes.com/games/connections',
        titlePrefix: 'Connections',
        screenshotSelector: '#default-choices',
        startDate: '2023-06-12',
        screenshotActions: [
            { type: 'click', selector: '.purr-blocker-card__button', required: false },
            { type: 'click', text: 'Play', required: true },
            { type: 'wait', duration: 2000 },
            { type: 'click', selector: "//*[contains(@class, 'Tooltip-module_close')]//button", required: false },
            { type: 'click', selector: "//*[contains(@class, 'Popover-module_popover')]//button", required: false },
            { type: 'wait', duration: 200 },
            { type: 'click', selector: "//*[@role='button']", required: false },
            { type: 'wait', duration: 200 },
            { type: 'click', selector: "//*[@role='button']", required: false },
            { type: 'wait', duration: 500 }
        ]
    }
];
