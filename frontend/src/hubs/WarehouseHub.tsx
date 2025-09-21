/*â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Property of CKS  Â© 2025
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*/
/**
 * File: WarehouseHub.tsx
 *
 * Description:
 * Warehouse Hub orchestrator component
 *
 * Responsibilities:
 * - Orchestrate warehouse role hub interface
 * - Manage tab navigation and content rendering
 *
 * Role in system:
 * - Primary interface for warehouse users
 *
 * Notes:
 * Uses MyHubSection for navigation
 */
/*â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Manifested by Freedom_EXE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*/

import React, { useState, useEffect, useMemo } from 'react';
import { Scrollbar } from '../../../packages/ui/src/Scrollbar';
import MyHubSection from '../components/MyHubSection';
import OverviewSection from '../../../packages/domain-widgets/src/overview';
import { RecentActivity, type Activity } from '../../../packages/domain-widgets/src/activity';
import { NewsPreview } from '../../../packages/domain-widgets/src/news';
import { MemosPreview } from '../../../packages/domain-widgets/src/memos';
import { ProfileInfoCard } from '../../../packages/domain-widgets/src/profile';
import DataTable from '../../../packages/ui/src/tables/DataTable';
import NavigationTab from '../../../packages/ui/src/navigation/NavigationTab';
import TabContainer from '../../../packages/ui/src/navigation/TabContainer';
import Button from '../../../packages/ui/src/buttons/Button';
import { OrdersSection } from '../../../packages/domain-widgets/src/OrdersSection';
import { SupportSection } from '../../../packages/domain-widgets/src/support';
import { ReportsSection } from '../../../packages/domain-widgets/src/reports';
import PageHeader from '../../../packages/ui/src/layout/PageHeader';
import PageWrapper from '../../../packages/ui/src/layout/PageWrapper';
import TabSection from '../../../packages/ui/src/layout/TabSection';

interface WarehouseHubProps {
  initialTab?: string;
}

export default function WarehouseHub({ initialTab = 'dashboard' }: WarehouseHubProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [servicesTab, setServicesTab] = useState('my');
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [inventoryTab, setInventoryTab] = useState('active');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [deliveriesTab, setDeliveriesTab] = useState('onetime');
  const [deliveriesSearchQuery, setDeliveriesSearchQuery] = useState('');

  // Add scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hub-content-scroll::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .hub-content-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .hub-content-scroll::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      .hub-content-scroll::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Mock activities for warehouse
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      message: 'New shipment received: 500 units of product SKU-123',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      type: 'success',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Shipment Received' }
    },
    {
      id: 'act-2',
      message: 'Low stock alert: Product SKU-456 below threshold',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'warning',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Stock Alert' }
    },
    {
      id: 'act-3',
      message: 'Order WO-2024-089 prepared for delivery',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'info',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Order Prepared' }
    },
    {
      id: 'act-4',
      message: 'Inventory audit completed for Section A',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'success',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Audit Complete' }
    },
    {
      id: 'act-5',
      message: 'Restocking order placed for 10 items',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      type: 'action',
      metadata: { role: 'warehouse', userId: 'WHS-001', title: 'Restock Ordered' }
    }
  ]);

  // Mock service orders for Warehouse - CLEARED FOR FRESH START
  // Warehouse service fulfillment orders - Warehouse provides services directly (no manager/crew)
  const serviceOrders: any[] = [
    // State 1: Pending warehouse acceptance (ACTION REQUIRED)
    {
      orderId: 'CTR001-ORD-SRV020',
      orderType: 'service',
      title: 'Inventory Management Service',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-22',
      status: 'pending',  // Warehouse sees as pending (needs to accept/deny)
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-19 08:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-19 10:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-19 13:00' },
        { role: 'Warehouse', status: 'pending' }  // Their action needed - should pulse
      ],
      description: 'Complete inventory audit and organization service',
      serviceType: 'Inventory',
      frequency: 'Quarterly',
      estimatedDuration: '8 hours',
      notes: 'Full warehouse inventory count and reorganization'
    },
    // State 2: Another pending warehouse service
    {
      orderId: 'CTR001-ORD-SRV021',
      orderType: 'service',
      title: 'Logistics Optimization Consultation',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-18',
      expectedDate: '2025-09-20',
      status: 'pending',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-18 09:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-18 11:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-18 14:00' },
        { role: 'Warehouse', status: 'pending' }  // Their action needed
      ],
      description: 'Supply chain and logistics workflow optimization',
      serviceType: 'Consultation',
      frequency: 'One-time',
      estimatedDuration: '4 hours',
      notes: 'Review current processes and recommend improvements'
    },
    // State 3: Warehouse accepted, service in progress
    {
      orderId: 'CTR001-ORD-SRV022',
      orderType: 'service',
      title: 'Emergency Storage Setup',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-16',
      expectedDate: '2025-09-18',
      status: 'in-progress',  // Warehouse accepted and working on it
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-16 07:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-16 09:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-16 12:00' },
        { role: 'Warehouse', status: 'accepted', user: 'WHS-001', timestamp: '2025-09-16 15:00' }
      ],
      description: 'Set up temporary storage solution for overflow inventory',
      serviceType: 'Setup',
      frequency: 'One-time',
      estimatedDuration: '6 hours',
      notes: 'Urgent - overflow from main warehouse needed immediately'
    },
    // State 4: Service completed by warehouse
    {
      orderId: 'CTR001-ORD-SRV023',
      orderType: 'service',
      title: 'Warehouse Safety Inspection',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-12',
      expectedDate: '2025-09-15',
      serviceStartDate: '2025-09-15',
      status: 'service-created',  // Service completed by warehouse
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-12 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-12 12:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-12 15:00' },
        { role: 'Warehouse', status: 'service-created', user: 'WHS-001', timestamp: '2025-09-15 16:00' }
      ],
      description: 'Comprehensive safety audit and compliance check',
      serviceType: 'Inspection',
      frequency: 'Annual',
      estimatedDuration: '3 hours',
      notes: 'Annual safety compliance inspection completed',
      serviceCompleted: true,
      completedDate: '2025-09-15'
    },
    // State 5: Rejected by warehouse
    {
      orderId: 'CTR001-ORD-SRV024',
      orderType: 'service',
      title: 'Hazardous Material Storage Setup',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-10',
      expectedDate: '2025-09-14',
      status: 'rejected',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-10 08:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-10 10:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-10 13:00' },
        { role: 'Warehouse', status: 'rejected', user: 'WHS-001', timestamp: '2025-09-10 16:00' }
      ],
      description: 'Setup specialized storage for hazardous materials',
      serviceType: 'Setup',
      frequency: 'One-time',
      estimatedDuration: '12 hours',
      rejectionReason: 'Facility lacks proper certification for hazardous material storage',
      notes: 'Requires specialized licensing not currently held'
    }
  ];

  // Mock product orders data for Warehouse - orders requiring warehouse action
  const productOrders: any[] = [
    // State 1: Pending warehouse acceptance (ACTION REQUIRED)
    {
      orderId: 'CRW001-ORD-PRD001',
      orderType: 'product',
      title: 'Cleaning Supplies - Standard Package',
      requestedBy: 'CRW-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-19',
      expectedDate: '2025-09-22',
      status: 'pending',  // Warehouse sees as 'pending' (action required)
      approvalStages: [
        { role: 'Crew', status: 'requested', user: 'CRW-001', timestamp: '2025-09-19 09:00' },
        { role: 'Warehouse', status: 'waiting' }  // 'waiting' shows yellow pending state
      ],
      approvalStage: {
        currentStage: 'warehouse',
        warehouseApproval: 'pending',
        warehouseNotes: null
      },
      items: [
        { name: 'All-Purpose Cleaner', quantity: 10, unit: 'bottles' },
        { name: 'Microfiber Cloths', quantity: 50, unit: 'pieces' },
        { name: 'Disinfectant Spray', quantity: 15, unit: 'cans' }
      ],
      notes: 'Urgent - running low on supplies for upcoming service'
    },
    // State 2: Accepted by warehouse (DELIVERY ACTION REQUIRED)
    {
      orderId: 'CRW001-ORD-PRD002',
      orderType: 'product',
      title: 'Safety Equipment Restock',
      requestedBy: 'CRW-001',
      destination: 'CTR-002',
      requestedDate: '2025-09-17',
      expectedDate: '2025-09-20',
      status: 'approved',  // Warehouse approved, pending delivery
      approvalStages: [
        { role: 'Crew', status: 'requested', user: 'CRW-001', timestamp: '2025-09-17 14:30' },
        { role: 'Warehouse', status: 'accepted' }
      ],
      approvalStage: {
        currentStage: 'delivery',
        warehouseApproval: 'approved',
        warehouseApprovedBy: 'WHS-001',
        warehouseApprovedDate: '2025-09-18',
        warehouseNotes: 'Stock available - preparing for shipment',
        deliveryStatus: 'pending'
      },
      items: [
        { name: 'Safety Gloves', quantity: 100, unit: 'pairs' },
        { name: 'Face Masks', quantity: 200, unit: 'pieces' },
        { name: 'Safety Goggles', quantity: 20, unit: 'pieces' }
      ],
      notes: 'Monthly safety equipment restock'
    },
    // State 3: Delivered (archived - no action)
    {
      orderId: 'CRW001-ORD-PRD003',
      orderType: 'product',
      title: 'Floor Care Products',
      requestedBy: 'CRW-001',
      destination: 'CTR-003',
      requestedDate: '2025-09-14',
      expectedDate: '2025-09-16',
      deliveryDate: '2025-09-16',
      status: 'delivered',
      approvalStages: [
        { role: 'Crew', status: 'requested', user: 'CRW-001', timestamp: '2025-09-14 08:00' },
        { role: 'Warehouse', status: 'accepted', user: 'WHS-001', timestamp: '2025-09-14 11:30' },
        { role: 'Warehouse', status: 'delivered', user: 'WHS-001', timestamp: '2025-09-16 15:45' }
      ],
      approvalStage: {
        currentStage: 'completed',
        warehouseApproval: 'approved',
        warehouseApprovedBy: 'WHS-001',
        warehouseApprovedDate: '2025-09-14',
        deliveryStatus: 'delivered',
        deliveredBy: 'WHS-001',
        deliveredDate: '2025-09-16',
        deliveryNotes: 'Delivered to loading dock - signed by J. Smith'
      },
      items: [
        { name: 'Floor Wax', quantity: 5, unit: 'gallons' },
        { name: 'Floor Stripper', quantity: 3, unit: 'gallons' },
        { name: 'Mop Heads', quantity: 24, unit: 'pieces' }
      ],
      notes: 'For scheduled floor maintenance at CTR-003'
    },
    // State 4: Rejected (archived - no action)
    {
      orderId: 'CRW001-ORD-PRD004',
      orderType: 'product',
      title: 'Specialized Equipment Request',
      requestedBy: 'CRW-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-12',
      expectedDate: '2025-09-15',
      status: 'rejected',
      approvalStages: [
        { role: 'Crew', status: 'requested', user: 'CRW-001', timestamp: '2025-09-12 10:00' },
        { role: 'Warehouse', status: 'rejected', user: 'WHS-001', timestamp: '2025-09-13 09:30' }
      ],
      approvalStage: {
        currentStage: 'rejected',
        warehouseApproval: 'rejected',
        warehouseRejectedBy: 'WHS-001',
        warehouseRejectedDate: '2025-09-13',
        warehouseNotes: 'Items not in current inventory - please contact procurement for special order',
        rejectionReason: 'Out of stock - requires special order'
      },
      items: [
        { name: 'Industrial Steam Cleaner', quantity: 2, unit: 'units' },
        { name: 'High-Pressure Washer', quantity: 1, unit: 'unit' }
      ],
      notes: 'Need for deep cleaning project'
    },
    // Center-initiated orders that have gone through full approval chain
    // State: Fully approved by Center->Customer->Contractor, pending warehouse
    {
      orderId: 'CTR001-ORD-PRD003',
      orderType: 'product',
      title: 'Emergency Supplies Request',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-16',
      expectedDate: '2025-09-20',
      status: 'pending',  // Warehouse sees as pending (ACTION REQUIRED)
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-16 08:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-16 09:15' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-16 11:00' },
        { role: 'Warehouse', status: 'pending' }  // Their action needed
      ],
      items: [
        { name: 'Spill Kit', quantity: 3, unit: 'kits' },
        { name: 'Safety Cones', quantity: 10, unit: 'units' },
        { name: 'Wet Floor Signs', quantity: 6, unit: 'signs' }
      ],
      notes: 'Urgent safety equipment needed'
    },
    // State: Warehouse accepted, pending delivery
    {
      orderId: 'CTR001-ORD-PRD004',
      orderType: 'product',
      title: 'Seasonal Decoration Supplies',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-14',
      expectedDate: '2025-09-18',
      status: 'approved',  // Warehouse accepted, pending delivery
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-14 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-14 14:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-15 09:00' },
        { role: 'Warehouse', status: 'accepted' }
      ],
      items: [
        { name: 'Holiday Decorations', quantity: 1, unit: 'set' },
        { name: 'String Lights', quantity: 20, unit: 'strands' }
      ],
      notes: 'For upcoming holiday season'
    },
    // State: Delivered
    {
      orderId: 'CTR001-ORD-PRD005',
      orderType: 'product',
      title: 'HVAC Filters Bulk Order',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-10',
      expectedDate: '2025-09-15',
      deliveryDate: '2025-09-15',
      status: 'delivered',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-10 09:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-10 11:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-11 10:00' },
        { role: 'Warehouse', status: 'delivered', user: 'WHS-001', timestamp: '2025-09-15 14:00' }
      ],
      items: [
        { name: 'HVAC Filters 20x25x1', quantity: 50, unit: 'filters' },
        { name: 'HVAC Filters 16x20x1', quantity: 30, unit: 'filters' }
      ],
      notes: 'Quarterly filter replacement stock'
    },
    // State: Rejected by warehouse
    {
      orderId: 'CTR001-ORD-PRD008',
      orderType: 'product',
      title: 'Specialty Tools Request',
      requestedBy: 'CTR-001',
      destination: 'CTR-001',
      requestedDate: '2025-09-03',
      expectedDate: '2025-09-08',
      status: 'rejected',
      approvalStages: [
        { role: 'Center', status: 'requested', user: 'CTR-001', timestamp: '2025-09-03 10:00' },
        { role: 'Customer', status: 'approved', user: 'CUS-001', timestamp: '2025-09-03 14:00' },
        { role: 'Contractor', status: 'approved', user: 'CON-001', timestamp: '2025-09-04 09:00' },
        { role: 'Warehouse', status: 'rejected', user: 'WHS-001', timestamp: '2025-09-04 15:00' }
      ],
      rejectionReason: 'Items discontinued - suggest alternative products',
      items: [
        { name: 'Specialty Floor Stripper Tool', quantity: 2, unit: 'units' }
      ],
      notes: 'For tile renovation project'
    }
  ];

  // Mock inventory data for warehouse
  const activeInventoryData = [
    {
      productId: 'PRD-001',
      name: 'Industrial Floor Scrubber',
      type: 'Equipment',
      onHand: 3,
      min: 2,
      location: 'A-12-B',
      isLow: false
    },
    {
      productId: 'PRD-002',
      name: 'Commercial Vacuum Cleaner',
      type: 'Equipment',
      onHand: 1,
      min: 2,
      location: 'A-15-C',
      isLow: true
    },
    {
      productId: 'PRD-003',
      name: 'Industrial Floor Cleaner',
      type: 'Products',
      onHand: 45,
      min: 25,
      location: 'B-01-A',
      isLow: false
    },
    {
      productId: 'PRD-004',
      name: 'Heavy Duty Degreaser',
      type: 'Products',
      onHand: 12,
      min: 20,
      location: 'B-02-C',
      isLow: true
    },
    {
      productId: 'PRD-005',
      name: 'Glass Cleaner Concentrate',
      type: 'Products',
      onHand: 0,
      min: 15,
      location: 'B-03-A',
      isLow: true
    },
    {
      productId: 'PRD-006',
      name: 'Microfiber Cleaning Cloths',
      type: 'Materials',
      onHand: 200,
      min: 50,
      location: 'C-05-C',
      isLow: false
    },
    {
      productId: 'PRD-007',
      name: 'Disposable Gloves (Box)',
      type: 'Materials',
      onHand: 8,
      min: 25,
      location: 'C-02-A',
      isLow: true
    },
    {
      productId: 'PRD-008',
      name: 'Mop Heads',
      type: 'Materials',
      onHand: 75,
      min: 30,
      location: 'C-10-B',
      isLow: false
    }
  ];

  const archivedInventoryData = [
    {
      productId: 'PRD-099',
      name: 'Obsolete Floor Waxer',
      type: 'Equipment',
      archivedDate: '2025-08-15',
      reason: 'Equipment replaced'
    },
    {
      productId: 'PRD-098',
      name: 'Discontinued Cleaner Brand',
      type: 'Products',
      archivedDate: '2025-07-20',
      reason: 'Product discontinued'
    },
    {
      productId: 'PRD-097',
      name: 'Old Safety Gloves',
      type: 'Materials',
      archivedDate: '2025-06-10',
      reason: 'Safety standards updated'
    },
    {
      productId: 'PRD-096',
      name: 'Broken Cleaning Cart',
      type: 'Equipment',
      archivedDate: '2025-05-25',
      reason: 'Damaged beyond repair'
    }
  ];

  // Filter inventory data based on type filter
  const filteredActiveInventoryData = useMemo(() => {
    if (!inventoryFilter || inventoryFilter === 'All Types') {
      return activeInventoryData;
    }
    return activeInventoryData.filter(item => item.type === inventoryFilter);
  }, [inventoryFilter]);

  const filteredArchivedInventoryData = useMemo(() => {
    if (!inventoryFilter || inventoryFilter === 'All Types') {
      return archivedInventoryData;
    }
    return archivedInventoryData.filter(item => item.type === inventoryFilter);
  }, [inventoryFilter]);

  // Mock deliveries data for warehouse
  const onetimeDeliveriesData = [
    {
      orderId: 'CRW001-ORD-PRD001',
      orderDate: '2025-09-11',
      quantity: 15,
      destination: 'CTR-001',
      status: 'pending',
      deliveryDate: 'â€”'
    },
    {
      orderId: 'CTR002-ORD-PRD003',
      orderDate: '2025-09-10',
      quantity: 8,
      destination: 'CTR-002',
      status: 'pending',
      deliveryDate: 'â€”'
    }
  ];

  const recurringDeliveriesData = [
    {
      orderId: 'CRW003-ORD-PRD005',
      creationDate: '2025-09-01',
      quantity: 25,
      destination: 'CTR-003',
      deliveryFrequency: 'Weekly',
      nextDelivery: '2025-09-18',
      status: 'pending'
    },
    {
      orderId: 'CTR001-ORD-PRD002',
      creationDate: '2025-08-15',
      quantity: 12,
      destination: 'CTR-004',
      deliveryFrequency: 'Monthly',
      nextDelivery: '2025-10-15',
      status: 'pending'
    }
  ];

  const archivedDeliveriesData = [
    {
      orderId: 'CRW002-ORD-PRD006',
      orderDate: '2025-09-08',
      quantity: 20,
      destination: 'CTR-005',
      status: 'delivered',
      deliveryDate: '2025-09-09',
      type: 'One-time'
    },
    {
      orderId: 'CTR003-ORD-PRD004',
      orderDate: '2025-09-07',
      quantity: 30,
      destination: 'CTR-006',
      status: 'delivered',
      deliveryDate: '2025-09-08',
      type: 'One-time'
    }
  ];

    const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/warehouse/dashboard' },
    { id: 'profile', label: 'My Profile', path: '/warehouse/profile' },
    { id: 'services', label: 'My Services', path: '/warehouse/services' },
    { id: 'inventory', label: 'Inventory', path: '/warehouse/inventory' },
    { id: 'orders', label: 'Orders', path: '/warehouse/orders' },
    { id: 'deliveries', label: 'Deliveries', path: '/warehouse/deliveries' },
    { id: 'reports', label: 'Reports', path: '/warehouse/reports' },
    { id: 'support', label: 'Support', path: '/warehouse/support' }
  ];

  // Warehouse-specific overview cards (5 cards)
  const overviewCards = [
    { id: 'products', title: 'Product Count', dataKey: 'productCount', color: 'purple' },
    { id: 'lowstock', title: 'Low Stock', dataKey: 'lowStockCount', color: 'red' },
    { id: 'orders', title: 'Pending Orders', dataKey: 'pendingOrders', color: 'orange' },
    { id: 'deliveries', title: 'Pending Deliveries', dataKey: 'pendingDeliveries', color: 'blue' },
    { id: 'status', title: 'Account Status', dataKey: 'accountStatus', color: 'green' }
  ];

  // Mock data - replace with actual API data
  const overviewData = {
    productCount: '2,456',
    lowStockCount: 23,
    pendingOrders: 34,
    pendingDeliveries: 12,
    accountStatus: 'Active'
  };

  // Mock services data for warehouse
  const myServicesData = [
    { serviceId: 'SRV-041', serviceName: 'Inventory Management', type: 'Recurring', certified: 'Yes', certificationDate: '2023-01-15', expires: '2026-01-15' },
    { serviceId: 'SRV-042', serviceName: 'Order Fulfillment', type: 'One-time', certified: 'Yes', certificationDate: '2023-03-20', expires: 'â€”' },
    { serviceId: 'SRV-043', serviceName: 'Shipping & Receiving', type: 'Recurring', certified: 'No', certificationDate: 'â€”', expires: 'â€”' },
    { serviceId: 'SRV-044', serviceName: 'Quality Control', type: 'One-time', certified: 'Yes', certificationDate: '2024-02-10', expires: '2025-02-10' },
  ];

  const activeServicesData = [
    { serviceId: 'CTR001-SRV041', serviceName: 'Inventory Management', centerId: 'CTR001', type: 'Recurring', startDate: '2025-09-15' },
    { serviceId: 'CTR002-SRV042', serviceName: 'Order Fulfillment', centerId: 'CTR002', type: 'One-time', startDate: '2025-09-18' },
    { serviceId: 'CTR003-SRV044', serviceName: 'Quality Control', centerId: 'CTR003', type: 'Recurring', startDate: '2025-09-20' },
  ];

  const serviceHistoryData = [
    { serviceId: 'CTR001-SRV045', serviceName: 'Order Fulfillment', centerId: 'CTR001', type: 'One-time', status: 'Completed', startDate: '2025-09-10', endDate: '2025-09-16' },
    { serviceId: 'CTR002-SRV046', serviceName: 'Shipping & Receiving', centerId: 'CTR002', type: 'Recurring', status: 'Completed', startDate: '2025-09-12', endDate: '2025-09-15' },
    { serviceId: 'CTR003-SRV047', serviceName: 'Quality Control', centerId: 'CTR003', type: 'One-time', status: 'Completed', startDate: '2025-09-08', endDate: '2025-09-14' },
    { serviceId: 'CTR001-SRV048', serviceName: 'Inventory Management', centerId: 'CTR001', type: 'Recurring', status: 'Cancelled', startDate: '2025-09-05', endDate: '2025-09-12' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <MyHubSection
        hubName="Warehouse Hub"
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        userId="WHS-001"
        role="warehouse"
      />

      {/* Content Area */}
      <Scrollbar style={{
        flex: 1,
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {activeTab === 'dashboard' ? (
            <PageWrapper title="Dashboard" showHeader={false}>
              <PageHeader title="Overview" />
              <OverviewSection
                cards={overviewCards}
                data={overviewData}
              />
              <PageHeader title="Recent Activity" />
              <RecentActivity
                activities={activities}
                onClear={() => setActivities([])}
                emptyMessage="No recent warehouse activity"
              />

              {/* Communication Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <NewsPreview onViewAll={() => console.log('View all news')} />
                <MemosPreview onViewAll={() => console.log('View memos')} />
              </div>
            </PageWrapper>
          ) : activeTab === 'profile' ? (
            <PageWrapper title="My Profile" showHeader={true} headerSrOnly>
              <ProfileInfoCard
              role="warehouse"
              profileData={{
                name: 'Central Distribution Warehouse',
                warehouseId: 'WHS-001',
                address: '999 Logistics Parkway, Dallas, TX 75201',
                phone: '(555) 012-3456',
                email: 'central@cks-warehouse.com',
                territory: 'Central Region',
                mainContact: 'Kevin Thompson',
                startDate: '2017-09-12'
              }}
              accountManager={{
                name: 'Jennifer Brown',
                id: 'MGR-006',
                email: 'jennifer.brown@cks.com',
                phone: '(555) 123-4567'
              }}
              primaryColor="#8b5cf6"
              onUpdatePhoto={() => console.log('Update photo')}
              onContactManager={() => console.log('Contact manager')}
              onScheduleMeeting={() => console.log('Schedule meeting')}
            />
            </PageWrapper>
          ) : activeTab === 'services' ? (
            <PageWrapper title="My Services" showHeader={true} headerSrOnly>
              <TabSection
                tabs={[
                  { id: 'my', label: 'My Services', count: 4 },
                  { id: 'active', label: 'Active Services', count: 3 },
                  { id: 'history', label: 'Service History', count: 4 }
                ]}
                activeTab={servicesTab}
                onTabChange={setServicesTab}
                description={
                  servicesTab === 'my' ? 'Services you are trained and certified in' :
                  servicesTab === 'active' ? 'Services you are currently assigned to' :
                  'Services Archive'
                }
                searchPlaceholder={
                  servicesTab === 'my' ? 'Search by Service ID or name' :
                  servicesTab === 'active' ? 'Search active services' :
                  'Search service history'
                }
                onSearch={setServicesSearchQuery}
                actionButton={
                  <Button
                    variant="primary"
                    roleColor="#000000"
                    onClick={() => console.log('Browse catalog')}
                  >
                    Browse CKS Catalog
                  </Button>
                }
                primaryColor="#8b5cf6"
              >

              {servicesTab === 'my' && (
                <DataTable
                  columns={[
                    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                    { key: 'serviceName', label: 'SERVICE NAME' },
                    { key: 'type', label: 'TYPE' },
                    { key: 'certified', label: 'CERTIFIED' },
                    { key: 'certificationDate', label: 'CERTIFICATION DATE' },
                    { key: 'expires', label: 'EXPIRES' }
                  ]}
                  data={myServicesData}
                  showSearch={false}
                  externalSearchQuery={servicesSearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View service:', row)}
                />
              )}

              {servicesTab === 'active' && (
                <DataTable
                  columns={[
                    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                    { key: 'serviceName', label: 'SERVICE NAME' },
                    { key: 'centerId', label: 'CENTER ID' },
                    { key: 'type', label: 'TYPE' },
                    { key: 'startDate', label: 'START DATE' }
                  ]}
                  data={activeServicesData}
                  showSearch={false}
                  externalSearchQuery={servicesSearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View order:', row)}
                />
              )}

              {servicesTab === 'history' && (
                <DataTable
                  columns={[
                    { key: 'serviceId', label: 'SERVICE ID', clickable: true },
                    { key: 'serviceName', label: 'SERVICE NAME' },
                    { key: 'centerId', label: 'CENTER ID' },
                    { key: 'type', label: 'TYPE' },
                    {
                      key: 'status',
                      label: 'STATUS',
                      render: (value: string) => (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: value === 'Completed' ? '#dcfce7' : '#fee2e2',
                          color: value === 'Completed' ? '#16a34a' : '#dc2626'
                        }}>
                          {value}
                        </span>
                      )
                    },
                    { key: 'startDate', label: 'START DATE' },
                    { key: 'endDate', label: 'END DATE' }
                  ]}
                  data={serviceHistoryData}
                  showSearch={false}
                  externalSearchQuery={servicesSearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View history:', row)}
                />
              )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'orders' ? (
            <PageWrapper title="Orders" showHeader={true} headerSrOnly>
              <OrdersSection
              userRole="warehouse"
              serviceOrders={serviceOrders}
              productOrders={productOrders}
              onCreateServiceOrder={() => console.log('Request Service')}
              onOrderAction={(orderId, action) => {
                if (action === 'View Details') {
                  // Find the order to determine its status
                  const allOrders = [...serviceOrders, ...productOrders];
                  const order = allOrders.find(o => o.orderId === orderId);

                  if (order) {
                    if (order.status === 'delivered') {
                      alert('Delivery and order details will show here later. We will be able to add a POD or waybill here.');
                    } else if (order.status === 'rejected') {
                      alert('Rejection details will show here later. It will also show a waybill and a rejection reason.');
                    } else if (order.status === 'pending' || order.status === 'in-progress') {
                      alert('List of products ordered will show here and some other info.');
                    }
                  }
                } else {
                  console.log(`Order ${orderId}: ${action}`);
                }
              }}
              showServiceOrders={true}
              showProductOrders={true}
              primaryColor="#8b5cf6"
            />
            </PageWrapper>
          ) : activeTab === 'inventory' ? (
            <PageWrapper headerSrOnly>
              <TabSection
                tabs={[
                  { id: 'active', label: 'Product Inventory', count: filteredActiveInventoryData.length },
                  { id: 'archive', label: 'Archive', count: filteredArchivedInventoryData.length }
                ]}
                activeTab={inventoryTab}
                onTabChange={setInventoryTab}
                description={inventoryTab === 'active' ? 'Current product inventory with stock levels' : 'Archived products no longer in active inventory'}
                searchPlaceholder={
                  inventoryTab === 'active' ? 'Search by Product ID or name' :
                  'Search archived products'
                }
                onSearch={setInventorySearchQuery}
                filterOptions={{
                  options: ['Equipment', 'Products', 'Materials'],
                  placeholder: 'All Types',
                  onFilter: setInventoryFilter
                }}
                primaryColor="#8b5cf6"
              >

              {inventoryTab === 'active' && (
                <DataTable
                  columns={[
                    { key: 'productId', label: 'PRODUCT ID', clickable: true },
                    { key: 'name', label: 'NAME' },
                    { key: 'type', label: 'TYPE' },
                    { key: 'onHand', label: 'ON HAND' },
                    { key: 'min', label: 'MIN' },
                    { key: 'location', label: 'LOCATION' },
                    {
                      key: 'isLow',
                      label: 'LOW?',
                      render: (value: boolean) => (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: value ? '#fee2e2' : '#dcfce7',
                          color: value ? '#dc2626' : '#16a34a'
                        }}>
                          {value ? 'Yes' : 'No'}
                        </span>
                      )
                    }
                  ]}
                  data={filteredActiveInventoryData}
                  showSearch={false}
                  externalSearchQuery={inventorySearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View product details:', row)}
                />
              )}

              {inventoryTab === 'archive' && (
                <DataTable
                  columns={[
                    { key: 'productId', label: 'PRODUCT ID', clickable: true },
                    { key: 'name', label: 'NAME' },
                    { key: 'type', label: 'TYPE' },
                    { key: 'archivedDate', label: 'ARCHIVED DATE' },
                    { key: 'reason', label: 'REASON' }
                  ]}
                  data={filteredArchivedInventoryData}
                  showSearch={false}
                  externalSearchQuery={inventorySearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View archived product:', row)}
                />
              )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'deliveries' ? (
            <PageWrapper headerSrOnly>
              <TabSection
                tabs={[
                  { id: 'onetime', label: 'One-Time', count: onetimeDeliveriesData.length },
                  { id: 'recurring', label: 'Recurring', count: recurringDeliveriesData.length },
                  { id: 'archive', label: 'Archive', count: archivedDeliveriesData.length }
                ]}
                activeTab={deliveriesTab}
                onTabChange={setDeliveriesTab}
                description={
                  deliveriesTab === 'onetime' ? 'One-time product deliveries pending completion' :
                  deliveriesTab === 'recurring' ? 'Recurring delivery schedules and frequencies' :
                  'Completed delivery records archive'
                }
                searchPlaceholder={
                  deliveriesTab === 'onetime' ? 'Search by Order ID or destination' :
                  deliveriesTab === 'recurring' ? 'Search recurring deliveries' :
                  'Search archived deliveries'
                }
                onSearch={setDeliveriesSearchQuery}
                primaryColor="#8b5cf6"
              >

              {deliveriesTab === 'onetime' && (
                <DataTable
                  columns={[
                    { key: 'orderId', label: 'ORDER ID', clickable: true },
                    { key: 'orderDate', label: 'ORDER DATE' },
                    { key: 'quantity', label: 'QUANTITY' },
                    { key: 'destination', label: 'DESTINATION' },
                    { key: 'status', label: 'STATUS' },
                    { key: 'deliveryDate', label: 'DELIVERY DATE' },
                    {
                      key: 'actions',
                      label: 'ACTIONS',
                      render: (value, row) => (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Marking ${row.orderId} as delivered`);
                              // This would archive the order with status 'delivered'
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: '#8b5cf6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delivered
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Cancelling ${row.orderId}`);
                              // This would archive the order with status 'cancelled'
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )
                    }
                  ]}
                  data={onetimeDeliveriesData}
                  showSearch={false}
                  externalSearchQuery={deliveriesSearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View delivery details:', row)}
                />
              )}

              {deliveriesTab === 'recurring' && (
                <DataTable
                  columns={[
                    { key: 'orderId', label: 'ORDER ID', clickable: true },
                    { key: 'creationDate', label: 'CREATION DATE' },
                    { key: 'quantity', label: 'QUANTITY' },
                    { key: 'destination', label: 'DESTINATION' },
                    { key: 'deliveryFrequency', label: 'DELIVERY FREQUENCY' },
                    { key: 'nextDelivery', label: 'NEXT DELIVERY' },
                    { key: 'status', label: 'STATUS' },
                    {
                      key: 'actions',
                      label: 'ACTIONS',
                      render: (value, row) => (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Marking ${row.orderId} as delivered`);
                              // This would archive the order with status 'delivered'
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: '#8b5cf6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delivered
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Cancelling ${row.orderId}`);
                              // This would archive the order with status 'cancelled'
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 500,
                              backgroundColor: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )
                    }
                  ]}
                  data={recurringDeliveriesData}
                  showSearch={false}
                  externalSearchQuery={deliveriesSearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View recurring delivery:', row)}
                />
              )}

              {deliveriesTab === 'archive' && (
                <DataTable
                  columns={[
                    { key: 'orderId', label: 'ORDER ID', clickable: true },
                    { key: 'orderDate', label: 'ORDER DATE' },
                    { key: 'quantity', label: 'QUANTITY' },
                    { key: 'destination', label: 'DESTINATION' },
                    { key: 'status', label: 'STATUS' },
                    { key: 'deliveryDate', label: 'DELIVERY DATE' },
                    { key: 'type', label: 'TYPE' }
                  ]}
                  data={archivedDeliveriesData}
                  showSearch={false}
                  externalSearchQuery={deliveriesSearchQuery}
                  maxItems={10}
                  onRowClick={(row) => console.log('View archived delivery:', row)}
                />
              )}
              </TabSection>
            </PageWrapper>
          ) : activeTab === 'reports' ? (
            <PageWrapper headerSrOnly>
              <ReportsSection
                role="warehouse"
                userId="WHS-001"
                primaryColor="#8b5cf6"
              />
            </PageWrapper>
          ) : activeTab === 'support' ? (
            <PageWrapper headerSrOnly>
              <SupportSection
                role="warehouse"
                primaryColor="#8b5cf6"
              />
            </PageWrapper>
          ) : (
            <PageWrapper title={activeTab} showHeader={true} headerSrOnly>
              <h2>Warehouse Hub - {activeTab}</h2>
              <p>Content for {activeTab} will be implemented here.</p>
            </PageWrapper>
          )}
        </div>
      </Scrollbar>
    </div>
  );
}

