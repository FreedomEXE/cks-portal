# Admin Database Documentation

## Overview

The Admin database structure provides comprehensive system administration capabilities for the CKS Portal. This includes user management, organization oversight, role-based access control, system configuration, and audit trails.

## Database Structure

### Core Tables

#### Admin Users (`admin_users`)
- Primary admin user accounts with enhanced security features
- Includes 2FA support, account locking, and session management
- Separate from regular system users for security isolation

#### Admin RBAC (`admin_capabilities`, `admin_roles`, etc.)
- Granular permission system for admin functions
- Role-based access with capability inheritance
- Permission caching for performance

#### System Management (`system_config`, `organizations`, `system_users`)
- System-wide configuration management
- Organization hierarchy and management
- Unified user management across all roles

#### Audit and Logging
- Comprehensive audit trails for all admin actions
- Security event tracking and monitoring
- Compliance and regulatory audit support

### Migration Files

1. `001_admin_users.sql` - Admin user structure and sessions
2. `002_admin_rbac.sql` - Role-based access control system
3. `003_admin_domain.sql` - System configuration and management
4. `004_admin_activity_logs.sql` - Comprehensive logging system
5. `010_seed_admin_caps.sql` - Default capabilities and roles

## Security Features

- Multi-factor authentication support
- Account lockout mechanisms
- Session management and tracking
- Comprehensive audit logging
- Granular permission control
- Security event monitoring

## Admin Roles

- **Super Administrator**: Full system access including admin management
- **System Administrator**: System management without admin user control
- **User Administrator**: User and organization management focus
- **Security Administrator**: Security, audit, and compliance focus
- **Read-Only Administrator**: View-only system access

## Key Capabilities

- User lifecycle management
- Organization hierarchy management
- Role assignment and permission control
- System configuration and monitoring
- Audit trail and compliance reporting
- Security incident management