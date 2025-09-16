#-----------------------------------------------
#  Property of CKS  © 2025
#-----------------------------------------------
# File: security.rego
#
# Description:
# Security-focused OPA policies for infrastructure
#
# Responsibilities:
# - Enforce security best practices and compliance
# - Prevent misconfigured security settings
#
# Role in system:
# - Used by CI/CD to validate security compliance
#
# Notes:
# Implements defense-in-depth security principles
#-----------------------------------------------
#  Manifested by Freedom_EXE
#-----------------------------------------------

package terraform.security.advanced

import rego.v1

# Network Security Policies

# Deny overly permissive security groups
deny[msg] {
    input.resource_changes[_].type == "aws_security_group"
    rule := input.resource_changes[_].change.after.ingress[_]
    rule.from_port == 0
    rule.to_port == 65535
    rule.protocol == "-1"
    "0.0.0.0/0" in rule.cidr_blocks
    msg := "Security group must not allow all traffic from anywhere"
}

# Require private subnets for databases
deny[msg] {
    input.resource_changes[_].type == "aws_db_instance"
    subnet_group := input.resource_changes[_].change.after.db_subnet_group_name

    # Check if subnet group uses public subnets
    sg_resource := input.resource_changes[_]
    sg_resource.type == "aws_db_subnet_group"
    sg_resource.change.after.name == subnet_group

    subnet_id := sg_resource.change.after.subnet_ids[_]
    subnet_resource := input.resource_changes[_]
    subnet_resource.type == "aws_subnet"
    subnet_resource.change.after.id == subnet_id
    subnet_resource.change.after.map_public_ip_on_launch == true

    msg := "Database instances must be placed in private subnets only"
}

# Encryption Requirements

# Require KMS encryption for sensitive resources
deny[msg] {
    input.resource_changes[_].type == "aws_s3_bucket_server_side_encryption_configuration"
    rule := input.resource_changes[_].change.after.rule[_]
    rule.apply_server_side_encryption_by_default.sse_algorithm != "aws:kms"
    msg := "S3 buckets must use KMS encryption"
}

# Require encryption in transit
deny[msg] {
    input.resource_changes[_].type == "aws_db_instance"
    input.resource_changes[_].change.after.engine == "postgres"
    not input.resource_changes[_].change.after.parameter_group_name
    msg := "PostgreSQL instances must use parameter group with SSL enforcement"
}

# Access Control Policies

# Deny IAM policies with overly broad permissions
deny[msg] {
    input.resource_changes[_].type == "aws_iam_policy"
    policy_doc := json.unmarshal(input.resource_changes[_].change.after.policy)
    statement := policy_doc.Statement[_]
    statement.Effect == "Allow"
    statement.Action[_] == "*"
    statement.Resource[_] == "*"
    msg := "IAM policies must not grant full access to all resources"
}

# Require MFA for sensitive IAM roles
warn[msg] {
    input.resource_changes[_].type == "aws_iam_role"
    role := input.resource_changes[_].change.after
    tags := role.tags
    tags.Sensitive == "true"
    not contains(role.assume_role_policy, "aws:MultiFactorAuthPresent")
    msg := "Sensitive IAM roles should require MFA"
}

# Monitoring and Logging Policies

# Require CloudTrail for audit logging
warn[msg] {
    count([ct | ct := input.resource_changes[_]; ct.type == "aws_cloudtrail"]) == 0
    msg := "CloudTrail should be enabled for audit logging"
}

# Require VPC Flow Logs
warn[msg] {
    vpc_resources := [vpc | vpc := input.resource_changes[_]; vpc.type == "aws_vpc"]
    count(vpc_resources) > 0
    flow_log_resources := [fl | fl := input.resource_changes[_]; fl.type == "aws_flow_log"]
    count(flow_log_resources) == 0
    msg := "VPC Flow Logs should be enabled for network monitoring"
}

# Container Security Policies

# Require non-root containers in ECS
deny[msg] {
    input.resource_changes[_].type == "aws_ecs_task_definition"
    container := json.unmarshal(input.resource_changes[_].change.after.container_definitions)[_]
    container.user == "root"
    msg := "ECS containers must not run as root user"
}

# Require resource limits for containers
deny[msg] {
    input.resource_changes[_].type == "aws_ecs_task_definition"
    container := json.unmarshal(input.resource_changes[_].change.after.container_definitions)[_]
    not container.memory
    msg := "ECS containers must have memory limits defined"
}

# Compliance Policies

# SOC 2 Compliance Requirements
soc2_compliant_resource_types := [
    "aws_s3_bucket",
    "aws_db_instance",
    "aws_ecs_cluster",
    "aws_vpc"
]

deny[msg] {
    resource := input.resource_changes[_]
    resource.type in soc2_compliant_resource_types
    tags := resource.change.after.tags
    not tags.Compliance
    msg := sprintf("Resource %s must have Compliance tag for SOC 2", [resource.type])
}

# Data Classification Requirements
deny[msg] {
    input.resource_changes[_].type == "aws_s3_bucket"
    tags := input.resource_changes[_].change.after.tags
    tags.DataClassification in ["confidential", "restricted"]
    not tags.Owner
    msg := "Confidential/Restricted S3 buckets must have Owner tag"
}

# Cost Optimization Policies

# Warn about expensive instance types in non-production
warn[msg] {
    input.resource_changes[_].type == "aws_instance"
    tags := input.resource_changes[_].change.after.tags
    tags.Environment != "prod"
    instance_type := input.resource_changes[_].change.after.instance_type
    startswith(instance_type, "x1")
    msg := sprintf("Expensive instance type %s used in non-production environment", [instance_type])
}

# Backup and Recovery Policies

# Require automated backups for production databases
deny[msg] {
    input.resource_changes[_].type == "aws_db_instance"
    tags := input.resource_changes[_].change.after.tags
    tags.Environment == "prod"
    input.resource_changes[_].change.after.backup_retention_period == 0
    msg := "Production databases must have automated backups enabled"
}

# Helper functions
contains(string, substring) {
    contains(string, substring)
}