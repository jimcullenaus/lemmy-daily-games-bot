export interface GameConfig {
    name: string;
    url: string;
    titlePrefix: string;
    screenshotSelector: string;
    screenshotActions: ScreenshotAction[];
    startDate: string; // ISO date for day numbering
    cronExpression?: string; // Optional per-game schedule (defaults to global CRON_EXPRESSION)
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
        ],
        cronExpression: '0 4 14 * * *'
    },
    {
        name: 'Circuits',
        url: 'https://www.puzzmo.com/play/circuits',
        titlePrefix: 'Circuits',
        screenshotSelector: '.circuits', // This element is inside an iframe with id 'game-iframe'
        startDate: '2023-10-16', // Start date calculated so Oct 13, 2025 = day 729
        cronExpression: '0 4 15 * * *',
        screenshotActions: [
            { type: 'wait', duration: 5000 } // Wait 5 seconds for page and iframe to load
        ]
    },
    {
        name: 'Crossherd',
        url: 'https://crossherd.clevergoat.com/',
        titlePrefix: 'Crossherd',
        screenshotSelector: 'app-game',
        startDate: '2025-03-09', // Start date calculated so Oct 14, 2025 = day 220
        screenshotActions: [
            { type: 'click', selector: '#toggleDarkMode', required: false },
            { type: 'wait', duration: 500 },
            { type: 'click', text: 'Start', required: true },
            { type: 'wait', duration: 1000 }
        ],
        cronExpression: '0 4 14 * * *'
    }
];
