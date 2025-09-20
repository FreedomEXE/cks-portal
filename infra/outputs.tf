#-----------------------------------------------
#  Property of CKS  © 2025
#-----------------------------------------------
# File: outputs.tf
#
# Description:
# Terraform outputs for infrastructure resources
#
# Responsibilities:
# - Export important resource identifiers and endpoints
# - Provide values for other configurations or deployments
#
# Role in system:
# - Used by other Terraform modules or CI/CD pipelines
#
# Notes:
# Sensitive outputs are marked appropriately
#-----------------------------------------------
#  Manifested by Freedom_EXE
#-----------------------------------------------

# VPC and Networking Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

# Database Outputs
output "rds_instance_id" {
  description = "ID of the RDS instance"
  value       = var.create_rds ? aws_db_instance.main[0].id : null
}

output "rds_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = var.create_rds ? aws_db_instance.main[0].endpoint : null
}

output "rds_instance_port" {
  description = "RDS instance port"
  value       = var.create_rds ? aws_db_instance.main[0].port : null
}

output "database_name" {
  description = "Name of the database"
  value       = var.database_name
}

output "database_username" {
  description = "Database username"
  value       = var.database_username
  sensitive   = true
}

output "database_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

# General Outputs
output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "name_prefix" {
  description = "Name prefix used for resources"
  value       = local.name_prefix
}

# Database Connection String Output (for applications)
output "database_url" {
  description = "Database connection URL"
  value = var.create_rds ? format(
    "postgresql://%s:%s@%s:%d/%s",
    var.database_username,
    random_password.db_password.result,
    aws_db_instance.main[0].endpoint,
    aws_db_instance.main[0].port,
    var.database_name
  ) : null
  sensitive = true
}

# Availability Zones
output "availability_zones" {
  description = "Availability zones used"
  value       = local.azs
}

# Account Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

# Resource Tags
output "common_tags" {
  description = "Common tags applied to resources"
  value       = local.common_tags
}