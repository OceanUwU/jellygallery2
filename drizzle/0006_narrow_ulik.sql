CREATE TABLE `favourites` (
	`user` text NOT NULL,
	`entry` integer NOT NULL,
	FOREIGN KEY (`entry`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
