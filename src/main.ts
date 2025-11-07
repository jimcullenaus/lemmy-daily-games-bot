import LemmyBot from 'lemmy-bot';
import { config } from 'dotenv';
import GameService from './services/game-service';
import { GAMES, GameConfig } from './config/games';

// Parse the env file if environment variables not already set
if (!process.env.LOGIN_INSTANCE_NAME
    || !process.env.POST_INSTANCE_NAME
    || !process.env.COMMUNITY_NAME
    || !process.env.BOT_USERNAME
    || !process.env.PASSWORD
    || !process.env.TIMEZONE
    || !process.env.CRON_EXPRESSION) {
    let path : string;

    const env = process.argv[2];
    if (env && env === 'dev') {
        console.log('reading from dev env file');
        path = '.env.development';
    } else {
        console.log('reading from prod env file');
        path = '.env';
    }

    config({
        override: true,
        path
    });
}

const {
    LOGIN_INSTANCE_NAME,
    POST_INSTANCE_NAME,
    COMMUNITY_NAME,
    BOT_USERNAME,
    PASSWORD,
    TIMEZONE,
    CRON_EXPRESSION,
    RUN_AT_START
} = process.env as Record<string, string>;

console.log(`${LOGIN_INSTANCE_NAME}, ${POST_INSTANCE_NAME}, ${COMMUNITY_NAME}, ${BOT_USERNAME}, ${TIMEZONE}, ${CRON_EXPRESSION}, RUN_AT_START=${RUN_AT_START}`);

// Validate timezone is supported by Intl API
try {
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE });
} catch (error) {
    console.error(`ERROR: Invalid timezone '${TIMEZONE}'. This is often caused by missing ICU (International Components for Unicode) support in Node.js.`);
    console.error(`On Docker/ARM systems, ensure tzdata is installed and TZ environment variable is set.`);
    console.error(`Error details:`, error);
    process.exit(1);
}

// Parse runAtStart from environment (strict true only), default false
const runAtStart = (RUN_AT_START ?? '').trim().toLowerCase() === 'true';

// Group games by their effective cron (per-game or global)
const gamesByCron = new Map<string, GameConfig[]>();
for (const game of GAMES) {
    const cron = game.cronExpression || CRON_EXPRESSION;
    if (!gamesByCron.has(cron)) {
        gamesByCron.set(cron, []);
    }
    gamesByCron.get(cron)!.push(game);
}

// Create task for each unique cron schedule
const tasks = Array.from(gamesByCron.entries()).map(([cron, games]) => ({
    cronExpression: cron,
    timezone: TIMEZONE,
    runAtStart: runAtStart,
    doTask: async (ref: any) => {
        const gameService = new GameService(ref.botActions, TIMEZONE, LOGIN_INSTANCE_NAME);
        const communityResponse = await ref.botActions.getCommunity({
            name: `${COMMUNITY_NAME}@${POST_INSTANCE_NAME}`
        });

        // Post each game for this cron schedule
        for (const gameConfig of games) {
            try {
                console.log(`Posting ${gameConfig.name} (scheduled for ${cron})...`);
                await gameService.postGameDaily(communityResponse.community_view.community.id, gameConfig);
                console.log(`Successfully posted ${gameConfig.name}`);
            } catch (error) {
                console.error(`Failed to post ${gameConfig.name}:`, error);
            }
        }
    }
}));

const bot = new LemmyBot({
    instance: LOGIN_INSTANCE_NAME,
    credentials: {
        username: BOT_USERNAME,
        password: PASSWORD
    },
    schedule: tasks
});

bot.start();
console.log(`Started bot with ${tasks.length} schedule(s):`);
tasks.forEach((task, index) => {
    const games = gamesByCron.get(task.cronExpression)!;
    console.log(`  Schedule ${index + 1}: "${task.cronExpression}" for games: ${games.map(g => g.name).join(', ')}`);
});
