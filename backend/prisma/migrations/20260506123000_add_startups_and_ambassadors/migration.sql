-- CreateTable
CREATE TABLE "Startup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "location" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "foundedYear" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Startup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbassadorAssignment" (
    "id" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "roleName" TEXT NOT NULL,
    "servedAcademicYear" "AcademicYear" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbassadorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Startup_name_idx" ON "Startup"("name");

-- CreateIndex
CREATE INDEX "Startup_isActive_idx" ON "Startup"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AmbassadorAssignment_studentId_roleName_servedAcademicYear_key" ON "AmbassadorAssignment"("studentId", "roleName", "servedAcademicYear");

-- CreateIndex
CREATE INDEX "AmbassadorAssignment_studentId_idx" ON "AmbassadorAssignment"("studentId");

-- CreateIndex
CREATE INDEX "AmbassadorAssignment_roleName_idx" ON "AmbassadorAssignment"("roleName");

-- AddForeignKey
ALTER TABLE "AmbassadorAssignment" ADD CONSTRAINT "AmbassadorAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
