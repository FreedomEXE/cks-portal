/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- Clean up mock/sample data from database for production readiness

-- Remove sample support tickets
DELETE FROM support_messages WHERE ticket_id IN ('ST-001', 'ST-002');
DELETE FROM support_tickets WHERE ticket_id IN ('ST-001', 'ST-002');

-- Reset support ticket sequence to start from 1
-- First, get the next available number based on existing tickets
DO $$
DECLARE
    max_num INTEGER;
BEGIN
    -- Extract the highest number from existing ticket IDs
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_id FROM 4) AS INTEGER)), 0) + 1 
    INTO max_num 
    FROM support_tickets 
    WHERE ticket_id LIKE 'ST-%';
    
    -- If no tickets exist, start from 1, otherwise continue from max + 1
    IF max_num IS NULL THEN
        max_num := 1;
    END IF;
END $$;

COMMIT;