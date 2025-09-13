# Customer Role Hub

**Role**: Customer  
**Hub Type**: Service Consumer  
**Status**: Active Development  

## Overview

The Customer hub provides homeowners and property managers with a comprehensive interface to request services, manage orders, track service history, and communicate with contractors in the CKS ecosystem.

## Core Features

### Dashboard & Navigation
- **Dashboard**: Overview of active services, recent activity, and recommendations
- **MyProfile**: Personal information and preferences management
- **MyServices**: Service request and management center
- **Orders**: Order tracking and history
- **Reports**: Service history and financial summaries
- **Support**: Help center and customer service

### Key Capabilities
- Service discovery and quote requests
- Order placement and tracking
- Contractor communication
- Payment management
- Service history and reviews
- Support ticket creation

## Technical Architecture

### Components
- `CustomerRecentActions.tsx` - Activity feed component
- Tab components for each navigation section
- Shared UI components from the design system

### Data Management
- `useCustomerData.ts` - Primary data hook
- API integration via `customerApi.ts`
- Authentication via `customerAuth.ts`

### API Integration
- Dedicated customer API endpoints
- Role-based authentication
- Real-time data synchronization

## Configuration

The customer hub is configured via `config.v1.json` with:
- Tab definitions and routing
- Permission requirements
- Feature flags
- UI customizations

## Development Status

**Current Progress**: Infrastructure Complete
- ✅ Tab structure implemented
- ✅ Navigation configured
- ✅ API integration ready
- ✅ Authentication system
- ✅ Component architecture

**Next Steps**: Content Implementation
- Service request workflow
- Order management interface
- Payment integration
- Review and rating system
- Mobile responsiveness

## Testing

Mock data is provided for development and testing scenarios. All components include fallback states for API failures.

## Security

- Role-based access control
- Customer-specific data isolation
- Secure API communication
- Payment data protection

---

*Part of the CKS Portal refactor - Config-driven hub architecture*