/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * warehouse.d.ts
 * 
 * Description: TypeScript type definitions for Warehouse hub
 * Function: Provides type safety for warehouse-specific data structures
 * Importance: Critical - Ensures type safety across Warehouse hub
 * Connects to: All Warehouse components, API calls, and data management
 * 
 * Notes: Warehouse-specific types for inventory management and logistics.
 *        Extends base CKS types with warehouse-specific properties.
 */

export interface Warehouse {
  warehouse_id: string;           // WHS-XXX format
  name: string;                   // Warehouse name
  type: WarehouseType;            // Warehouse classification
  status: WarehouseStatus;        // Current operational status
  
  // Location and capacity
  location: Address;              // Physical location
  total_capacity: number;         // Total storage capacity (sq ft)
  used_capacity: number;          // Currently used capacity
  capacity_utilization: number;  // Utilization percentage
  
  // Contact and management
  manager_id: string;             // Warehouse manager ID
  contact_email: string;          // Primary contact email
  contact_phone: string;          // Primary contact phone
  
  // Operational data
  zones: WarehouseZone[];         // Storage zones
  inventory_items: number;        // Total inventory count
  active_orders: number;          // Current active orders
  pending_shipments: number;      // Pending outbound shipments
  
  // Performance metrics
  throughput_daily: number;       // Daily order processing capacity
  accuracy_rate: number;         // Order accuracy percentage
  fulfillment_time: number;      // Average fulfillment time (hours)
  efficiency_rating: number;     // Overall efficiency (0-5)
  
  // Equipment and resources
  equipment: WarehouseEquipment[];
  staff_count: number;           // Total staff members
  operating_hours: OperatingHours;
  
  // Service areas
  service_territories: string[]; // Served territory IDs
  shipping_methods: string[];    // Available shipping options
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface WarehouseZone {
  zone_id: string;               // Zone identifier
  name: string;                  // Zone name
  type: ZoneType;                // Zone classification
  capacity: number;              // Zone capacity
  current_utilization: number;   // Current usage percentage
  temperature_controlled: boolean;
  security_level: SecurityLevel;
  inventory_count: number;
  location_codes: string[];      // Storage location codes
}

export interface WarehouseEquipment {
  equipment_id: string;          // EQP-XXX format
  name: string;                  // Equipment name
  type: EquipmentType;           // Equipment category
  status: EquipmentStatus;       // Current status
  condition: EquipmentCondition; // Physical condition
  location: string;              // Current location in warehouse
  operator_id?: string;          // Assigned operator
  last_maintenance: string;      // Last maintenance date
  next_maintenance: string;      // Next scheduled maintenance
  utilization_hours: number;    // Daily utilization hours
  specifications: Record<string, any>; // Equipment specifications
}

export interface InventoryItem {
  item_id: string;               // ITM-XXX format
  sku: string;                   // Stock keeping unit
  name: string;                  // Item name
  description: string;           // Item description
  category: string;              // Item category
  
  // Stock information
  current_stock: number;         // Current quantity
  reserved_stock: number;        // Reserved for orders
  available_stock: number;       // Available for new orders
  reorder_point: number;         // Minimum stock level
  max_stock: number;             // Maximum stock level
  
  // Location and storage
  warehouse_id: string;          // Warehouse location
  zone_id: string;               // Storage zone
  location_code: string;         // Specific storage location
  storage_requirements: StorageRequirements;
  
  // Item details
  unit_of_measure: string;       // UOM (each, box, pallet)
  weight: number;                // Item weight
  dimensions: Dimensions;        // Item dimensions
  value: number;                 // Item value
  
  // Tracking
  lot_tracking: boolean;         // Requires lot tracking
  serial_tracking: boolean;      // Requires serial tracking
  expiration_tracking: boolean;  // Has expiration dates
  
  // Supplier information
  supplier_id: string;           // Primary supplier
  supplier_sku: string;          // Supplier's SKU
  lead_time_days: number;        // Supplier lead time
  
  // Status and flags
  status: ItemStatus;
  abc_classification: ABCClass;  // ABC analysis classification
  velocity: StockVelocity;       // Movement velocity
  
  // Timestamps
  last_received: string;         // Last receipt date
  last_issued: string;           // Last issue date
  created_at: string;
  updated_at: string;
}

export interface WarehouseOrder {
  order_id: string;              // ORD-XXX format
  warehouse_id: string;          // Fulfilling warehouse
  type: OrderType;               // Order type
  priority: OrderPriority;       // Order priority
  status: OrderStatus;           // Current status
  
  // Customer information
  customer_id: string;           // Customer ID
  shipping_address: Address;     // Delivery address
  billing_address?: Address;     // Billing address
  
  // Order details
  line_items: OrderLineItem[];   // Order items
  total_items: number;           // Total item count
  total_weight: number;          // Total weight
  total_value: number;           // Total order value
  
  // Fulfillment tracking
  picker_id?: string;            // Assigned picker
  packer_id?: string;            // Assigned packer
  picked_at?: string;            // Pick completion time
  packed_at?: string;            // Pack completion time
  shipped_at?: string;           // Ship time
  
  // Shipping information
  shipping_method: string;       // Shipping method
  tracking_number?: string;      // Tracking number
  carrier: string;               // Shipping carrier
  estimated_delivery?: string;   // Estimated delivery date
  
  // Special requirements
  special_instructions?: string;
  requires_signature: boolean;
  fragile_items: boolean;
  hazardous_materials: boolean;
  
  // Timestamps
  created_at: string;
  due_date: string;
  completed_at?: string;
}

export interface OrderLineItem {
  line_id: string;
  item_id: string;
  sku: string;
  name: string;
  quantity_ordered: number;
  quantity_picked: number;
  quantity_shipped: number;
  unit_price: number;
  line_total: number;
  location_code: string;
  lot_number?: string;
  serial_numbers?: string[];
  expiration_date?: string;
}

export interface StockMovement {
  movement_id: string;
  warehouse_id: string;
  item_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_of_measure: string;
  
  // Location details
  from_location?: string;
  to_location?: string;
  zone_id: string;
  
  // Transaction details
  reference_number: string;      // Reference document number
  reason_code: string;           // Reason for movement
  performed_by: string;          // User ID who performed movement
  
  // Tracking information
  lot_number?: string;
  serial_number?: string;
  expiration_date?: string;
  
  // Financial impact
  unit_cost: number;
  total_cost: number;
  
  // Timestamps
  movement_date: string;
  created_at: string;
}

export interface WarehouseMetrics {
  warehouse_id: string;
  period_start: string;
  period_end: string;
  
  // Inventory metrics
  total_inventory_value: number;
  inventory_turnover: number;
  stockout_incidents: number;
  excess_inventory_value: number;
  
  // Order fulfillment metrics
  orders_processed: number;
  orders_shipped: number;
  order_accuracy_rate: number;
  average_fulfillment_time: number;
  on_time_delivery_rate: number;
  
  // Productivity metrics
  picks_per_hour: number;
  lines_per_hour: number;
  labor_productivity: number;
  equipment_utilization: number;
  
  // Space utilization
  capacity_utilization: number;
  zone_utilization: ZoneUtilization[];
  storage_efficiency: number;
  
  // Quality metrics
  damage_rate: number;
  return_rate: number;
  customer_satisfaction: number;
  
  // Cost metrics
  cost_per_order: number;
  labor_cost_per_hour: number;
  storage_cost_per_unit: number;
}

export interface ZoneUtilization {
  zone_id: string;
  zone_name: string;
  capacity: number;
  utilized: number;
  utilization_rate: number;
  inventory_value: number;
}

export interface WarehouseActivity {
  activity_id: string;
  warehouse_id: string;
  activity_type: WarehouseActivityType;
  description: string;
  user_id: string;
  order_id?: string;
  item_id?: string;
  equipment_id?: string;
  zone_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface StorageRequirements {
  temperature_min?: number;      // Minimum temperature (°F)
  temperature_max?: number;      // Maximum temperature (°F)
  humidity_min?: number;         // Minimum humidity (%)
  humidity_max?: number;         // Maximum humidity (%)
  requires_refrigeration: boolean;
  requires_freezing: boolean;
  hazardous_material: boolean;
  fragile: boolean;
  security_level: SecurityLevel;
  special_handling?: string[];
}

export interface Dimensions {
  length: number;                // Length in inches
  width: number;                 // Width in inches
  height: number;                // Height in inches
  volume: number;                // Volume in cubic inches
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface OperatingHours {
  [key: string]: {              // Day of week
    open: string;               // Opening time (HH:MM)
    close: string;              // Closing time (HH:MM)
    is_open: boolean;
  };
}

// Enums and Types
export type WarehouseType = 
  | 'distribution'      // Distribution center
  | 'fulfillment'       // E-commerce fulfillment
  | 'manufacturing'     // Manufacturing support
  | 'cross_dock'        // Cross-docking facility
  | 'cold_storage'      // Temperature controlled
  | 'hazmat';           // Hazardous materials

export type WarehouseStatus = 
  | 'active'           // Fully operational
  | 'limited'          // Limited operations
  | 'maintenance'      // Under maintenance
  | 'seasonal'         // Seasonal operation
  | 'inactive';        // Not operational

export type ZoneType = 
  | 'receiving'        // Receiving area
  | 'storage'          // General storage
  | 'picking'          // Pick zone
  | 'packing'          // Packing area
  | 'shipping'         // Shipping dock
  | 'returns'          // Returns processing
  | 'quarantine'       // Quality hold
  | 'staging';         // Staging area

export type SecurityLevel = 'low' | 'medium' | 'high' | 'restricted';

export type EquipmentType = 
  | 'forklift'         // Forklift
  | 'scanner'          // Barcode scanner
  | 'conveyor'         // Conveyor system
  | 'sorter'           // Sorting equipment
  | 'scale'            // Weighing scale
  | 'printer'          // Label printer
  | 'dock_equipment'   // Dock equipment
  | 'safety'           // Safety equipment
  | 'cleaning';        // Cleaning equipment

export type EquipmentStatus = 
  | 'available'        // Ready for use
  | 'in_use'           // Currently in use
  | 'maintenance'      // Under maintenance
  | 'repair'           // Being repaired
  | 'out_of_service';  // Not operational

export type EquipmentCondition = 
  | 'excellent'        // Like new
  | 'good'             // Good condition
  | 'fair'             // Some wear
  | 'poor'             // Needs attention
  | 'critical';        // Requires immediate action

export type ItemStatus = 
  | 'active'           // Available for sale
  | 'inactive'         // Not available
  | 'discontinued'     // Being phased out
  | 'obsolete'         // No longer used
  | 'quarantine';      // Quality hold

export type ABCClass = 'A' | 'B' | 'C';

export type StockVelocity = 'fast' | 'medium' | 'slow' | 'dead';

export type OrderType = 
  | 'standard'         // Standard order
  | 'rush'             // Rush order
  | 'backorder'        // Backorder fulfillment
  | 'replacement'      // Replacement order
  | 'sample'           // Sample request
  | 'return';          // Return processing

export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent' | 'emergency';

export type OrderStatus = 
  | 'received'         // Order received
  | 'released'         // Released to warehouse
  | 'picking'          // Being picked
  | 'picked'           // Pick complete
  | 'packing'          // Being packed
  | 'packed'           // Pack complete
  | 'shipped'          // Shipped
  | 'delivered'        // Delivered
  | 'cancelled'        // Cancelled
  | 'on_hold';         // On hold

export type MovementType = 
  | 'receipt'          // Goods receipt
  | 'issue'            // Goods issue
  | 'transfer'         // Location transfer
  | 'adjustment'       // Inventory adjustment
  | 'cycle_count'      // Cycle count
  | 'damage'           // Damage write-off
  | 'return'           // Customer return
  | 'disposal';        // Disposal

export type WarehouseActivityType = 
  | 'order_received'
  | 'order_picked'
  | 'order_packed'
  | 'order_shipped'
  | 'inventory_received'
  | 'inventory_adjusted'
  | 'equipment_maintenance'
  | 'zone_reorganized'
  | 'staff_assigned'
  | 'system_update';

// API Response Types
export interface WarehouseApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedWarehouseResponse<T> extends WarehouseApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Hook Types
export interface WarehouseDataState {
  loading: boolean;
  error: string | null;
  kind: string;
  data: Warehouse | null;
  _source?: string;
}

// Component Props
export interface WarehouseComponentProps {
  warehouseId: string;
  onError?: (error: string) => void;
  onSuccess?: (data: any) => void;
}