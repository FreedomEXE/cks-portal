# CKS Portal Testing Credentials

## Authentication Information for Testing

### **Admin Account**
- **Username**: `freedom_exe`
- **Password**: `Fr33dom123!`
- **Hub Access**: Full admin hub with all system management capabilities
- **Permissions**: Create users, manage all entities, assign roles, system configuration

### **Template User Accounts**
All template users use the same password: `CksDemo!2025`

#### **Available Template Users**
- **WH-000** → Warehouse Hub (inventory, shipments, orders)
- **CRW-000** → Crew Hub (profile, schedule, communications)
- **CUS-000** → Customer Hub (service requests, order tracking)
- **CEN-000** → Center Hub (location management, staff coordination)
- **CON-000** → Contractor Hub (request approval, project management)
- **MGR-000** → Manager Hub (team oversight, scheduling, assignments)

## Testing URLs

### **Frontend Application**
- **Login Page**: http://localhost:5183/login
- **Direct Hub Access**: http://localhost:5183/hub/{role}

### **Backend API**
- **Base URL**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Database Test**: http://localhost:5000/test-db
- **API Documentation**: http://localhost:5000/api/docs

## Testing Workflow

### **1. Initial Admin Setup**
1. Login as `freedom_exe` / `Fr33dom123!`
2. Navigate to Admin Hub → Create tab
3. Create real users for each role type
4. Use Assign tab to configure crew→center assignments

### **2. Template User Testing**
1. Use template accounts (WH-000, CRW-000, etc.) with `CksDemo!2025`
2. Test core functionality in each hub
3. Verify cross-hub data integration
4. Test business workflows end-to-end

### **3. Business Process Testing**
1. **Service Ordering**: Customer → Catalog → Request → Contractor Approval → Manager Schedule
2. **Warehouse Operations**: Order fulfillment → Inventory updates → Shipment tracking
3. **User Management**: Admin creates → Users access → Role-based functionality
4. **Communication**: Reports and feedback across hubs

## System Status

- **Frontend**: Running on port 5183
- **Backend**: Running on port 5000
- **Database**: PostgreSQL (remote hosted)
- **Authentication**: Clerk integration
- **Status**: Testing Ready (85-90% complete)

## Notes

- All template users are pre-configured and functional
- Admin account has full system privileges
- Role-based routing automatically directs users to appropriate hubs
- Cross-hub data integration is fully operational
- System supports real-time user creation and management

---

*Property of CKS © 2025 – Manifested by Freedom*