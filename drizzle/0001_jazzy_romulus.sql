CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128),
	`role` varchar(128),
	`company` varchar(128),
	`content` text NOT NULL,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`approved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
