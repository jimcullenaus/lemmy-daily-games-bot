import LemmyBot from 'lemmy-bot';
import { config } from 'dotenv';
import GameService from './services/game-service';
import { GAMES, GameConfig } from './config/games';
import AppConfig from './config/app-config';

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

const appConfig = AppConfig.fromEnvironment();

console.log(`@${appConfig.botUsername}@${appConfig.loginInstanceName}, !${appConfig.communityName}@${appConfig.postInstanceName}, ${appConfig.timezone}, ${appConfig.cronExpression}, FORCE_DEFAULT_CRON=${appConfig.forceDefaultCron}`);

const forceDefaultCron = appConfig.forceDefaultCron;

// Group games by their effective cron (per-game or global)
const gamesByCron = new Map<string, GameConfig[]>();
for (const game of GAMES) {
    const cron = (!forceDefaultCron && game.cronExpression) ? game.cronExpression : appConfig.cronExpression;
    if (!gamesByCron.has(cron)) {
        gamesByCron.set(cron, []);
    }
    gamesByCron.get(cron)!.push(game);
}

// Create task for each unique cron schedule
const tasks = Array.from(gamesByCron.entries()).map(([cron, games]) => ({
    cronExpression: cron,
    timezone: appConfig.timezone,
    doTask: async (ref: any) => {
        const gameService = new GameService(ref.botActions, appConfig.timezone, appConfig.loginInstanceName);
        const communityResponse = await ref.botActions.getCommunity({
            name: `${appConfig.communityName}@${appConfig.postInstanceName}`
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
    instance: appConfig.loginInstanceName,
    credentials: {
        username: appConfig.botUsername,
        password: appConfig.password
    },
    schedule: tasks
});

bot.start();
console.log(`Started bot with ${tasks.length} schedule(s):`);
tasks.forEach((task, index) => {
    const games = gamesByCron.get(task.cronExpression)!;
    console.log(`  Schedule ${index + 1}: "${task.cronExpression}" for games: ${games.map(g => g.name).join(', ')}`);
});

// Handle shutdown signals gracefully
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    bot.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    bot.stop();
    process.exit(0);
});
