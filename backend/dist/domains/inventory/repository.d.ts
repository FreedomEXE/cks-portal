import { InventoryItem, InventoryQuery } from './types';
export declare function listInventory(warehouseId: string, q: InventoryQuery): Promise<InventoryItem[]>;
export declare function adjustQuantity(warehouseId: string, itemId: string, delta: number): Promise<InventoryItem | null>;
//# sourceMappingURL=repository.d.ts.map