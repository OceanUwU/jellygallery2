
import { Router } from 'express';
import db from '../db';
import { eq, and, sql } from 'drizzle-orm';
import { entries, entryTags, tags } from '../db/schema';
import { getFileType } from '../shared';
import config from '../config';

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
    res.render('entry', {entry: e, tags: theTags, type: getFileType(e.filetype), host: config.host, adjacent: adjacent});
});

export default router;