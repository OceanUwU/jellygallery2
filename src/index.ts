import express from 'express';
import { resolve } from 'path';
import config from './config';
import route from './routes';
import db from './db';
import { entries } from './db/schema';
import { eq } from 'drizzle-orm';

(async () => {
    const entry: typeof entries.$inferInsert = {
        id: "test",
        filetype: "png",
        title: "Test",
        date: 0,
    }

    await db.insert(entries).values(entry);

    const users = await db.select().from(entries);
    console.log('Getting all users from the database: ', users);
    await db.update(entries)
        .set({
        date: 1,
        })
        .where(eq(entries.id, entry.id));
    console.log('User info updated!')
})();

const app = express();
app.set('views', './views');
app.locals.basedir = resolve() + '/views';
app.set('view engine', 'pug');
app.use('/', express.static(resolve() + '/public'));
app.use(route);

app.listen(config.port, () => console.log(`Web server started on port ${config.port}. This should be accessible from ${config.host}.`));