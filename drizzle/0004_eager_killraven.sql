PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`filetype` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` integer NOT NULL,
	`listed` integer NOT NULL,
	`created` integer,
	`createdBy` text
);
--> statement-breakpoint
INSERT INTO `__new_entries`("filename", "filetype", "title", "description", "date", "listed", "created", "createdBy") SELECT "id", "filetype", "title", "description", "date", "listed", "created", "createdBy" FROM `entries`;--> statement-breakpoint
DROP TABLE `entries`;--> statement-breakpoint
ALTER TABLE `__new_entries` RENAME TO `entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;