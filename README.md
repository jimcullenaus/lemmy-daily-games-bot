## Running

1. Create a file called `.env` in the root directory. It should contain the following fields,
shown with their default values:

```env
LOGIN_INSTANCE_NAME='lemmy.zip'
POST_INSTANCE_NAME='lemmy.zip'
COMMUNITY_NAME='dailygames'
USERNAME='DailyGameBot'
PASSWORD=''
FEDERATION='local'
TIMEZONE='Australia/Brisbane'
CRON_EXPRESSION='0 0 14 * * *'
```

2. Run `npm i`
3. Run with `npm start`
