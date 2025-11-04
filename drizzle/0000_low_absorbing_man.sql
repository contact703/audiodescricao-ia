CREATE TABLE `ad_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`video_source` varchar(50) NOT NULL,
	`video_url` text,
	`video_key` varchar(500),
	`video_duration` int,
	`status` enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
	`script_data` text,
	`audio_url` text,
	`audio_key` varchar(500),
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completed_at` timestamp,
	CONSTRAINT `ad_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ad_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`timestamp` int NOT NULL,
	`type` enum('nota_introdutoria','descricao') NOT NULL,
	`text` text NOT NULL,
	`audio_url` text,
	`audio_key` varchar(500),
	`order` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ad_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `ad_projects` ADD CONSTRAINT `ad_projects_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ad_units` ADD CONSTRAINT `ad_units_project_id_ad_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `ad_projects`(`id`) ON DELETE cascade ON UPDATE no action;