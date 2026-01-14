import config from '../config';
import { drizzle } from 'drizzle-orm/libsql';

export default drizzle(config.dbFile!);