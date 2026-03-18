/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/
/*
 * File: 20260318_seed_network_crew.sql
 *
 * Description:
 * Seeds the CKS Toronto network crew members from Christos's
 * network crew list (March 2026). Creates the new Galery Center
 * and inserts 19 crew profiles assigned to their respective
 * centers.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

BEGIN;

-- Create new center before crew assignments to satisfy FK dependency order.
INSERT INTO centers (
  center_id, name, status, created_at, updated_at
) VALUES (
  'CEN-014',
  'Galery Early Years Learning',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (center_id) DO NOTHING;

INSERT INTO crew (
  crew_id, name, email, phone, assigned_center, status, emergency_contact, address, cks_manager, created_at, updated_at
) VALUES
  (
    'CRW-001',
    'Maria Baro',
    'baromaria98@gmail.com',
    '526441436600',
    'CEN-011',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-002',
    'Belen Gutierrez',
    'fatima16gutierrez@gmail.com',
    '523334754850',
    'CEN-011',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-003',
    'Santiago Baro',
    'angel.ayonb@gmail.com',
    '6472159401',
    'CEN-001',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-004',
    'Anna Moreno',
    'annaelsa.padilla@hotmail.com',
    '4378296128',
    'CEN-001',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-005',
    'Feven Digaf',
    'fevaloni22@gmail.com',
    '6475730259',
    'CEN-003',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-006',
    'Wenie Hagos',
    'weyniasefaw2020@gmail.com',
    '6473304526',
    'CEN-003',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-007',
    'Gun Wang',
    'luawngalang@gmail.com',
    '6477602245',
    'CEN-012',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-008',
    'Jan Wang',
    NULL,
    '6473493710',
    'CEN-012',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-009',
    'Mrs. Panagiota',
    'yestertimecrafts@gmail.com',
    '4167317040',
    'CEN-013',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-010',
    'Sister. Paraskevi',
    NULL,
    '4377789835',
    'CEN-013',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-011',
    'Selly Pacheco',
    'sallypacheco03@gmail.com',
    '6472427356',
    'CEN-007',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-012',
    'Gael Aguas Garcia',
    'gaeljosefathaguasgarcia@gmail.com',
    '4375513464',
    'CEN-009',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-013',
    'Yasna Prieto',
    'nasya1@hotmail.com',
    '4379988458',
    'CEN-010',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-014',
    'Erica Vendura',
    'erikaventura656@gmail.com',
    '4374282406',
    'CEN-008',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-015',
    'Kerry',
    'kerrynazir@yahoo.com',
    '4162628369',
    'CEN-006',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-016',
    'Adan Barrera',
    'danmyfavoritour@gmail.com',
    '6477649874',
    'CEN-004',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-017',
    'Shanty Bautista',
    'shanty1588@hotmail.com',
    '6472014812',
    'CEN-005',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-018',
    'Anggie Sarabia',
    'maryanggie2023@gmail.com',
    '4372596458',
    'CEN-005',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    'CRW-019',
    'Albert Oliveto',
    'oliveti81@hotmail.com',
    '6476853008',
    'CEN-002',
    'active',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (crew_id) DO NOTHING;

COMMIT;
