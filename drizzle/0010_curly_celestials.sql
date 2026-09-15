CREATE TABLE `dataImpactReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`shareToken` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`problemDescription` text NOT NULL,
	`industry` varchar(128),
	`companyRevenue` varchar(64),
	`teamSize` varchar(64),
	`regulations` text,
	`reportJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataImpactReports_id` PRIMARY KEY(`id`),
	CONSTRAINT `dataImpactReports_shareToken_unique` UNIQUE(`shareToken`)
);
