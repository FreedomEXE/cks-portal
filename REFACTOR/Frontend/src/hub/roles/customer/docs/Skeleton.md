# Customer Hub - Skeleton Structure

## Component Architecture

```
CustomerHub
├── Navigation (Dashboard, MyProfile, MyServices, Orders, Reports, Support)
├── Content Area (Tab Components)
└── Common Elements (Header, Footer, Modals)
```

## File Structure

```
customer/
├── config.v1.json                     # Hub configuration
├── index.ts                          # Export barrel
├── api/
│   └── customer.ts                   # API client - ✅ created
├── types/
│   └── customer.d.ts                 # TypeScript definitions - ✅ created
├── components/
│   └── CustomerRecentActions.tsx     # Activity widget - ✅ created
├── hooks/
│   └── useCustomerData.ts           # Data hook - ✅ created
├── utils/
│   ├── customerApi.ts               # API utilities - ✅ created
│   └── customerAuth.ts              # Auth utilities - ✅ created
├── tabs/
│   ├── Dashboard.tsx                # Main dashboard - ✅ created
│   ├── MyProfile.tsx               # Profile management - ✅ created
│   ├── MyServices.tsx              # Service center - ✅ created
│   ├── Orders.tsx                  # Order management - ✅ created
│   ├── Reports.tsx                 # Reports & analytics - ✅ created
│   └── Support.tsx                 # Support center - ✅ created
└── docs/
    ├── README.md                   # Overview - ✅ created
    ├── UI.md                       # Design guide - ✅ created
    ├── UEX.md                      # Experience guide - ✅ created
    ├── Skeleton.md                 # This file - ✅ created
    ├── API.md                      # API docs - pending
    ├── DataModel.md                # Data structures - pending
    ├── Permissions.md              # Security docs - pending
    ├── Testing.md                  # Test guide - pending
    └── Changelog.md                # Version history - pending
```

## Data Flow

```
useCustomerData → customerApi → Customer Backend
                ↓
CustomerRecentActions ← Customer Activity Data
                ↓
Dashboard Widgets ← Customer Profile & Orders
```

---

*Customer hub structural documentation*