CREATE TABLE `expense_splits` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_id` text NOT NULL,
	`user_id` text NOT NULL,
	`share_amount` numeric(12,2) NOT NULL,
	FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`payer_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` numeric(12,2) NOT NULL,
	`currency` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` text PRIMARY KEY NOT NULL,
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `group_members_group_user_unique` ON `group_members` (`group_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);