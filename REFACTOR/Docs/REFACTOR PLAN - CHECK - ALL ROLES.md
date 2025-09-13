REFACTOR PLAN SKELETON FOR CODEBASE (ALL ROLE HUBS)

REFACTOR/
├── DATABASE/
│   ├── README.md                    # "Database module for CKS Portal refactor" - created
│   └── roles/
│       ├── manager/
│       │   ├── migrations/
│       │   │   ├── 001_manager_users.sql - created
│       │   │   ├── 002_manager_rbac.sql - created
│       │   │   ├── 003_manager_domain.sql - created
│       │   │   ├── 004_manager_activity_logs.sql - created
│       │   │   └── 010_seed_manager_caps.sql - created
│       │   └── docs/
│       │       ├── README.md - created
│       │       ├── DataModel.md - created
│       │       ├── Migrations.md - created
│       │       ├── RLS_Policies.md - created
│       │       ├── Seeds.md - created
│       │       └── Changelog.md - created
│       ├── contractor/
│       │   ├── migrations/
│       │   │   ├── 001_contractor_users.sql - created
│       │   │   ├── 002_contractor_rbac.sql - created
│       │   │   ├── 003_contractor_domain.sql - created
│       │   │   ├── 004_contractor_activity_logs.sql - created
│       │   │   └── 010_seed_contractor_caps.sql - created
│       │   └── docs/
│       │       ├── README.md - created
│       │       ├── DataModel.md - created
│       │       ├── Migrations.md - created
│       │       ├── RLS_Policies.md - created
│       │       ├── Seeds.md - created
│       │       └── Changelog.md - created
│       ├── customer/
│       │   ├── migrations/
│       │   │   ├── 001_customer_users.sql - created
│       │   │   ├── 002_customer_rbac.sql - created
│       │   │   ├── 003_customer_domain.sql - created
│       │   │   ├── 004_customer_activity_logs.sql - created
│       │   │   └── 010_seed_customer_caps.sql - created
│       │   └── docs/
│       │       ├── README.md - created
│       │       ├── DataModel.md - created
│       │       ├── Migrations.md - created
│       │       ├── RLS_Policies.md - created
│       │       ├── Seeds.md - created
│       │       └── Changelog.md - created
│       ├── center/
│       │   ├── migrations/
│       │   │   ├── 001_center_users.sql - created
│       │   │   ├── 002_center_rbac.sql - created
│       │   │   ├── 003_center_domain.sql - created
│       │   │   ├── 004_center_activity_logs.sql - created
│       │   │   └── 010_seed_center_caps.sql - created
│       │   └── docs/
│       │       ├── README.md - created
│       │       ├── DataModel.md - created
│       │       ├── Migrations.md - created
│       │       ├── RLS_Policies.md - created
│       │       ├── Seeds.md - created
│       │       └── Changelog.md - created
│       ├── crew/
│       │   ├── migrations/
│       │   │   ├── 001_crew_users.sql - created
│       │   │   ├── 002_crew_rbac.sql - created
│       │   │   ├── 003_crew_domain.sql - created
│       │   │   ├── 004_crew_activity_logs.sql - created
│       │   │   └── 010_seed_crew_caps.sql - created
│       │   └── docs/
│       │       ├── README.md - created
│       │       ├── DataModel.md - created
│       │       ├── Migrations.md - created
│       │       ├── RLS_Policies.md - created
│       │       ├── Seeds.md - created
│       │       └── Changelog.md - created
│       ├── warehouse/
│       │   ├── migrations/
│       │   │   ├── 001_warehouse_users.sql - created
│       │   │   ├── 002_warehouse_rbac.sql - created
│       │   │   ├── 003_warehouse_domain.sql - created
│       │   │   ├── 004_warehouse_activity_logs.sql - created
│       │   │   └── 010_seed_warehouse_caps.sql - created
│       │   └── docs/
│       │       ├── README.md - created
│       │       ├── DataModel.md - created
│       │       ├── Migrations.md - created
│       │       ├── RLS_Policies.md - created
│       │       ├── Seeds.md - created
│       │       └── Changelog.md - created
│       └── admin/
│           ├── migrations/
│           │   ├── 001_admin_users.sql - created
│           │   ├── 002_admin_rbac.sql - created
│           │   ├── 003_admin_domain.sql - created
│           │   ├── 004_admin_activity_logs.sql - created
│           │   └── 010_seed_admin_caps.sql - created
│           └── docs/
│               ├── README.md - created
│               ├── DataModel.md - created
│               ├── Migrations.md - created
│               ├── RLS_Policies.md - created
│               ├── Seeds.md - created
│               └── Changelog.md - created
│
├── BACKEND/
│   ├── README.md                    # "Backend module for CKS Portal refactor" - created
│   ├── package.json - created
│   ├── tsconfig.json - created
│   └── server/
│       ├── app.ts - created
│       ├── index.ts                 # Server entry point with database connection testing - created
│       ├── db/
│       │   └── connection.ts        # PostgreSQL connection pool and query helpers - created
│       ├── middleware/
│       │   ├── auth.ts - created
│       │   └── requireCaps.ts - created
│       └── roles/
│           ├── manager/
│           │   ├── routes/
│           │   │   ├── index.ts - created
│           │   │   ├── dashboard.ts - created
│           │   │   ├── profile.ts - created
│           │   │   ├── ecosystem.ts - created
│           │   │   ├── services.ts - created
│           │   │   ├── orders.ts - created
│           │   │   ├── reports.ts - created
│           │   │   └── support.ts - created
│           │   ├── services/
│           │   │   ├── dashboard.service.ts - created
│           │   │   ├── ecosystem.service.ts - created
│           │   │   ├── orders.service.ts - created
│           │   │   ├── profile.service.ts - created
│           │   │   ├── reports.service.ts - created
│           │   │   ├── services.service.ts - created
│           │   │   └── support.service.ts - created
│           │   ├── repositories/
│           │   │   ├── activity.repo.ts - created
│           │   │   ├── dashboard.repo.ts - created
│           │   │   ├── orders.repo.ts - created
│           │   │   ├── profile.repo.ts - created
│           │   │   └── services.repo.ts - created
│           │   ├── validators/
│           │   │   ├── dashboard.schema.ts - created
│           │   │   ├── orders.schema.ts - created
│           │   │   ├── profile.schema.ts - created
│           │   │   ├── reports.schema.ts - created
│           │   │   └── services.schema.ts - created
│           │   └── docs/
│           │       ├── README.md - created
│           │       ├── API_Surface.md - created
│           │       ├── ServicesDesign.md - created
│           │       ├── Repositories.md - created
│           │       ├── Validation.md - created
│           │       ├── Permissions.md - created
│           │       ├── Testing.md - created
│           │       └── Changelog.md - created
│           ├── contractor/
│           │   ├── routes/
│           │   │   ├── index.ts - created
│           │   │   ├── dashboard.ts - created
│           │   │   ├── profile.ts - created
│           │   │   ├── ecosystem.ts - created
│           │   │   ├── services.ts - created
│           │   │   ├── orders.ts - created
│           │   │   ├── reports.ts - created
│           │   │   └── support.ts - created
│           │   ├── services/
│           │   │   ├── dashboard.service.ts - created
│           │   │   ├── ecosystem.service.ts - created
│           │   │   ├── orders.service.ts - created
│           │   │   ├── profile.service.ts - created
│           │   │   ├── reports.service.ts - created
│           │   │   ├── services.service.ts - created
│           │   │   └── support.service.ts - created
│           │   ├── repositories/
│           │   │   ├── activity.repo.ts - created
│           │   │   ├── orders.repo.ts - created
│           │   │   ├── profile.repo.ts - created
│           │   │   └── services.repo.ts - created
│           │   ├── validators/
│           │   │   ├── dashboard.schema.ts - created
│           │   │   ├── orders.schema.ts - created
│           │   │   ├── profile.schema.ts - created
│           │   │   ├── reports.schema.ts - created
│           │   │   └── services.schema.ts - created
│           │   └── docs/
│           │       ├── README.md - created
│           │       ├── API_Surface.md - created
│           │       ├── ServicesDesign.md - created
│           │       ├── Repositories.md - created
│           │       ├── Validation.md - created
│           │       ├── Permissions.md - created
│           │       ├── Testing.md - created
│           │       └── Changelog.md - created
│           ├── customer/
│           │   ├── routes/
│           │   │   ├── index.ts - created
│           │   │   ├── dashboard.ts - created
│           │   │   ├── profile.ts - created
│           │   │   ├── ecosystem.ts - created
│           │   │   ├── services.ts - created
│           │   │   ├── orders.ts - created
│           │   │   ├── reports.ts - created
│           │   │   └── support.ts - created
│           │   ├── services/
│           │   │   ├── dashboard.service.ts - created
│           │   │   ├── ecosystem.service.ts - created
│           │   │   ├── orders.service.ts - created
│           │   │   ├── profile.service.ts - created
│           │   │   ├── reports.service.ts - created
│           │   │   ├── services.service.ts - created
│           │   │   └── support.service.ts - created
│           │   ├── repositories/
│           │   │   ├── activity.repo.ts - created
│           │   │   ├── orders.repo.ts - created
│           │   │   ├── profile.repo.ts - created
│           │   │   └── services.repo.ts - created
│           │   ├── validators/
│           │   │   ├── dashboard.schema.ts - created
│           │   │   ├── orders.schema.ts - created
│           │   │   ├── profile.schema.ts - created
│           │   │   ├── reports.schema.ts - created
│           │   │   └── services.schema.ts - created
│           │   └── docs/
│           │       ├── README.md - created
│           │       ├── API_Surface.md - created
│           │       ├── ServicesDesign.md - created
│           │       ├── Repositories.md - created
│           │       ├── Validation.md - created
│           │       ├── Permissions.md - created
│           │       ├── Testing.md - created
│           │       └── Changelog.md - created
│           ├── center/
│           │   ├── routes/
│           │   │   ├── index.ts - created
│           │   │   ├── dashboard.ts - created
│           │   │   ├── profile.ts - created
│           │   │   ├── ecosystem.ts - created
│           │   │   ├── services.ts - created
│           │   │   ├── orders.ts - created
│           │   │   ├── reports.ts - created
│           │   │   └── support.ts - created
│           │   ├── services/
│           │   │   ├── dashboard.service.ts - created
│           │   │   ├── ecosystem.service.ts - created
│           │   │   ├── orders.service.ts - created
│           │   │   ├── profile.service.ts - created
│           │   │   ├── reports.service.ts - created
│           │   │   ├── services.service.ts - created
│           │   │   └── support.service.ts - created
│           │   ├── repositories/
│           │   │   ├── activity.repo.ts - created
│           │   │   ├── dashboard.repo.ts - created
│           │   │   ├── orders.repo.ts - created
│           │   │   ├── profile.repo.ts - created
│           │   │   └── services.repo.ts - created
│           │   ├── validators/
│           │   │   ├── dashboard.schema.ts - created
│           │   │   ├── orders.schema.ts - created
│           │   │   ├── profile.schema.ts - created
│           │   │   ├── reports.schema.ts - created
│           │   │   └── services.schema.ts - created
│           │   └── docs/
│           │       ├── README.md - created
│           │       ├── API_Surface.md - created
│           │       ├── ServicesDesign.md - created
│           │       ├── Repositories.md - created
│           │       ├── Validation.md - created
│           │       ├── Permissions.md - created
│           │       ├── Testing.md - created
│           │       └── Changelog.md - created
│           ├── crew/
│           │   ├── routes/
│           │   │   ├── index.ts - created
│           │   │   ├── dashboard.ts - created
│           │   │   ├── profile.ts - created
│           │   │   ├── ecosystem.ts - created
│           │   │   ├── services.ts - created
│           │   │   ├── orders.ts - created
│           │   │   ├── reports.ts - created
│           │   │   └── support.ts - created
│           │   ├── services/
│           │   │   ├── dashboard.service.ts - created
│           │   │   ├── ecosystem.service.ts - created
│           │   │   ├── orders.service.ts - created
│           │   │   ├── profile.service.ts - created
│           │   │   ├── reports.service.ts - created
│           │   │   ├── services.service.ts - created
│           │   │   └── support.service.ts - created
│           │   ├── repositories/
│           │   │   ├── activity.repo.ts - created
│           │   │   ├── dashboard.repo.ts - created
│           │   │   ├── orders.repo.ts - created
│           │   │   ├── profile.repo.ts - created
│           │   │   └── services.repo.ts - created
│           │   ├── validators/
│           │   │   ├── dashboard.schema.ts - created
│           │   │   ├── orders.schema.ts - created
│           │   │   ├── profile.schema.ts - created
│           │   │   ├── reports.schema.ts - created
│           │   │   └── services.schema.ts - created
│           │   └── docs/
│           │       ├── README.md - created
│           │       ├── API_Surface.md - created
│           │       ├── ServicesDesign.md - created
│           │       ├── Repositories.md - created
│           │       ├── Validation.md - created
│           │       ├── Permissions.md - created
│           │       ├── Testing.md - created
│           │       └── Changelog.md - created
│           ├── warehouse/
│           │   ├── routes/
│           │   │   ├── index.ts - created
│           │   │   ├── dashboard.ts - created
│           │   │   ├── profile.ts - created
│           │   │   ├── services.ts - created
│           │   │   ├── inventory.ts - created
│           │   │   ├── orders.ts - created
│           │   │   ├── deliveries.ts - created
│           │   │   ├── reports.ts - created
│           │   │   └── support.ts - created
│           │   ├── services/
│           │   │   ├── dashboard.service.ts - created
│           │   │   ├── inventory.service.ts - created
│           │   │   ├── deliveries.service.ts - created
│           │   │   ├── orders.service.ts - created
│           │   │   ├── profile.service.ts - created
│           │   │   ├── reports.service.ts - created
│           │   │   ├── services.service.ts - created
│           │   │   └── support.service.ts - created
│           │   ├── repositories/
│           │   │   ├── activity.repo.ts - created
│           │   │   ├── dashboard.repo.ts - created
│           │   │   ├── inventory.repo.ts - created
│           │   │   ├── deliveries.repo.ts - created
│           │   │   ├── orders.repo.ts - created
│           │   │   ├── profile.repo.ts - created
│           │   │   └── services.repo.ts - created
│           │   ├── validators/
│           │   │   ├── dashboard.schema.ts - created
│           │   │   ├── inventory.schema.ts - created
│           │   │   ├── deliveries.schema.ts - created
│           │   │   ├── orders.schema.ts - created
│           │   │   ├── profile.schema.ts - created
│           │   │   ├── reports.schema.ts - created
│           │   │   └── services.schema.ts - created
│           │   └── docs/
│           │       ├── README.md - created
│           │       ├── API_Surface.md - created
│           │       ├── ServicesDesign.md - created
│           │       ├── Repositories.md - created
│           │       ├── Validation.md - created
│           │       ├── Permissions.md - created
│           │       ├── Testing.md - created
│           │       └── Changelog.md - created
│           └── admin/
│               ├── routes/
│               │   ├── index.ts - created
│               │   ├── dashboard.ts - created
│               │   ├── users.ts - created
│               │   ├── directory.ts - created
│               │   ├── create.ts - created
│               │   ├── assign.ts - created
│               │   ├── archive.ts - created
│               │   ├── profile.ts - created
│               │   └── support.ts - created
│               ├── services/
│               │   ├── dashboard.service.ts - created
│               │   ├── users.service.ts - created
│               │   ├── directory.service.ts - created
│               │   ├── create.service.ts - created
│               │   ├── assign.service.ts - created
│               │   ├── archive.service.ts - created
│               │   ├── profile.service.ts - created
│               │   └── support.service.ts - created
│               ├── repositories/
│               │   ├── users.repo.ts - created
│               │   ├── organizations.repo.ts - created
│               │   ├── system.repo.ts - created
│               │   ├── audit.repo.ts - created
│               │   └── roles.repo.ts - created
│               ├── validators/
│               │   ├── users.schema.ts - created
│               │   ├── organizations.schema.ts - created
│               │   ├── system.schema.ts - created
│               │   ├── audit.schema.ts - created
│               │   └── roles.schema.ts - created
│               └── docs/
│                   ├── README.md - created
│                   ├── API_Surface.md - created
│                   ├── ServicesDesign.md - created
│                   ├── Repositories.md - created
│                   ├── Validation.md - created
│                   ├── Permissions.md - created
│                   ├── Testing.md - created
│                   └── Changelog.md - created
│
└── FRONTEND/
    ├── README.md                    # "Frontend module for CKS Portal refactor" - created
    ├── package.json - created
    ├── tsconfig.json - created
    └── src/
        ├── test-hub-roles.tsx      # Testing interface for CKS hub roles - created
        ├── test-manager-hub.tsx    # Testing interface for manager hub specifically - created
        ├── shared/
        │   ├── api/
        │   │   └── base.ts      # Shared API utilities - created
        │   ├── types/
        │   │   └── api.d.ts     # Shared types - created
        │   └── schemas/
        │       └── roleConfig.ts - created
        ├── hub/
        │   ├── RoleHub.tsx - created
        │   ├── roleConfigLoader.ts - created
        │   └── roles/
        │       ├── manager/
        │       │   ├── config.v1.json - created
        │       │   ├── index.ts - created
        │       │   ├── api/
        │       │   │   └── manager.ts - created
        │       │   ├── types/
        │       │   │   └── manager.d.ts - created
        │       │   ├── components/
        │       │   │   └── ManagerRecentActions.tsx - created
        │       │   ├── hooks/
        │       │   │   └── useManagerData.ts - created
        │       │   ├── utils/
        │       │   │   ├── managerApi.ts - created
        │       │   │   └── managerAuth.ts - created
        │       │   ├── tabs/
        │       │   │   ├── Dashboard.tsx - created
        │       │   │   ├── MyProfile.tsx - created
        │       │   │   ├── Ecosystem.tsx - created
        │       │   │   ├── MyServices.tsx - created
        │       │   │   ├── Orders.tsx - created
        │       │   │   ├── Reports.tsx - created
        │       │   │   └── Support.tsx - created
        │       │   └── docs/
        │       │       ├── README.md - created
        │       │       ├── UI.md - created
        │       │       ├── UEX.md - created
        │       │       ├── Skeleton.md - created
        │       │       ├── API.md - created
        │       │       ├── DataModel.md - created
        │       │       ├── Permissions.md - created
        │       │       ├── Testing.md - created
        │       │       └── Changelog.md - created
        │       ├── contractor/
        │       │   ├── config.v1.json - created
        │       │   ├── index.ts - created
        │       │   ├── api/
        │       │   │   └── contractor.ts - created
        │       │   ├── types/
        │       │   │   └── contractor.d.ts - created
        │       │   ├── components/
        │       │   │   └── ContractorRecentActions.tsx - missing
        │       │   ├── hooks/
        │       │   │   └── useContractorData.ts - created
        │       │   ├── utils/
        │       │   │   ├── contractorApi.ts - created
        │       │   │   └── contractorAuth.ts - created
        │       │   ├── tabs/
        │       │   │   ├── Dashboard.tsx - created
        │       │   │   ├── MyProfile.tsx - created
        │       │   │   ├── Ecosystem.tsx - created
        │       │   │   ├── MyServices.tsx - created
        │       │   │   ├── Orders.tsx - created
        │       │   │   ├── Reports.tsx - created
        │       │   │   └── Support.tsx - created
        │       │   └── docs/
        │       │       ├── README.md - missing
        │       │       ├── UI.md - missing
        │       │       ├── UEX.md - missing
        │       │       ├── Skeleton.md - missing
        │       │       ├── API.md - missing
        │       │       ├── DataModel.md - missing
        │       │       ├── Permissions.md - missing
        │       │       ├── Testing.md - missing
        │       │       └── Changelog.md - missing
        │       ├── customer/
        │       │   ├── config.v1.json - created
        │       │   ├── index.ts - created
        │       │   ├── api/
        │       │   │   └── customer.ts - missing
        │       │   ├── types/
        │       │   │   └── customer.d.ts - created
        │       │   ├── components/
        │       │   │   └── CustomerRecentActions.tsx - missing
        │       │   ├── hooks/
        │       │   │   └── useCustomerData.ts - missing
        │       │   ├── utils/
        │       │   │   ├── customerApi.ts - missing
        │       │   │   └── customerAuth.ts - missing
        │       │   ├── tabs/
        │       │   │   ├── Dashboard.tsx - created
        │       │   │   ├── MyProfile.tsx - created
        │       │   │   ├── Ecosystem.tsx - created
        │       │   │   ├── MyServices.tsx - created
        │       │   │   ├── Orders.tsx - created
        │       │   │   ├── Reports.tsx - created
        │       │   │   └── Support.tsx - created
        │       │   └── docs/
        │       │       ├── README.md - missing
        │       │       ├── UI.md - missing
        │       │       ├── UEX.md - missing
        │       │       ├── Skeleton.md - missing
        │       │       ├── API.md - missing
        │       │       ├── DataModel.md - missing
        │       │       ├── Permissions.md - missing
        │       │       ├── Testing.md - missing
        │       │       └── Changelog.md - missing
        │       ├── center/
        │       │   ├── config.v1.json - created
        │       │   ├── index.ts - created
        │       │   ├── api/
        │       │   │   └── center.ts - missing
        │       │   ├── types/
        │       │   │   └── center.d.ts - missing
        │       │   ├── components/
        │       │   │   └── CenterRecentActions.tsx - missing
        │       │   ├── hooks/
        │       │   │   └── useCenterData.ts - missing
        │       │   ├── utils/
        │       │   │   ├── centerApi.ts - missing
        │       │   │   └── centerAuth.ts - missing
        │       │   ├── tabs/
        │       │   │   ├── Dashboard.tsx - created
        │       │   │   ├── MyProfile.tsx - created
        │       │   │   ├── Ecosystem.tsx - created
        │       │   │   ├── MyServices.tsx - created
        │       │   │   ├── Orders.tsx - created
        │       │   │   ├── Reports.tsx - created
        │       │   │   └── Support.tsx - created
        │       │   └── docs/
        │       │       ├── README.md - missing
        │       │       ├── UI.md - missing
        │       │       ├── UEX.md - missing
        │       │       ├── Skeleton.md - missing
        │       │       ├── API.md - missing
        │       │       ├── DataModel.md - missing
        │       │       ├── Permissions.md - missing
        │       │       ├── Testing.md - missing
        │       │       └── Changelog.md - missing
        │       ├── crew/
        │       │   ├── config.v1.json - created
        │       │   ├── index.ts - created
        │       │   ├── api/
        │       │   │   └── crew.ts - missing
        │       │   ├── types/
        │       │   │   └── crew.d.ts - missing
        │       │   ├── components/
        │       │   │   └── CrewRecentActions.tsx - missing
        │       │   ├── hooks/
        │       │   │   └── useCrewData.ts - missing
        │       │   ├── utils/
        │       │   │   ├── crewApi.ts - missing
        │       │   │   └── crewAuth.ts - missing
        │       │   ├── tabs/
        │       │   │   ├── Dashboard.tsx - created
        │       │   │   ├── MyProfile.tsx - created
        │       │   │   ├── Ecosystem.tsx - created
        │       │   │   ├── MyServices.tsx - created
        │       │   │   ├── Orders.tsx - created
        │       │   │   ├── Reports.tsx - created
        │       │   │   └── Support.tsx - created
        │       │   └── docs/
        │       │       ├── README.md - missing
        │       │       ├── UI.md - missing
        │       │       ├── UEX.md - missing
        │       │       ├── Skeleton.md - missing
        │       │       ├── API.md - missing
        │       │       ├── DataModel.md - missing
        │       │       ├── Permissions.md - missing
        │       │       ├── Testing.md - missing
        │       │       └── Changelog.md - missing
        │       ├── warehouse/
        │       │   ├── config.v1.json - created
        │       │   ├── index.ts - created
        │       │   ├── api/
        │       │   │   └── warehouse.ts - missing
        │       │   ├── types/
        │       │   │   └── warehouse.d.ts - missing
        │       │   ├── components/
        │       │   │   └── WarehouseRecentActions.tsx - missing
        │       │   ├── hooks/
        │       │   │   └── useWarehouseData.ts - missing
        │       │   ├── utils/
        │       │   │   ├── warehouseApi.ts - missing
        │       │   │   └── warehouseAuth.ts - missing
        │       │   ├── tabs/
        │       │   │   ├── Dashboard.tsx - created
        │       │   │   ├── MyProfile.tsx - created
        │       │   │   ├── Services.tsx - created
        │       │   │   ├── Inventory.tsx - created
        │       │   │   ├── Orders.tsx - created
        │       │   │   ├── Deliveries.tsx - created
        │       │   │   ├── Reports.tsx - created
        │       │   │   └── Support.tsx - created
        │       │   └── docs/
        │       │       ├── README.md - missing
        │       │       ├── UI.md - missing
        │       │       ├── UEX.md - missing
        │       │       ├── Skeleton.md - missing
        │       │       ├── API.md - missing
        │       │       ├── DataModel.md - missing
        │       │       ├── Permissions.md - missing
        │       │       ├── Testing.md - missing
        │       │       └── Changelog.md - missing
        │       └── admin/
        │           ├── config.v1.json - created
        │           ├── index.ts - created
        │           ├── api/
        │           │   └── admin.ts - created
        │           ├── types/
        │           │   └── admin.d.ts - created
        │           ├── components/
        │           │   └── AdminRecentActions.tsx - created
        │           ├── hooks/
        │           │   └── useAdminData.ts - created
        │           ├── utils/
        │           │   ├── adminApi.ts - created
        │           │   └── adminAuth.ts - created
        │           ├── tabs/
        │           │   ├── Dashboard.tsx - created
        │           │   ├── Directory.tsx - created
        │           │   ├── Create.tsx - created
        │           │   ├── Assign.tsx - created
        │           │   ├── Archive.tsx - created
        │           │   ├── Profile.tsx - created
        │           │   └── Support.tsx - created
        │           └── docs/
        │               ├── README.md - created
        │               ├── UI.md - created
        │               ├── UEX.md - created
        │               ├── Skeleton.md - created
        │               ├── API.md - created
        │               ├── DataModel.md - created
        │               ├── Permissions.md - created
        │               ├── Testing.md - created
        │               └── Changelog.md - created