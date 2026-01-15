import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  dbFile: string;
  secret: string;
  discordAppId: string;
  discordAppSecret: string;
  authorisedUsers: string[];
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST!,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbFile: process.env.DB_FILE_NAME!,
  secret: process.env.SECRET!,
  discordAppId: process.env.DISCORD_APP_ID!,
  discordAppSecret: process.env.DISCORD_APP_SECRET!,
  authorisedUsers: process.env.AUTHORISED_USERS!.split(","),
};

export default config;