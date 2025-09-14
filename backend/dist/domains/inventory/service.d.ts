import { InventoryItem, InventoryQuery } from './types';
export declare function list(warehouseId: string, query: InventoryQuery): Promise<InventoryItem[]>;
export declare function adjust(warehouseId: string, itemId: string, delta: number): Promise<InventoryItem | null>;
//# sourceMappingURL=service.d.ts.map