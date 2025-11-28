-- Migration pour ajouter le support des co-emprunteurs
ALTER TABLE `chat_contexts` ADD `coNomComplet` varchar(255);--> statement-breakpoint
ALTER TABLE `chat_contexts` ADD `coDateNaissance` varchar(20);--> statement-breakpoint
ALTER TABLE `chat_contexts` ADD `coEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `chat_contexts` ADD `coTelephone` varchar(20);--> statement-breakpoint
ALTER TABLE `chat_contexts` ADD `coStatutProfessionnel` varchar(100);--> statement-breakpoint
ALTER TABLE `chat_contexts` ADD `coFumeur` int;--> statement-breakpoint
ALTER TABLE `chat_contexts` ADD `coQuotite` int;
