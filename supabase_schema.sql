-- BugTrack Database Schema for Supabase
-- Generated from Prisma schema
-- Run this in Supabase Dashboard → SQL Editor

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('BUG_BOUNTY', 'VDP', 'PENTEST', 'PERSONAL', 'CTF');

-- CreateEnum
CREATE TYPE "TargetStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "FindingStatus" AS ENUM ('DRAFT', 'READY', 'REPORTED', 'ACCEPTED', 'DUPLICATE', 'NOT_APPLICABLE', 'RESOLVED');

-- CreateEnum
CREATE TYPE "WorkflowState" AS ENUM ('DRAFT', 'TESTING', 'REPORTED', 'TRIAGED', 'ACCEPTED', 'FIXED', 'DUPLICATE', 'NOT_APPLICABLE', 'REWARDED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('SCREENSHOT', 'POC_CODE', 'VIDEO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PayloadCategory" AS ENUM ('XSS', 'SQLI', 'COMMAND_INJECTION', 'SSRF', 'XXE', 'LFI_RFI', 'IDOR', 'CSRF', 'AUTH_BYPASS', 'DESERIALIZATION', 'TEMPLATE_INJECTION', 'LDAP_INJECTION', 'NOSQL_INJECTION', 'PROTOTYPE_POLLUTION', 'RACE_CONDITION', 'RECON_COMMAND', 'FUZZING_WORDLIST', 'CUSTOM_SCRIPT', 'OTHER');

-- CreateEnum
CREATE TYPE "ToolName" AS ENUM ('SUBFINDER', 'HTTPX', 'GAU', 'WAYBACKURLS', 'FFUF', 'DIRSEARCH', 'NUCLEI', 'NMAP', 'AMASS', 'MASSCAN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "targets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program_type" "ProgramType" NOT NULL,
    "url" TEXT,
    "platform" TEXT,
    "scope_json" JSONB NOT NULL,
    "status" "TargetStatus" NOT NULL DEFAULT 'ACTIVE',
    "tags" TEXT[],
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "reward_range" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_id" TEXT,
    "title" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "FindingStatus" NOT NULL DEFAULT 'DRAFT',
    "workflow_state" "WorkflowState" NOT NULL DEFAULT 'DRAFT',
    "cvss_score" DOUBLE PRECISION,
    "vulnerability_type" TEXT,
    "description_md" TEXT NOT NULL,
    "impact" TEXT,
    "reproduction_steps" TEXT,
    "remediation" TEXT,
    "references" TEXT[],
    "tags" TEXT[],
    "reported_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "reward_amount" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "attachment_type" "AttachmentType" NOT NULL DEFAULT 'OTHER',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payloads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "PayloadCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryption_iv" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "source_url" TEXT,
    "language" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "encrypted_content" TEXT NOT NULL,
    "encryption_iv" TEXT NOT NULL,
    "content_hash" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "color" TEXT,
    "last_accessed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_id" TEXT,
    "tool_name" "ToolName" NOT NULL,
    "target_input" TEXT NOT NULL,
    "params_json" JSONB,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "exit_code" INTEGER,
    "result_json" JSONB,
    "result_count" INTEGER,
    "raw_output" TEXT,
    "error_output" TEXT,
    "container_id" TEXT,
    "runner_node" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quotas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "jobs_this_hour" INTEGER NOT NULL DEFAULT 0,
    "jobs_hour_reset" TIMESTAMP(3) NOT NULL,
    "jobs_today" INTEGER NOT NULL DEFAULT 0,
    "jobs_day_reset" TIMESTAMP(3) NOT NULL,
    "total_jobs" INTEGER NOT NULL DEFAULT 0,
    "total_duration_ms" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "targets_user_id_idx" ON "targets"("user_id");

-- CreateIndex
CREATE INDEX "targets_status_idx" ON "targets"("status");

-- CreateIndex
CREATE INDEX "targets_priority_idx" ON "targets"("priority");

-- CreateIndex
CREATE INDEX "targets_created_at_idx" ON "targets"("created_at");

-- CreateIndex
CREATE INDEX "findings_user_id_idx" ON "findings"("user_id");

-- CreateIndex
CREATE INDEX "findings_target_id_idx" ON "findings"("target_id");

-- CreateIndex
CREATE INDEX "findings_severity_idx" ON "findings"("severity");

-- CreateIndex
CREATE INDEX "findings_workflow_state_idx" ON "findings"("workflow_state");

-- CreateIndex
CREATE INDEX "findings_created_at_idx" ON "findings"("created_at");

-- CreateIndex
CREATE INDEX "attachments_finding_id_idx" ON "attachments"("finding_id");

-- CreateIndex
CREATE INDEX "payloads_user_id_idx" ON "payloads"("user_id");

-- CreateIndex
CREATE INDEX "payloads_category_idx" ON "payloads"("category");

-- CreateIndex
CREATE INDEX "payloads_is_favorite_idx" ON "payloads"("is_favorite");

-- CreateIndex
CREATE INDEX "payloads_created_at_idx" ON "payloads"("created_at");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_is_favorite_idx" ON "notes"("is_favorite");

-- CreateIndex
CREATE INDEX "notes_created_at_idx" ON "notes"("created_at");

-- CreateIndex
CREATE INDEX "tool_jobs_user_id_idx" ON "tool_jobs"("user_id");

-- CreateIndex
CREATE INDEX "tool_jobs_status_idx" ON "tool_jobs"("status");

-- CreateIndex
CREATE INDEX "tool_jobs_tool_name_idx" ON "tool_jobs"("tool_name");

-- CreateIndex
CREATE INDEX "tool_jobs_created_at_idx" ON "tool_jobs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_quotas_user_id_key" ON "user_quotas"("user_id");

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payloads" ADD CONSTRAINT "payloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_jobs" ADD CONSTRAINT "tool_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_jobs" ADD CONSTRAINT "tool_jobs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quotas" ADD CONSTRAINT "user_quotas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

