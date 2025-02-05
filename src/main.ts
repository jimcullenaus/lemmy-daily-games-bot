import LemmyBot from 'lemmy-bot';
import { config } from 'dotenv';
import ConnectionsService from './services/connections-service';

let path: string;

const env = process.argv[2];
if (env && env === 'dev') {
    path = '.env.development.local';
} else {
    path = '.env';
}

config({
    override: true,
    path
});

const {
    LOGIN_INSTANCE_NAME,
    POST_INSTANCE_NAME,
    COMMUNITY_NAME,
    USERNAME,
    PASSWORD,
    TIMEZONE,
    CRON_EXPRESSION
} = process.env as Record<string, string>;


const bot = new LemmyBot({
    instance: LOGIN_INSTANCE_NAME,
    federation: 'all',
    credentials: {
        username: USERNAME,
        password: PASSWORD
    },
    schedule: {
        cronExpression: CRON_EXPRESSION,
        timezone: TIMEZONE,
        runAtStart: true,
        doTask: async (ref) => {
            const connectionsService = new ConnectionsService(ref.botActions, TIMEZONE);
            const communityResponse = await ref.botActions.getCommunity({
                name: `${COMMUNITY_NAME}@${POST_INSTANCE_NAME}`,
            });

            await connectionsService.postConnectionsDaily(communityResponse.community_view.community.id);

        }
    }
});

bot.start();
