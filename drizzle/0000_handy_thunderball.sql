CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`filetype` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entry_tags` (
	`entry` text NOT NULL,
	`tag` integer NOT NULL,
	FOREIGN KEY (`entry`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` integer NOT NULL,
	`name` text NOT NULL,
	`description` text
);
