
import { Router } from 'express';
import db from '../db';
import { eq, and, sql, SQL } from 'drizzle-orm';
import { entries, entryTags, favourites, tags } from '../db/schema';
import { getFileType } from '../shared';
import config from '../config';
import { getSearchQuery, SearchQuery } from '../util';

const router = Router();

router.get('/:id', async (req, res) => {
    let entry = await db.select().from(entries).where(and(eq(entries.filename, req.params.id), eq(entries.listed, true)));
    if (entry.length == 0) return res.sendStatus(404);
    let e = entry[0];
    let theTags = await db.select().from(entryTags).where(eq(entryTags.entry, e.id)).orderBy(entryTags.order).leftJoin(tags, eq(tags.id, entryTags.tag));

    let adjacent = await db.get(sql`SELECT * FROM (
  SELECT id, LEAD(entries.filename) OVER w AS prev, LAG(entries.filename) OVER w AS next
  FROM entries WHERE listed = 1
  WINDOW w AS (ORDER BY entries.date DESC, entries.filename)
) WHERE id = ${e.id};`);
    let query = getSearchQuery(req);
    let qString = "";
    let queryAdjacent: any = undefined;
    if (typeof query != "string") {
        if (query.search != undefined) {
            if (qString.length > 0) qString += ", "
            qString += "Search: " + query.search
        }
        if (query.tags.length > 0) {
            if (qString.length > 0) qString += ", "
            let tagNames: Array<string> = [];
            for (let tag of query.tags) {
                let result = await db.select({name: tags.name}).from(tags).where(eq(tags.id, tag));
                if (result.length > 0)
                    tagNames.push(result[0].name);
            }
            qString += "Tags: " + tagNames.join(", ");
        }
        if (qString != "") {
            let sqlChunks: SQL[] = [];
            sqlChunks.push(sql`SELECT * FROM (SELECT id, LEAD(entries.filename) OVER w AS prev, LAG(entries.filename) OVER w AS next FROM entries WHERE listed = 1`);
            if (query.search != undefined)
                sqlChunks.push(sql`AND title LIKE CONCAT('%', ${query.search}, '%')`);
            for (let tag of query.tags)
                sqlChunks.push(sql`AND exists (SELECT entry FROM entry_tags WHERE entry = id AND tag = ${tag})`);
            sqlChunks.push(sql`WINDOW w AS (ORDER BY entries.date DESC, entries.filename)) WHERE id = ${e.id};`);
            queryAdjacent = await db.get(sql.join(sqlChunks, sql.raw(' ')));
        }
    }
    res.render('entry', {entry: e, tags: theTags, type: getFileType(e.filetype), host: config.host, adjacent: adjacent, query: qString, queryAdjacent, fav: (!Object.hasOwn(res.locals, 'user') || !res.locals.user) ? false : (await db.select().from(favourites).where(and(eq(favourites.entry, e.id), eq(favourites.user, res.locals.user.id)))).length > 0, favs: (await db.select().from(favourites).where(eq(favourites.entry, e.id))).length});
});

export default router;