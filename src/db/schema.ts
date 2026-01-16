import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: text().notNull().primaryKey(),
  filetype: text().notNull(),
  title: text().notNull(),
  description: text(),
  date: int({ mode: 'timestamp' }).notNull(),
  listed: int({ mode: 'boolean' }).notNull(),
});

enum TagType {
    Generic = 0,
    Author = 1,
    Character = 2,
    Format = 3,
    Arc = 4,
};

export const tags = sqliteTable("tags", {
    id: int().primaryKey({ autoIncrement: true }),
    type: int().notNull(),
    name: text().notNull(),
    description: text(),
});

export const entryTags = sqliteTable("entry_tags", {
    entry: text().notNull().references(() => entries.id),
    tag: int().notNull().references(() => tags.id),
});