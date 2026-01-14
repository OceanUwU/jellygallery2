import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  dbFile: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST!,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbFile: process.env.DB_FILE_NAME!,
};

export default config;