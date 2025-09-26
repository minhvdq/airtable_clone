-- DropIndex
DROP INDEX "public"."Workspace_name_createdById_key";

-- AlterTable
ALTER TABLE "public"."Base" ADD COLUMN     "starred" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Workspace" ADD COLUMN     "starred" BOOLEAN NOT NULL DEFAULT false;
