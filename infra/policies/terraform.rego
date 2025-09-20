#-----------------------------------------------
#  Property of CKS  © 2025
#-----------------------------------------------
# File: terraform.rego
#
# Description:
# OPA policy checks for Terraform configurations
#
# Responsibilities:
# - Enforce infrastructure security best practices
# - Validate resource configurations
#
# Role in system:
# - Used by CI/CD pipeline to validate Terraform plans
#
# Notes:
# Policies are evaluated before infrastructure deployment
#-----------------------------------------------
#  Manifested by Freedom_EXE
#-----------------------------------------------

package terraform.security

import rego.v1

# Deny public S3 buckets
deny[msg] {
    input.resource_changes[_].type == "aws_s3_bucket_public_access_block"
    input.resource_changes[_].change.after.block_public_acls == false
    msg := "S3 bucket must block public ACLs"
}

deny[msg] {
    input.resource_changes[_].type == "aws_s3_bucket_public_access_block"
    input.resource_changes[_].change.after.block_public_policy == false
    msg := "S3 bucket must block public policy"
}

# Require encryption for RDS instances
deny[msg] {
    input.resource_changes[_].type == "aws_db_instance"
    input.resource_changes[_].change.after.storage_encrypted == false
    msg := "RDS instances must have encryption enabled"
}

# Require encryption for EBS volumes
deny[msg] {
    input.resource_changes[_].type == "aws_ebs_volume"
    input.resource_changes[_].change.after.encrypted == false
    msg := "EBS volumes must be encrypted"
}

# Ensure security groups don't allow unrestricted access on sensitive ports
deny[msg] {
    input.resource_changes[_].type == "aws_security_group"
    rule := input.resource_changes[_].change.after.ingress[_]
    rule.from_port <= 22
    rule.to_port >= 22
    "0.0.0.0/0" in rule.cidr_blocks
    msg := "Security group must not allow unrestricted SSH access"
}

deny[msg] {
    input.resource_changes[_].type == "aws_security_group"
    rule := input.resource_changes[_].change.after.ingress[_]
    rule.from_port <= 3389
    rule.to_port >= 3389
    "0.0.0.0/0" in rule.cidr_blocks
    msg := "Security group must not allow unrestricted RDP access"
}

# Require deletion protection for production databases
deny[msg] {
    input.resource_changes[_].type == "aws_db_instance"
    tags := input.resource_changes[_].change.after.tags
    tags.Environment == "prod"
    input.resource_changes[_].change.after.deletion_protection == false
    msg := "Production RDS instances must have deletion protection enabled"
}

# Ensure backup retention for production databases
deny[msg] {
    input.resource_changes[_].type == "aws_db_instance"
    tags := input.resource_changes[_].change.after.tags
    tags.Environment == "prod"
    input.resource_changes[_].change.after.backup_retention_period < 7
    msg := "Production RDS instances must have at least 7 days backup retention"
}

# Require HTTPS for load balancers
warn[msg] {
    input.resource_changes[_].type == "aws_lb_listener"
    input.resource_changes[_].change.after.protocol == "HTTP"
    msg := "Load balancer listeners should use HTTPS"
}

# Ensure VPC flow logs are enabled
warn[msg] {
    vpc_count := count([vpc | vpc := input.resource_changes[_]; vpc.type == "aws_vpc"])
    flow_log_count := count([log | log := input.resource_changes[_]; log.type == "aws_flow_log"])
    vpc_count > flow_log_count
    msg := "VPC should have flow logs enabled"
}

# Require specific instance types for production
deny[msg] {
    input.resource_changes[_].type == "aws_instance"
    tags := input.resource_changes[_].change.after.tags
    tags.Environment == "prod"
    instance_type := input.resource_changes[_].change.after.instance_type
    not startswith(instance_type, "m5")
    not startswith(instance_type, "c5")
    not startswith(instance_type, "r5")
    msg := sprintf("Production instances must use approved instance types, got: %s", [instance_type])
}

# Ensure ECS tasks have appropriate resource limits
warn[msg] {
    input.resource_changes[_].type == "aws_ecs_task_definition"
    task_def := input.resource_changes[_].change.after
    task_def.cpu < 256
    msg := "ECS tasks should have adequate CPU allocation"
}

warn[msg] {
    input.resource_changes[_].type == "aws_ecs_task_definition"
    task_def := input.resource_changes[_].change.after
    task_def.memory < 512
    msg := "ECS tasks should have adequate memory allocation"
}

# Require tags on resources
required_tags := ["Project", "Environment", "ManagedBy"]

deny[msg] {
    resource := input.resource_changes[_]
    resource.type in ["aws_instance", "aws_db_instance", "aws_ecs_cluster", "aws_vpc"]
    missing_tags := [tag | tag := required_tags[_]; not resource.change.after.tags[tag]]
    count(missing_tags) > 0
    msg := sprintf("Resource missing required tags: %v", [missing_tags])
}