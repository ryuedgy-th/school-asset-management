-- Seed SLA Settings to SystemSettings table
-- This script adds default SLA resolution times for each priority level

-- Delete existing SLA settings (if any) to avoid duplicates
DELETE FROM SystemSettings WHERE category = 'sla';

-- Insert SLA resolution times (in hours)
INSERT INTO SystemSettings (key, value, category, isSecret, updatedAt) VALUES
('sla_urgent_hours', '2', 'sla', 0, CURRENT_TIMESTAMP),
('sla_high_hours', '8', 'sla', 0, CURRENT_TIMESTAMP),
('sla_medium_hours', '24', 'sla', 0, CURRENT_TIMESTAMP),
('sla_low_hours', '72', 'sla', 0, CURRENT_TIMESTAMP),
('sla_at_risk_threshold', '20', 'sla', 0, CURRENT_TIMESTAMP); -- Percentage (20%)

-- Verify inserted data
SELECT * FROM SystemSettings WHERE category = 'sla' ORDER BY key;
