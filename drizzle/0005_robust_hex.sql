PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entry_tags` (
	`entry` integer NOT NULL,
	`tag` integer NOT NULL,
	`order` integer NOT NULL,
	FOREIGN KEY (`entry`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_entry_tags`("entry", "tag", "order") SELECT "entry", "tag", "order" FROM `entry_tags`;--> statement-breakpoint
DROP TABLE `entry_tags`;--> statement-breakpoint
ALTER TABLE `__new_entry_tags` RENAME TO `entry_tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;