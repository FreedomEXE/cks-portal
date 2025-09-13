# Contractor Migrations

Execution order for contractor database migrations:

1. `001_contractor_users.sql` - User table structure
2. `002_contractor_rbac.sql` - RBAC permissions
3. `003_contractor_domain.sql` - Domain-specific tables
4. `004_contractor_activity_logs.sql` - Activity logging
5. `010_seed_contractor_caps.sql` - Capability seeding
