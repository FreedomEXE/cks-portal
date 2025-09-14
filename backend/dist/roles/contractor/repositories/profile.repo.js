"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.getCapabilities = getCapabilities;
exports.updateCapabilities = updateCapabilities;
exports.getServiceAreas = getServiceAreas;
exports.updateAvailability = updateAvailability;
/**
 * File: profile.repo.ts
 *
 * Description: DB access for contractor profile fields
 * Function: Handle contractor profile data storage and retrieval
 * Importance: Core data layer for contractor identity and business information
 * Connects to: profile.service.ts.
 *
 * Notes: Contractor-specific profile data management
 */
const connection_1 = require("../../../db/connection");
// Get contractor profile
async function getProfile(contractorId) {
    const sql = `
    SELECT 
      c.*,
      u.display_name,
      u.email as user_email,
      u.created_at as account_created,
      u.last_login,
      -- Additional contractor-specific fields
      COALESCE(
        (SELECT AVG(r.rating) FROM ratings r WHERE r.contractor_id = c.contractor_id),
        0
      ) as avg_rating,
      (
        SELECT COUNT(*) FROM orders o 
        JOIN job_assignments ja ON ja.order_id = o.order_id
        WHERE ja.assigned_contractor = c.contractor_id 
        AND o.status = 'completed'
      ) as completed_jobs,
      (
        SELECT COUNT(*) FROM contractor_certifications cc
        WHERE cc.contractor_id = c.contractor_id
        AND cc.status = 'active'
      ) as active_certifications
    FROM contractors c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.contractor_id = $1
  `;
    const result = await (0, connection_1.query)(sql, [contractorId]);
    return result[0] || null;
}
// Update contractor profile
async function updateProfile(contractorId, updateData) {
    const allowedFields = [
        'company_name', 'contact_name', 'email', 'phone',
        'address', 'description', 'specialties', 'preferences'
    ];
    const setClause = [];
    const params = [];
    let paramIndex = 1;
    // Build SET clause dynamically
    for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
            setClause.push(`${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
        }
    }
    if (setClause.length === 0) {
        throw new Error('No valid fields to update');
    }
    // Add updated_date
    setClause.push(`updated_date = NOW()`);
    const sql = `
    UPDATE contractors 
    SET ${setClause.join(', ')}
    WHERE contractor_id = $${paramIndex}
    RETURNING *
  `;
    params.push(contractorId);
    const result = await (0, connection_1.query)(sql, params);
    return result[0] || null;
}
// Get contractor capabilities and certifications
async function getCapabilities(contractorId) {
    const sql = `
    SELECT 
      cc.certification_id,
      cc.name,
      cc.description,
      cc.issued_by,
      cc.issued_date,
      cc.expiry_date,
      cc.status,
      cc.verification_status,
      cs.name as skill_name,
      cs.category as skill_category,
      cs.proficiency_level
    FROM contractor_certifications cc
    LEFT JOIN contractor_skills cs ON cs.contractor_id = cc.contractor_id
    WHERE cc.contractor_id = $1
    ORDER BY cc.issued_date DESC, cs.proficiency_level DESC
  `;
    return await (0, connection_1.query)(sql, [contractorId]);
}
// Update contractor capabilities
async function updateCapabilities(contractorId, capabilities) {
    // This would typically involve multiple operations:
    // 1. Delete existing capabilities
    // 2. Insert new capabilities
    // For now, return a placeholder
    const sql = `
    SELECT 
      'Updated capabilities for contractor' as message,
      $1 as contractor_id,
      $2 as capability_count
  `;
    const result = await (0, connection_1.query)(sql, [contractorId, capabilities.length]);
    return result;
}
// Get contractor service areas
async function getServiceAreas(contractorId) {
    const sql = `
    SELECT 
      sa.area_id,
      sa.name,
      sa.state,
      sa.city,
      sa.zip_codes,
      sa.travel_distance,
      sa.service_fee,
      sa.active
    FROM contractor_service_areas sa
    WHERE sa.contractor_id = $1
    AND sa.active = true
    ORDER BY sa.name
  `;
    return await (0, connection_1.query)(sql, [contractorId]);
}
// Update contractor availability
async function updateAvailability(contractorId, availability) {
    const sql = `
    INSERT INTO contractor_availability (
      contractor_id, 
      day_of_week, 
      start_time, 
      end_time, 
      available,
      updated_date
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (contractor_id, day_of_week) 
    DO UPDATE SET 
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      available = EXCLUDED.available,
      updated_date = NOW()
    RETURNING *
  `;
    // This is a simplified version - would typically handle multiple days
    const result = await (0, connection_1.query)(sql, [
        contractorId,
        availability.dayOfWeek,
        availability.startTime,
        availability.endTime,
        availability.available
    ]);
    return result[0] || null;
}
//# sourceMappingURL=profile.repo.js.map