type Env = NodeJS.ProcessEnv;

export default class AppConfig {
    public readonly loginInstanceName: string;
    public readonly postInstanceName: string;
    public readonly communityName: string;
    public readonly botUsername: string;
    public readonly password: string;
    public readonly timezone: string;
    public readonly cronExpression: string;
    public readonly forceDefaultCron: boolean;

    private constructor(env : Env) {
        this.loginInstanceName = AppConfig.requireEnv(env, 'LOGIN_INSTANCE_NAME');
        this.postInstanceName = AppConfig.requireEnv(env, 'POST_INSTANCE_NAME');
        this.communityName = AppConfig.requireEnv(env, 'COMMUNITY_NAME');
        this.botUsername = AppConfig.requireEnv(env, 'BOT_USERNAME');
        this.password = AppConfig.requireEnv(env, 'PASSWORD');
        this.timezone = AppConfig.requireEnv(env, 'TIMEZONE');
        this.cronExpression = AppConfig.requireEnv(env, 'CRON_EXPRESSION');
        const forceDefaultCronRaw = AppConfig.sanitise(env.FORCE_DEFAULT_CRON);
        this.forceDefaultCron = forceDefaultCronRaw.toLowerCase() === 'true';
    }

    public static fromEnvironment(env : Env = process.env) : AppConfig {
        return new AppConfig(env);
    }

    private static requireEnv(env : Env, key : string) : string {
        const value = AppConfig.sanitise(env[key]);
        if (!value) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
        return value;
    }

    private static sanitise(value : string | undefined) : string {
        if (value === undefined) {
            return '';
        }

        const trimmed = value.trim();
        if (trimmed.length >= 2 && trimmed[0] === trimmed[trimmed.length - 1]) {
            const isDoubleQuoted = trimmed.startsWith('"') && trimmed.endsWith('"');
            const isSingleQuoted = trimmed.startsWith("'") && trimmed.endsWith("'");
            if (isDoubleQuoted || isSingleQuoted) {
                return trimmed.slice(1, -1).trim();
            }
        }

        return trimmed;
    }
}
