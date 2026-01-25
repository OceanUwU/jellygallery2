
import { Router } from 'express';
import db from '../db';
import { eq, desc, asc, and, count, sql, exists, like } from 'drizzle-orm';
import { entries, entryTags, tags, TagType } from '../db/schema';

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

const pageLimit = 80;
const maxPageLimit = 200;
router.get('/entries', async (req, res) => {
    let page = 0;
    if (typeof req.query.p == "string")
        page = Number.parseInt(req.query.p);
    if (Number.isNaN(page) || page < 0) return res.status(400).send("invalid page number");
    let tagFilter = [];
    if (typeof req.query.t == "string")
        tagFilter = req.query.t.split('-').map(t => Number.parseInt(t));
    tagFilter = tagFilter.filter((t, i) => tagFilter.indexOf(t) === i);
    if (tagFilter.some(t => Number.isNaN(t))) return res.status(400).send("invalid tag supplied");
    let search = null;
    if (typeof req.query.q == "string")
        search = req.query.q;
    if (search != null && search.length == 0)
        search = null;
    if (search != null && search.length > 25) return res.status(400).send("search query too long (max 25 chars)");
    let limit = pageLimit;
    if (typeof req.query.limit == "string") {
        let qLimit = Number.parseInt(req.query.limit);
        if (!Number.isNaN(qLimit))
            limit = Math.min(maxPageLimit, Math.max(qLimit, 1));
    }
    let condition = eq(entries.listed, true);
    for (let tag of tagFilter)
        condition = and(exists(db.select().from(entryTags).where(and(eq(entryTags.entry, entries.id), eq(entryTags.tag, tag)))), condition);
    if (search != null)
        condition = and(like(entries.title, "%"+search+"%"), condition)
    let entry = await db.select({id: entries.filename, ext: entries.filetype, title: entries.title, date: entries.date}).from(entries).where(condition).orderBy(desc(entries.date)).offset(limit * page).limit(limit);
    let max = (await db.select({count: count()}).from(entries).where(condition))[0].count;
    res.json({
        from: limit * page + 1,
        to: Math.min(max, limit * page + entry.length),
        of: max,
        entries: entry,
    });
});

router.get('/arc/:arc/:entry', async (req, res) => {
    let id = Number.parseInt(req.params.arc);
    if (Number.isNaN(id)) return res.status(400).send("id must be a number");
    let entry = (await db.select().from(entries).where(eq(entries.filename, req.params.entry)));
    if (entry.length == 0)
        return res.status(400).send("entry does not exist");
    if ((await db.select().from(tags).where(and(eq(tags.id, id), eq(tags.type, TagType.Arc)))).length == 0)
        return res.status(400).send("arc does not exist");
    if ((await db.select().from(entryTags).where(and(eq(entryTags.entry, entry[0].id), eq(entryTags.tag, id)))).length == 0)
        return res.status(400).send("arc does not contain that entry");
    res.send(await db.get(sql`SELECT * FROM (
  SELECT filename, id, LEAD(entries.filename) OVER w AS prev, LAG(entries.filename) OVER w AS next
  FROM entries WHERE listed = 1 AND exists (SELECT entry FROM entry_tags WHERE entry = id AND tag = ${id})
  WINDOW w AS (ORDER BY entries.date DESC, entries.filename)
) WHERE filename = ${req.params.entry};`));
});

export default router;