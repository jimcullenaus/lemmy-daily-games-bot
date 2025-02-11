import { setTimeout } from 'timers/promises'
import { BotActions } from 'lemmy-bot/dist/types';
import ScreenshotService from './screenshot-service';
import TitleService from './title-service';

export default class ConnectionsService {

    private _botActions : BotActions;
    private _titleService : TitleService;
    private _screenshotService : ScreenshotService;

    private _instance : string;

    constructor(botActions : BotActions, TIMEZONE : string, LOGIN_INSTANCE_NAME : string) {
        this._botActions = botActions;
        this._titleService = new TitleService(TIMEZONE);
        this._instance = LOGIN_INSTANCE_NAME;
        this._screenshotService = new ScreenshotService();
    }

    public async postConnectionsDaily(communityId : number) {
        const title = this._titleService.getTitle();

        console.log(`title is ${title}`);

        const screenshot = await this.captureScreenshot();

        // If screenshot was not obtained, make URL blank
        const imageUrl = screenshot ? await this.uploadImage(screenshot) : '';
        const body = 'https://www.nytimes.com/games/connections';
        const createPostResponse = await this._botActions.createPost({
            name: title,
            body: body,
            community_id: communityId,
            url: imageUrl
        });

        console.log(`created post: https://${this._instance}/post/${createPostResponse.post_view.post.id}`);
    }

    private async captureScreenshot() : Promise<Buffer | null> {
        for (let i = 0; i < 5; ++i) {
            try {
                return await this._screenshotService.captureScreenshot();
            } catch (e) {
                console.log(e);
            }

            // double delay each time, starting at 1 second
            const delay = (2 ** i) * 1000;
            await setTimeout(delay)
        }

        return null;
    }

    private async uploadImage(screenshot: Buffer<ArrayBufferLike>) : Promise<string> {
        for (let i = 0; i < 5; ++i) {
            try {
                const image = await this._botActions.uploadImage(screenshot);
                if (image.url) {
                    return image.url;
                } else {
                    console.log(image);
                    throw new Error('no url returned from uploading image');
                }
            } catch (e) {
                console.log('error uploading image');
                console.log(e);
            }

            // double delay each time, starting at 1 second
            const delay = (2 ** i) * 1000;
            await setTimeout(delay)
        }

        return '';
    }
}
