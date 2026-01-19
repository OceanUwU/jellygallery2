
import { Router } from 'express';
import db from '../db';
import { eq, desc, asc, count } from 'drizzle-orm';
import { entries, entryTags, tags } from '../db/schema';

const router = Router();

router.get('/tag/:id', async (req, res) => {
    let id = Number.parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).send("id must be a number");
    let tag = await db.select({id: tags.id, name: tags.name, type: tags.type, description: tags.description}).from(tags).where(eq(tags.id, id));
    if (tag.length == 0) return res.sendStatus(404);
    res.json(tag[0]);
});

router.get('/e/:id', async (req, res) => {
    let entry = await db.select({i: entries.id, id: entries.filename, ext: entries.filetype, title: entries.title, description: entries.description, date: entries.date, listed: entries.listed}).from(entries).where(eq(entries.filename, req.params.id));
    if (entry.length == 0) return res.sendStatus(404);
    let e = entry[0];
    e['tags'] = await db.select({id: entryTags.tag, type: tags.type, name: tags.name}).from(entryTags).where(eq(entryTags.entry, e.i)).orderBy(entryTags.order).leftJoin(tags, eq(tags.id, entryTags.tag));
    res.json(e);
});

const pageLimit = 10;
const maxPageLimit = 200;
router.get('/entries/:page', async (req, res) => {
    let page = Number.parseInt(req.params.page);
    if (Number.isNaN(page) || page < 0) return res.status(400).send("invalid page number");
    let limit = pageLimit;
    if (typeof req.query.limit == "string") {
        let qLimit = Number.parseInt(req.query.limit);
        if (!Number.isNaN(qLimit))
            limit = Math.min(maxPageLimit, Math.max(qLimit, 1));
    }
    let entry = await db.select({id: entries.filename, ext: entries.filetype, title: entries.title, description: entries.description, date: entries.date, listed: entries.listed}).from(entries).where(eq(entries.listed, true)).orderBy(entries.date).offset(limit * page).limit(limit);
    let max = (await db.select({count: count()}).from(entries).where(eq(entries.listed, true)))[0].count;
    res.json({
        from: limit * page + 1,
        to: Math.min(max, limit * page + entry.length),
        of: max,
        entries: entry,
    });
});

export default router;