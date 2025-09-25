/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: types.ts
 *
 * Description:
 * Inventory domain types and interfaces
 *
 * Responsibilities:
 * - Define inventory item structure
 * - Define hub inventory payload format
 *
 * Role in system:
 * - Used by inventory service and routes for type safety
 *
 * Notes:
 * Matches frontend HubInventoryItem interface
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

export interface InventoryItem {
  productId: string;
  name: string;
  type: string;
  onHand: number;
  min: number;
  location: string;
  isLow: boolean;
  status?: 'active' | 'archived';
  archivedDate?: string | null;
  reason?: string | null;
}

export interface HubInventoryPayload {
  role: string;
  cksCode: string;
  activeItems: InventoryItem[];
  archivedItems: InventoryItem[];
}
