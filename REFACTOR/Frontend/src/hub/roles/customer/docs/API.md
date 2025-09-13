# Customer Hub - API Documentation

## Base Configuration
- **Base URL**: `/api/customer`
- **Authentication**: Header-based with `x-customer-user-id`

## Core Endpoints

### Profile Management
- `GET /api/customer/profile` - Get customer profile
- `PUT /api/customer/profile` - Update customer profile

### Service Management
- `GET /api/customer/services` - Browse available services
- `POST /api/customer/services/quote` - Request service quote
- `GET /api/customer/orders` - Get customer orders
- `POST /api/customer/orders` - Create new order

### Activity & Support
- `GET /api/customer/activity` - Get recent activity
- `POST /api/customer/clear-activity` - Clear activity log
- `POST /api/customer/support/tickets` - Create support ticket

---

*Customer API reference documentation*