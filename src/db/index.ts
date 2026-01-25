import config from '../config';
import { drizzle } from 'drizzle-orm/libsql';

export default drizzle("file:data.db");