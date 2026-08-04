CREATE TYPE "public"."audit_log_status" AS ENUM('SUCCESS', 'FAILURE');--> statement-breakpoint
CREATE TYPE "public"."audit_log_type" AS ENUM('AUTH', 'SECURITY', 'USER', 'SYSTEM', 'COMMUNICATION');--> statement-breakpoint
CREATE TYPE "public"."auth_method" AS ENUM('CREDENTIALS', 'GOOGLE', 'MAGIC_LINK');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('CREDENTIALS', 'GOOGLE');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."reminder_resource_type" AS ENUM('GENERIC');--> statement-breakpoint
CREATE TYPE "public"."reminder_schedule_type" AS ENUM('DAILY', 'WEEKLY', 'DEADLINE_OFFSET');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."session_revocation_reason" AS ENUM('LOGOUT', 'LOGOUT_ALL', 'PASSWORD_CHANGED', 'ADMIN_REVOKED', 'SECURITY_RISK', 'REFRESH_TOKEN_REUSE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INVITED', 'SUSPENDED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('INTERNAL', 'EXTERNAL');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"type" "audit_log_type" NOT NULL,
	"status" "audit_log_status" NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"request_id" text,
	"ip_address" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_subject" text,
	"provider_email" text,
	"password_hash" text,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_identities_user_provider_uq" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"auth_method" "auth_method" NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"device_name" text,
	"device_type" text,
	"browser" text,
	"operating_system" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" "session_revocation_reason",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_refresh_token_hash_uq" UNIQUE("refresh_token_hash")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"otp_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_hash_uq" UNIQUE("token_hash"),
	CONSTRAINT "email_verification_tokens_otp_hash_uq" UNIQUE("otp_hash")
);
--> statement-breakpoint
CREATE TABLE "in_app_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"resource_type" "reminder_resource_type",
	"resource_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_hash_uq" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reminder_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'PENDING' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"provider_message_id" text,
	"error_code" text,
	"error_message" text,
	"skipped_reason" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_uq" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "reminder_time_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reminder_id" uuid NOT NULL,
	"local_time" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "reminder_time_slots_local_time_chk" CHECK ("reminder_time_slots"."local_time" ~ '^(?:[01]\d|2[0-3]):[0-5]\d$')
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_email" text,
	"resource_type" "reminder_resource_type" NOT NULL,
	"resource_id" uuid NOT NULL,
	"schedule_type" "reminder_schedule_type" NOT NULL,
	"timezone" text DEFAULT 'Africa/Kinshasa' NOT NULL,
	"weekly_days" smallint[],
	"deadline_at" timestamp with time zone,
	"offset_days" integer[],
	"channels" text[] NOT NULL,
	"status" "reminder_status" DEFAULT 'ACTIVE' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"title" text NOT NULL,
	"template_key" text NOT NULL,
	"metadata" jsonb,
	"next_run_at" timestamp with time zone,
	"last_enqueued_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminders_owner_chk" CHECK ((
          ("reminders"."user_id" IS NOT NULL AND "reminders"."guest_email" IS NULL)
          OR
          ("reminders"."user_id" IS NULL AND "reminders"."guest_email" IS NOT NULL)
        )),
	CONSTRAINT "reminders_channels_not_empty_chk" CHECK (cardinality("reminders"."channels") >= 1)
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"reminders_enabled" boolean DEFAULT true NOT NULL,
	"default_channels" text[] DEFAULT '{"IN_APP","EMAIL"}' NOT NULL,
	"timezone" text,
	"quiet_hours_start" time,
	"quiet_hours_end" time,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_type" "user_type" NOT NULL,
	"role" "user_role" NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"phone" text,
	"status" "user_status" NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"locale" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_type_role_chk" CHECK ((
          ("users"."user_type" = 'EXTERNAL' AND "users"."role" = 'USER')
          OR
          ("users"."user_type" = 'INTERNAL' AND "users"."role" <> 'USER')
        ))
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_time_slots" ADD CONSTRAINT "reminder_time_slots_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_at_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_type_created_at_idx" ON "audit_logs" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_status_created_at_idx" ON "audit_logs" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_identities_provider_subject_uq" ON "auth_identities" USING btree ("provider","provider_subject") WHERE "auth_identities"."provider_subject" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "in_app_notifications_user_created_idx" ON "in_app_notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_deliveries_idempotency_uq" ON "notification_deliveries" USING btree ("reminder_id","channel","scheduled_for");--> statement-breakpoint
CREATE INDEX "notification_deliveries_reminder_status_idx" ON "notification_deliveries" USING btree ("reminder_id","status");--> statement-breakpoint
CREATE INDEX "notification_deliveries_scheduled_for_idx" ON "notification_deliveries" USING btree ("scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_time_slots_reminder_time_uq" ON "reminder_time_slots" USING btree ("reminder_id","local_time");--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_resource_user_active_uq" ON "reminders" USING btree ("resource_type","resource_id","user_id") WHERE "reminders"."user_id" IS NOT NULL AND "reminders"."status" IN ('ACTIVE', 'PAUSED');--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_resource_guest_active_uq" ON "reminders" USING btree ("resource_type","resource_id","guest_email") WHERE "reminders"."guest_email" IS NOT NULL AND "reminders"."status" IN ('ACTIVE', 'PAUSED');--> statement-breakpoint
CREATE INDEX "reminders_due_idx" ON "reminders" USING btree ("status","next_run_at") WHERE "reminders"."status" = 'ACTIVE' AND "reminders"."enabled" = true;--> statement-breakpoint
CREATE INDEX "reminders_user_id_idx" ON "reminders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminders_resource_idx" ON "reminders" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_user_type_idx" ON "users" USING btree ("user_type");