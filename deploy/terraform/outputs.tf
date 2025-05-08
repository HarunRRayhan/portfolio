output "public_ip" {
    description = "The public IP address of the Lightsail instance"
    value       = aws_lightsail_static_ip.portfolio.ip_address
}

output "instance_name" {
    description = "The name of the Lightsail instance"
    value       = aws_lightsail_instance.portfolio.name
}

output "private_key" {
    description = "The private key for SSH access"
    value       = aws_lightsail_key_pair.portfolio.private_key
    sensitive   = true
}

output "cloudflare_account_id" {
    description = "The Cloudflare Account ID used for R2 bucket"
    value       = var.cloudflare_account_id
}

output "vite_asset_base_url" {
  value = "https://cdn.harun.dev"
}

output "asset_url" {
  value = "https://cdn.harun.dev"
}
