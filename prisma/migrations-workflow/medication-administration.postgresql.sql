-- Add MedicationAdministration to an existing PostgreSQL database once reviewed.
BEGIN;

CREATE TABLE "MedicationAdministration" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT,
    "administeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    CONSTRAINT "MedicationAdministration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MedicationAdministration_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

COMMIT;
