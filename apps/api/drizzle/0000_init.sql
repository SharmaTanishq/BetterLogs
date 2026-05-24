CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"step_id" text,
	"type" text NOT NULL,
	"service" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "failure_embeddings" (
	"workflow_id" text PRIMARY KEY NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"summary" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcomes" (
	"workflow_id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"reason_code" text,
	"reason_text" text,
	"remediation_taken" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" text
);
--> statement-breakpoint
CREATE TABLE "steps" (
	"id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"name" text NOT NULL,
	"service" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"input" jsonb,
	"output" jsonb,
	"error" jsonb,
	"span_id" text NOT NULL,
	"parent_step_id" text
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"version" text NOT NULL,
	"environment" text NOT NULL,
	"business_keys" jsonb NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"trace_id" text NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_step_id_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failure_embeddings" ADD CONSTRAINT "failure_embeddings_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steps" ADD CONSTRAINT "steps_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_events_workflow_ts" ON "events" USING btree ("workflow_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_failure_embeddings_hnsw" ON "failure_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_steps_workflow" ON "steps" USING btree ("workflow_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_steps_status" ON "steps" USING btree ("status","started_at" DESC NULLS LAST) WHERE "steps"."status" = 'failed';--> statement-breakpoint
CREATE INDEX "idx_workflows_name_started" ON "workflows" USING btree ("name","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_workflows_business_keys" ON "workflows" USING gin ("business_keys");--> statement-breakpoint
CREATE INDEX "idx_workflows_status_started" ON "workflows" USING btree ("status","started_at" DESC NULLS LAST);