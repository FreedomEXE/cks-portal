# Customer Migrations

Execution order for customer database migrations:

1. `001_customer_users.sql` - User table structure
2. `002_customer_rbac.sql` - RBAC permissions
3. `003_customer_domain.sql` - Domain-specific tables
4. `004_customer_activity_logs.sql` - Activity logging
5. `010_seed_customer_caps.sql` - Capability seeding
