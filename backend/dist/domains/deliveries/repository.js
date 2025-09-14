"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listShipments = listShipments;
exports.updateShipmentStatus = updateShipmentStatus;
const connection_1 = __importDefault(require("../../db/connection"));
async function listShipments(warehouseId, query) {
    const where = ['warehouse_id = $1'];
    const vals = [warehouseId];
    if (query.status) {
        vals.push(query.status);
        where.push(`status = $${vals.length}`);
    }
    if (query.type) {
        vals.push(query.type);
        where.push(`shipment_type = $${vals.length}`);
    }
    const lim = Math.min(Math.max(query.limit || 25, 1), 200);
    const off = Math.max(((query.page || 1) - 1) * lim, 0);
    const res = await connection_1.default.query(`SELECT shipment_id, warehouse_id, shipment_type, carrier, tracking_number, origin_address, destination_address,
            shipment_date, expected_delivery_date, actual_delivery_date, status, total_weight, total_value
     FROM warehouse_shipments
     WHERE ${where.join(' AND ')}
     ORDER BY shipment_date DESC NULLS LAST, shipment_id DESC
     LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`, [...vals, lim, off]);
    return res.rows;
}
async function updateShipmentStatus(warehouseId, shipmentId, status) {
    const res = await connection_1.default.query(`UPDATE warehouse_shipments SET status = $3, updated_at = NOW()
     WHERE warehouse_id = $1 AND shipment_id = $2
     RETURNING shipment_id, warehouse_id, shipment_type, carrier, tracking_number, origin_address, destination_address,
               shipment_date, expected_delivery_date, actual_delivery_date, status, total_weight, total_value`, [warehouseId, shipmentId, status]);
    return res.rows?.[0] || null;
}
//# sourceMappingURL=repository.js.map