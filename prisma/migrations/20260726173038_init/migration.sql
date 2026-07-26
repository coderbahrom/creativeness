-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastInitial" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "gradeMin" INTEGER NOT NULL,
    "gradeMax" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ComprehensionQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    CONSTRAINT "ComprehensionQuestion_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    CONSTRAINT "Task_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'kirish',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "reflection" TEXT,
    CONSTRAINT "Session_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "inputMethod" TEXT NOT NULL DEFAULT 'matn',
    "followUpOf" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Response_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Response_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Response_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "elaborationCount" INTEGER NOT NULL DEFAULT 0,
    "elaborationKinds" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Idea_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "fluency" INTEGER NOT NULL,
    "flexibility" INTEGER NOT NULL,
    "originality" INTEGER NOT NULL,
    "elaboration" INTEGER NOT NULL,
    "ideaCount" INTEGER NOT NULL,
    "categoryCount" INTEGER NOT NULL,
    "detailCount" INTEGER NOT NULL,
    "rarityScore" REAL NOT NULL DEFAULT 0,
    "originalityBase" TEXT NOT NULL DEFAULT 'sinf',
    "aiQuestion" TEXT,
    "aiRationale" TEXT,
    "safetyFlagged" BOOLEAN NOT NULL DEFAULT false,
    "safetyNote" TEXT,
    "teacherEdited" BOOLEAN NOT NULL DEFAULT false,
    "teacherNote" TEXT,
    "model" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assessment_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Student_classroomId_idx" ON "Student"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

-- CreateIndex
CREATE INDEX "ComprehensionQuestion_storyId_idx" ON "ComprehensionQuestion"("storyId");

-- CreateIndex
CREATE INDEX "Task_storyId_idx" ON "Task"("storyId");

-- CreateIndex
CREATE INDEX "Session_studentId_idx" ON "Session"("studentId");

-- CreateIndex
CREATE INDEX "Session_storyId_idx" ON "Session"("storyId");

-- CreateIndex
CREATE INDEX "Response_sessionId_idx" ON "Response"("sessionId");

-- CreateIndex
CREATE INDEX "Response_taskId_idx" ON "Response"("taskId");

-- CreateIndex
CREATE INDEX "Response_studentId_idx" ON "Response"("studentId");

-- CreateIndex
CREATE INDEX "Idea_responseId_idx" ON "Idea"("responseId");

-- CreateIndex
CREATE INDEX "Idea_canonicalKey_idx" ON "Idea"("canonicalKey");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_responseId_key" ON "Assessment"("responseId");
