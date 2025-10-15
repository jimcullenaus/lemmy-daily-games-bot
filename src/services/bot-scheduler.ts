import LemmyBot from 'lemmy-bot';
import GameService from './game-service';
import { GameConfig } from '../config/games';

type StartOptions = {
    cron: string;
    games: GameConfig[];
    runAtStart?: boolean;
};

export default class BotScheduler {
    private _instance: string;
    private _timezone: string;
    private _communityName: string;
    private _postInstanceName: string;
    private _username: string;
    private _password: string;

    constructor(options: {
        instance: string;
        timezone: string;
        communityName: string;
        postInstanceName: string;
        username: string;
        password: string;
    }) {
        this._instance = options.instance;
        this._timezone = options.timezone;
        this._communityName = options.communityName;
        this._postInstanceName = options.postInstanceName;
        this._username = options.username;
        this._password = options.password;
    }

    public start({ cron, games, runAtStart = false }: StartOptions) {
        const bot = new LemmyBot({
            instance: this._instance,
            federation: 'all',
            credentials: {
                username: this._username,
                password: this._password
            },
            schedule: {
                cronExpression: cron,
                timezone: this._timezone,
                runAtStart,
                doTask: async (ref) => {
                    const gameService = new GameService(ref.botActions, this._timezone, this._instance);
                    const communityResponse = await ref.botActions.getCommunity({
                        name: `${this._communityName}@${this._postInstanceName}`
                    });

                    for (const gameConfig of games) {
                        try {
                            console.log(`Posting ${gameConfig.name}...`);
                            await gameService.postGameDaily(communityResponse.community_view.community.id, gameConfig);
                            console.log(`Successfully posted ${gameConfig.name}`);
                        } catch (error) {
                            console.error(`Failed to post ${gameConfig.name}:`, error);
                        }
                    }
                }
            }
        });

        bot.start();
        console.log(`Started schedule: ${cron} for games: ${games.map(g => g.name).join(', ')}`);
    }
}


