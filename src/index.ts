import express from 'express';
import { resolve } from 'path';
import config from './config';
import route from './routes';
import expressSession from 'express-session';
import SQLiteStore from 'connect-sqlite3';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';

/*
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
        .where(eq(entries.filename, entry.id));
    console.log('User info updated!')
})();*/


const app = express();
app.use(expressSession({
    store: new new SQLiteStore(expressSession)({ db: "sessions.db" }),
    secret: config.secret,
    cookie: { maxAge: 30 * 24*60*60*1000 },
}));
passport.use(new DiscordStrategy({
    clientID: config.discordAppId,
    clientSecret: config.discordAppSecret,
    callbackURL: config.host + 'auth/cb',
    scope: ['identify'],
}, (accessToken, refreshToken, profile, cb) => {
    profile.refreshToken = refreshToken;
    cb(null, profile);
}))
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));
app.use(passport.initialize());
app.use(passport.session());
app.set('views', './views');
app.locals.basedir = resolve() + '/views';
app.set('view engine', 'pug');
app.use((req, res, next) => {
    req["authorised"] = req.hasOwnProperty('user') && config.authorisedUsers.includes(req.user["id"]);
    next();
})
app.use(route);
app.use('/', express.static(resolve() + '/public'));
app.get('/js/shared.js', (req, res) => res.sendFile(resolve() + '/src/shared.ts', {headers:{"Content-Type": 'text/javascript'}}))
app.use('/file/', express.static(resolve() + '/gallery/files'));
app.use('/thumb/', express.static(resolve() + '/gallery/thumb'));

app.listen(config.port, () => console.log(`Web server started on port ${config.port}. This should be accessible from ${config.host}.`));