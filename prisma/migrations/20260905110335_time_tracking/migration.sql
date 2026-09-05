/*
  Warnings:

  - You are about to drop the column `estimateHours` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "estimateHours",
ADD COLUMN     "estimateMinutes" INTEGER,
ADD COLUMN     "spentMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "spentOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeEntry_taskId_spentOn_idx" ON "TimeEntry"("taskId", "spentOn");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_spentOn_idx" ON "TimeEntry"("userId", "spentOn");

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
