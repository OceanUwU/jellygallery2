import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: int().primaryKey({ autoIncrement: true }),
  filename: text().notNull(),
  filetype: text().notNull(),
  title: text().notNull(),
  description: text(),
  date: int({ mode: 'timestamp' }).notNull(),
  listed: int({ mode: 'boolean' }).notNull(),
  created: int({ mode: 'timestamp' }),
  createdBy: text(),
});
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferSelect;

export enum TagType {
    Generic = 0,
    Author = 1,
    Character = 2,
    Arc = 3,
    Type = 4,
    Max = 5,
};

export const tags = sqliteTable("tags", {
    id: int().primaryKey({ autoIncrement: true }),
    type: int().notNull(),
    name: text().notNull(),
    description: text(),
    created: int({ mode: 'timestamp' }),
    createdBy: text(),
});
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export const entryTags = sqliteTable("entry_tags", {
    entry: int().notNull().references(() => entries.id),
    tag: int().notNull().references(() => tags.id),
    order: int().notNull(),
});
export type EntryTag = typeof entryTags.$inferSelect;
export type NewEntryTag = typeof entryTags.$inferSelect;