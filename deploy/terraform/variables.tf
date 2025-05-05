variable "aws_region" {
  description = "AWS region for Lightsail instance"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
    description = "AWS access key"
    type        = string
    sensitive   = true
}

variable "aws_secret_key" {
    description = "AWS secret key"
    type        = string
    sensitive   = true
}

variable "aws_lightsail_blueprint_id" {
    description = "AWS Lightsail blueprint ID"
    type        = string
    default     = "ubuntu_22_04"
}

variable "aws_lightsail_bundle_id" {
    description = "AWS Lightsail bundle ID"
    type        = string
    default     = "micro_3_0"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the portfolio"
  type        = string
}

variable "db_password" {
  description = "PostgreSQL database password"
  type        = string
  sensitive   = true
}
