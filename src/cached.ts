
import db from './db';
import { eq, ne, and, desc, count } from 'drizzle-orm';
import { entries, entryTags, tags, TagType } from './db/schema';
import config from './config';
import pug from 'pug';
import fs from 'fs';

const cached = {
    tags: {},
};

export async function refreshAll() {
    await refreshTags();
    await refreshArcs();
    await generateRSS();
}

export async function refreshTags() {
    let cachedTags: Array<any> = await db.select({ id: tags.id, name: tags.name, type: tags.type, description: tags.description }).from(tags).where(ne(tags.type, TagType.Arc));
    for (let tag of cachedTags)
        tag.count = (await db.select({count: count()}).from(entryTags).leftJoin(entries, eq(entries.id, entryTags.entry)).where(and(eq(entryTags.tag, tag.id), eq(entries.listed, true))))[0].count;
    cachedTags = cachedTags.filter(t => t.count > 0);
    cachedTags.sort((a, b) => b.count - a.count);
    let groupedTags = {};
    for (let tag of cachedTags) {
        if (!groupedTags.hasOwnProperty(tag.type))
            groupedTags[tag.type] = [];
        groupedTags[tag.type].push(tag);
        delete tag.type;
    }
    cached.tags = groupedTags;
}

export async function refreshArcs() {

}

const rssTemplate = pug.compileFile('views/rss.pug');
export async function generateRSS() {
    fs.writeFileSync('rss.xml', rssTemplate({
        host: config.host,
        entries: await Promise.all((await db.select().from(entries).where(eq(entries.listed, true)).orderBy(desc(entries.date)).limit(50)).map(async e => ({...e,
            authors: await db.select({id: entryTags.tag, type: tags.type, name: tags.name}).from(entryTags).where(and(eq(tags.type, TagType.Author), eq(entryTags.entry, e.id))).orderBy(entryTags.order).leftJoin(tags, eq(tags.id, entryTags.tag))}))),
    }));
}

export default cached;