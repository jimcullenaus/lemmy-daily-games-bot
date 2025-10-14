import LemmyBot from 'lemmy-bot';
import { config } from 'dotenv';
import GameService from './services/game-service';
import { GAMES } from './config/games';

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
    CRON_EXPRESSION
} = process.env as Record<string, string>;

console.log(`${LOGIN_INSTANCE_NAME}, ${POST_INSTANCE_NAME}, ${COMMUNITY_NAME}, ${BOT_USERNAME}, ${TIMEZONE}, ${CRON_EXPRESSION}`);

const bot = new LemmyBot({
    instance: LOGIN_INSTANCE_NAME,
    federation: 'all',
    credentials: {
        username: BOT_USERNAME,
        password: PASSWORD
    },
    schedule: {
        cronExpression: CRON_EXPRESSION,
        timezone: TIMEZONE,
        runAtStart: true,
        doTask: async (ref) => {
            const gameService = new GameService(ref.botActions, TIMEZONE, LOGIN_INSTANCE_NAME);
            const communityResponse = await ref.botActions.getCommunity({
                name: `${COMMUNITY_NAME}@${POST_INSTANCE_NAME}`
            });

            // Post for each configured game
            for (const gameConfig of GAMES) {
                try {
                    console.log(`Posting ${gameConfig.name}...`);
                    await gameService.postGameDaily(communityResponse.community_view.community.id, gameConfig);
                    console.log(`Successfully posted ${gameConfig.name}`);
                } catch (error) {
                    console.error(`Failed to post ${gameConfig.name}:`, error);
                    // Continue with other games even if one fails
                }
            }
        }
    }
});

bot.start();
