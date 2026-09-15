CREATE TABLE `dataPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(256) NOT NULL,
	`problemDescription` text NOT NULL,
	`industry` varchar(128),
	`companySize` varchar(64),
	`urgency` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`planContent` text NOT NULL,
	`status` enum('draft','generated','saved') NOT NULL DEFAULT 'generated',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataPlans_id` PRIMARY KEY(`id`)
);
