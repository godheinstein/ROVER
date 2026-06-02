ALTER TABLE `robots` MODIFY COLUMN `robot_type` enum('mobile_manipulator','mobile_base','manipulator_arm','humanoid') NOT NULL;--> statement-breakpoint
ALTER TABLE `robots` ADD `country` varchar(128);--> statement-breakpoint
ALTER TABLE `robots` ADD `year` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `height_cm` double;--> statement-breakpoint
ALTER TABLE `robots` ADD `height_note` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `locomotion` varchar(255);--> statement-breakpoint
ALTER TABLE `robots` ADD `ip_rating` varchar(32);--> statement-breakpoint
ALTER TABLE `robots` ADD `price_usd` varchar(128);--> statement-breakpoint
ALTER TABLE `robots` ADD `dof_total` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `dof_note` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `dof_head` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `dof_torso` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `dof_arm_each` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `dof_hand_each` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `dof_base` varchar(255);--> statement-breakpoint
ALTER TABLE `robots` ADD `payload_per_arm` double;--> statement-breakpoint
ALTER TABLE `robots` ADD `payload_note` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `battery_hours` double;--> statement-breakpoint
ALTER TABLE `robots` ADD `battery_note` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `max_speed_kmh` double;--> statement-breakpoint
ALTER TABLE `robots` ADD `cpu` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `gpu` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `memory` varchar(255);--> statement-breakpoint
ALTER TABLE `robots` ADD `ai_compute` varchar(255);--> statement-breakpoint
ALTER TABLE `robots` ADD `os` varchar(128);--> statement-breakpoint
ALTER TABLE `robots` ADD `sensors` json;--> statement-breakpoint
ALTER TABLE `robots` ADD `connectivity` json;--> statement-breakpoint
ALTER TABLE `robots` ADD `ros2_support` varchar(32);--> statement-breakpoint
ALTER TABLE `robots` ADD `ros2_note` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `sdk_languages` json;--> statement-breakpoint
ALTER TABLE `robots` ADD `simulation_support` json;--> statement-breakpoint
ALTER TABLE `robots` ADD `sdk_links` json;--> statement-breakpoint
ALTER TABLE `robots` ADD `llm_integration` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `robots` ADD `open_source` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `robots` ADD `ai_platform` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `open_source_model` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `score_sdk_openness` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `score_ros2_support` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `score_compute_power` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `score_simulation_support` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `score_developer_community` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `score_payload_capability` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `score_dexterity` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `score_research_overall` int;--> statement-breakpoint
ALTER TABLE `robots` ADD `summary` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `research_note` text;--> statement-breakpoint
ALTER TABLE `robots` ADD `recommendation` varchar(32);