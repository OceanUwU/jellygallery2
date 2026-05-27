import { Router } from 'express';
import auth from './auth';
import admin from './admin';
import api from './api';
import entry from './entry';
import cached from '../cached';
import { resolve } from 'path';
import { eq, and, asc } from 'drizzle-orm';
import { entries, entryTags, tags, TagType } from '../db/schema';
import db from '../db';

const router = Router();

router.use((req, res, next) => {
    res.locals.url = req.url;
    next();
});
router.get('/', (req, res) => res.render('home'));
router.get('/entries', (req, res) => res.render('entries', { tags: cached.tags }));
router.get('/arcs', async(req, res) => {
    let arcs = (await Promise.all((await db.select().from(tags).where(eq(tags.type, TagType.Arc))).map(async t => ({
        ...t,
        entries: await db.select()
            .from(entryTags)
            .leftJoin(entries, eq(entries.id, entryTags.entry))
            .where(and(eq(entryTags.tag, t.id), eq(entries.listed, true)))
            .orderBy(asc(entries.date))
    }))))
        .filter(a => a.entries.length > 0);
    arcs.sort((a, b) => (a.entries[0].entries!.date.valueOf() - b.entries[0].entries!.date.valueOf()));
    res.render('arcs', { arcs });
});
router.get('/rss', (req, res) => res.sendFile(resolve() + '/rss.xml', {headers:{"Content-Type": 'application/xml'}}));
router.use('/api/', api);
router.use('/auth/', auth);
router.use('/admin/', admin);
router.use('/e/', entry);

export default router;