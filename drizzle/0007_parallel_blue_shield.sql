CREATE TABLE `chatTopics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(128) NOT NULL,
	`subtitle` varchar(256),
	`icon` varchar(64) NOT NULL DEFAULT 'MessageSquare',
	`aiRule` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatTopics_id` PRIMARY KEY(`id`)
);
