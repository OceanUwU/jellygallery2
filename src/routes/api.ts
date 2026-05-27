
import { Router } from 'express';
import db from '../db';
import { eq, desc, asc, and, count, sql, exists, like, SQL } from 'drizzle-orm';
import { entries, Entry, entryTags, favourites, Tag, tags, TagType } from '../db/schema';
import { getSearchQuery } from '../util';

const router = Router();

interface APITag {
    id: number;
    type: number | null;
    name: string | null;
};
interface APIEntry {
    i: number;
    id: string;
    ext: string;
    title: string;
    description: string | null;
    date: Date;
    listed: boolean;
    tags?: Array<APITag>;
};

router.get('/tag/:id', async (req, res) => {
    let id = Number.parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).send("id must be a number");
    let tag = await db.select({id: tags.id, name: tags.name, type: tags.type, description: tags.description}).from(tags).where(eq(tags.id, id));
    if (tag.length == 0) return res.sendStatus(404);
    res.json(tag[0]);
});

router.get('/e/:id', async (req, res) => {
    let entry: Array<APIEntry> = await db.select({i: entries.id, id: entries.filename, ext: entries.filetype, title: entries.title, description: entries.description, date: entries.date, listed: entries.listed}).from(entries).where(eq(entries.filename, req.params.id));
    if (entry.length == 0) return res.sendStatus(404);
    let e = entry[0];
    e.tags = await db.select({id: entryTags.tag, type: tags.type, name: tags.name}).from(entryTags).where(eq(entryTags.entry, e.i)).orderBy(entryTags.order).leftJoin(tags, eq(tags.id, entryTags.tag));
    res.json(e);
});

router.post('/fav/:id', async (req, res) => {
    if (!Object.hasOwn(res.locals, 'user') || !res.locals.user) return res.sendStatus(404);
    let entry: Entry[] = await db.select().from(entries).where(eq(entries.filename, req.params.id));
    if (entry.length == 0) return res.sendStatus(404);
    let e = entry[0];
    let fav = await db.select().from(favourites).where(and(eq(favourites.entry, e.id), eq(favourites.user, res.locals.user.id)));
    if (fav.length == 0)
        await db.insert(favourites).values({entry: e.id, user: res.locals.user.id});
    else
        await db.delete(favourites).where(and(eq(favourites.entry, e.id), eq(favourites.user, res.locals.user.id)));
    res.status(200).send(fav.length == 0);
});

router.get('/entries', async (req, res) => {
    let query = getSearchQuery(req);
    if (typeof query == "string")
            return res.status(400).send(query);
    let condition: SQL | undefined = eq(entries.listed, true);
    for (let tag of query.tags)
        condition = and(exists(db.select().from(entryTags).where(and(eq(entryTags.entry, entries.id), eq(entryTags.tag, tag)))), condition);
    if (query.search != undefined)
        condition = and(like(entries.title, "%"+query.search+"%"), condition)
    let entry = await db.select({id: entries.filename, ext: entries.filetype, title: entries.title, date: entries.date}).from(entries).where(condition).orderBy(desc(entries.date)).offset(query.limit * query.page).limit(query.limit);
    let max = (await db.select({count: count()}).from(entries).where(condition))[0].count;
    res.json({
        from: query.limit * query.page + 1,
        to: Math.min(max, query.limit * query.page + entry.length),
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