ALTER TABLE "slack_users" DROP CONSTRAINT "slack_users_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "slack_users" ADD COLUMN "userid" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_users" ADD CONSTRAINT "slack_users_userid_users_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_users" DROP COLUMN "userId";