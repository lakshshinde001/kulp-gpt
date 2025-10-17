CREATE TABLE "slack_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"slack_user_id" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"team_id" varchar(255),
	"user_name" varchar(255),
	"real_name" varchar(255),
	"email" varchar(255),
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slack_users_slack_user_id_unique" UNIQUE("slack_user_id")
);
--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "conversation_id" SET DATA TYPE varchar(36);--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "userId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "userId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reasoning" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tool_calls" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "slack_users" ADD CONSTRAINT "slack_users_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "user_id";