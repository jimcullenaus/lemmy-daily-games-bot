A bot for automating the submission of daily games to the Lemmy [!dailygames@lemmy.zip](https://lemmy.zip/c/dailygames) community.

## Running

1. Create a file called `.env` in the root directory. It should contain the following fields,
shown with their original values:

```env
LOGIN_INSTANCE_NAME='lemmy.zip'
POST_INSTANCE_NAME='lemmy.zip'
COMMUNITY_NAME='dailygames'
BOT_USERNAME='DailyGameBot'
PASSWORD='***'
FEDERATION='local'
TIMEZONE='Australia/Brisbane'
CRON_EXPRESSION='0 0 14 * * *'
FORCE_DEFAULT_CRON='false'
```

Values may be wrapped in single or double quotes, or use no quotes at all; the application trims matching quotes automatically so you can use the same `.env` file for local `npm start` and Docker `--env-file`.
This ensures the same config can be used with `docker run` (which takes the input as literally written, including any quotes) and `npm start` (which implicitly strips the quotes).
If your password contains special characters such as quotes or "#", wrapping inputs in quotes may be less prone to errors.

2. Edit the `GAMES` entity in `games.ts` to contain each of the games to be posted, instructions for how to obtain the screenshot, and optionally the time to post them, if it doesn't match the global time.
3. Run `npm i`
4. Run with `npm start`

### Running in Docker

Ensure environment variables as above are set. `docker-compose up` will read from the `.env` file by default, or a different file can be specified with `docker-compose --env-file <filename> up`.

Use the prebuilt Docker image with `docker run --env-file=.env ghcr.io/jimcullenaus/lemmy-daily-games-bot`. The `env` file is mandatory in this case.

## Testing

1. Add an alternative environment file, `.env.development` with configuration for testing.
2. Optionally set `FORCE_DEFAULT_CRON='true'` to ignore any per-game cron expressions and use the global `CRON_EXPRESSION` for every game. This is useful when testing schedules locally.
3. Run with `npm run dev`
