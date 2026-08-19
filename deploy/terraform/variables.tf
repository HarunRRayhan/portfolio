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

variable "r2_bucket_name" {
  description = "Name of the Cloudflare R2 bucket to use"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID for R2 bucket binding (if needed)"
  type        = string
}
