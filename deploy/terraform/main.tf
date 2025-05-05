terraform {
    required_providers {
        aws = {
            source  = "hashicorp/aws"
            version = "~> 5.0"
        }
        cloudflare = {
            source  = "cloudflare/cloudflare"
            version = "~> 4.0"
        }
    }
}

provider "aws" {
    region = var.aws_region
    access_key = var.aws_access_key
    secret_key = var.aws_secret_key
    # profile = "haruns-portfolio-hrwprod"
}

provider "cloudflare" {
    api_token = var.cloudflare_api_token
}

# AWS Lightsail instance
resource "aws_lightsail_instance" "portfolio" {
    name              = "portfolio-server-new"
    availability_zone = "${var.aws_region}a"
    blueprint_id      = var.aws_lightsail_blueprint_id
    bundle_id         = var.aws_lightsail_bundle_id
    key_pair_name     = aws_lightsail_key_pair.portfolio.name
    user_data = file("${path.module}/user_data.sh")
}

# SSH key pair for Lightsail
resource "aws_lightsail_key_pair" "portfolio" {
    name = "portfolio-key"
}

# Static IP for Lightsail instance
resource "aws_lightsail_static_ip" "portfolio" {
    name = "portfolio-static-ip"
}

resource "aws_lightsail_static_ip_attachment" "portfolio" {
    static_ip_name = aws_lightsail_static_ip.portfolio.name
    instance_name  = aws_lightsail_instance.portfolio.name
}

# Firewall rules
resource "aws_lightsail_instance_public_ports" "portfolio" {
    instance_name = aws_lightsail_instance.portfolio.name

    port_info {
        protocol  = "tcp"
        from_port = 80
        to_port   = 80
    }

    port_info {
        protocol  = "tcp"
        from_port = 443
        to_port   = 443
    }

    port_info {
        protocol  = "tcp"
        from_port = 22
        to_port   = 22
    }
}

# Cloudflare DNS record
resource "cloudflare_record" "portfolio" {
    zone_id = var.cloudflare_zone_id
    name    = var.domain_name
    value   = aws_lightsail_static_ip.portfolio.ip_address
    type    = "A"
    proxied = true
}
