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