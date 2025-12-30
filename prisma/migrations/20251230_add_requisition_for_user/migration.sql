-- Add requestedForUserId to StationaryRequisition
-- This allows tracking who the items are actually for (personal vs department use)

ALTER TABLE StationaryRequisition ADD COLUMN requestedForUserId INTEGER;
ALTER TABLE StationaryRequisition ADD COLUMN requestedForType TEXT DEFAULT 'department'; -- 'department' or 'personal'

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS StationaryRequisition_requestedForUserId_idx ON StationaryRequisition(requestedForUserId);
