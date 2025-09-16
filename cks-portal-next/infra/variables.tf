#-----------------------------------------------
#  Property of CKS  © 2025
#-----------------------------------------------
# File: variables.tf
#
# Description:
# Terraform variables for infrastructure configuration
#
# Responsibilities:
# - Define input variables with types and descriptions
# - Set default values where appropriate
#
# Role in system:
# - Used by Terraform to configure infrastructure
#
# Notes:
# Environment-specific values set via terraform.tfvars
#-----------------------------------------------
#  Manifested by Freedom_EXE
#-----------------------------------------------

# General Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cks-portal"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Database Configuration
variable "create_rds" {
  description = "Whether to create RDS instance"
  type        = bool
  default     = true
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.4"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "Initial allocated storage for RDS (GB)"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for RDS (GB)"
  type        = number
  default     = 100
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "cks_portal"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "cks_admin"
}

variable "backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

# Application Configuration
variable "app_image_gateway" {
  description = "Docker image for Gateway service"
  type        = string
  default     = "cks-portal/gateway:latest"
}

variable "app_image_backend" {
  description = "Docker image for Backend service"
  type        = string
  default     = "cks-portal/backend:latest"
}

variable "app_image_frontend" {
  description = "Docker image for Frontend service"
  type        = string
  default     = "cks-portal/frontend:latest"
}

variable "app_image_worker" {
  description = "Docker image for Worker service"
  type        = string
  default     = "cks-portal/worker:latest"
}

# ECS Configuration
variable "gateway_cpu" {
  description = "CPU units for Gateway service"
  type        = number
  default     = 256
}

variable "gateway_memory" {
  description = "Memory (MB) for Gateway service"
  type        = number
  default     = 512
}

variable "gateway_desired_count" {
  description = "Desired number of Gateway tasks"
  type        = number
  default     = 2
}

variable "backend_cpu" {
  description = "CPU units for Backend service"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory (MB) for Backend service"
  type        = number
  default     = 1024
}

variable "backend_desired_count" {
  description = "Desired number of Backend tasks"
  type        = number
  default     = 2
}

variable "frontend_cpu" {
  description = "CPU units for Frontend service"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MB) for Frontend service"
  type        = number
  default     = 512
}

variable "frontend_desired_count" {
  description = "Desired number of Frontend tasks"
  type        = number
  default     = 2
}

variable "worker_cpu" {
  description = "CPU units for Worker service"
  type        = number
  default     = 256
}

variable "worker_memory" {
  description = "Memory (MB) for Worker service"
  type        = number
  default     = 512
}

variable "worker_desired_count" {
  description = "Desired number of Worker tasks"
  type        = number
  default     = 1
}

# Domain and SSL
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = ""
}

variable "create_acm_certificate" {
  description = "Whether to create ACM certificate"
  type        = bool
  default     = false
}

# Monitoring and Logging
variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch logs"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "enable_xray" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = true
}

# Redis Configuration
variable "create_redis" {
  description = "Whether to create ElastiCache Redis cluster"
  type        = bool
  default     = true
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

# Security
variable "enable_deletion_protection" {
  description = "Enable deletion protection for resources"
  type        = bool
  default     = false
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the application"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Scaling
variable "enable_autoscaling" {
  description = "Enable ECS service autoscaling"
  type        = bool
  default     = true
}

variable "autoscaling_target_cpu" {
  description = "Target CPU utilization for autoscaling"
  type        = number
  default     = 70
}

variable "autoscaling_target_memory" {
  description = "Target memory utilization for autoscaling"
  type        = number
  default     = 80
}

variable "autoscaling_min_capacity" {
  description = "Minimum capacity for autoscaling"
  type        = number
  default     = 1
}

variable "autoscaling_max_capacity" {
  description = "Maximum capacity for autoscaling"
  type        = number
  default     = 10
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}