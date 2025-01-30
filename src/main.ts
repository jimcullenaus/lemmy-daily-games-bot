import LemmyBot from 'lemmy-bot';
import { config } from 'dotenv';
import TitleService from './services/title-service';
import ScreenshotService from './services/screenshot-service';

config({
    override: true
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
console.log(`${LOGIN_INSTANCE_NAME},${POST_INSTANCE_NAME},${COMMUNITY_NAME},${USERNAME},${TIMEZONE},${CRON_EXPRESSION}`);
const _titleService = new TitleService();
const _screenshotService = new ScreenshotService();

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
            const communityResponse = await ref.botActions.getCommunity({
                name: `${COMMUNITY_NAME}@${POST_INSTANCE_NAME}`,
            });

            const title = _titleService.getTitle();
            const screenshot = await _screenshotService.captureScreenshot();
            console.log('Screenshot returned');
            let imageUrl : string;
            try {
                const image = await ref.botActions.uploadImage(screenshot);
                if (image.url) {
                    imageUrl = image.url;
                } else {
                    console.log(image);
                    throw new Error('no url returned from uploading image');
                }
            } catch (e) {
                console.log('error uploading image');
                console.log(e);
                throw e;
            }

            const body = 'https://www.nytimes.com/games/connections';
            const createPostResponse = await ref.botActions.createPost({
                name: title,
                body: body,
                community_id: (communityResponse).community_view.community.id,
                url: imageUrl
            });

            console.log('created post');
        }
    }
});

bot.start();
