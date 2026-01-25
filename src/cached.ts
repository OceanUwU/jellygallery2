
import db from './db';
import { eq, ne, desc, asc, and, count, sql } from 'drizzle-orm';
import { entries, entryTags, tags, TagType } from './db/schema';

const cached = {
    tags: {},
};

export async function refreshAll() {
    await refreshTags();
    await refreshArcs();
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

export default cached;