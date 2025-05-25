terraform {
    required_providers {
        aws = {
            source  = "hashicorp/aws"
            version = "~> 5.0"
        }
        cloudflare = {
            source  = "cloudflare/cloudflare"
            version = "~> 5.4"
        }
    }

    backend "s3" {
        key          = "terraform.tfstate"
        use_lockfile = true
        # The bucket name will be provided via -backend-config
    }
}

provider "aws" {
    region     = var.aws_region
    access_key = var.aws_access_key
    secret_key = var.aws_secret_key
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
# Removed cloudflare_record.portfolio resource to avoid DNS record conflict

resource "random_id" "bucket_suffix" {
    byte_length = 4 # 8 hex characters
}

# Cloudflare R2 CDN Worker
resource "cloudflare_workers_script" "cdn_proxy" {
    account_id  = var.cloudflare_account_id
    script_name = "cdn-harun-dev"
    content = file("${path.module}/cdn-proxy.js")

    bindings = [
        {
            name        = "ASSETS_BUCKET"
            bucket_name = var.r2_bucket_name
            type        = "r2_bucket"
        }
    ]
}

resource "cloudflare_workers_route" "cdn_route" {
    zone_id = var.cloudflare_zone_id
    pattern = "cdn.harun.dev/*"
    script  = cloudflare_workers_script.cdn_proxy.script_name
}

resource "cloudflare_dns_record" "cdn_cname" {
    zone_id = var.cloudflare_zone_id
    name    = "cdn"
    type    = "CNAME"
    content = "workers.dev"
    proxied = true
    ttl     = 1
}

resource "cloudflare_dns_record" "root_a" {
    zone_id = var.cloudflare_zone_id
    name    = "@"
    type    = "A"
    content = aws_lightsail_static_ip.portfolio.ip_address
    proxied = false
    ttl     = 1
}

resource "cloudflare_dns_record" "www_cname" {
    zone_id = var.cloudflare_zone_id
    name    = "www"
    type    = "CNAME"
    content = "harun.dev"
    proxied = true
    ttl     = 1
}

# Redirect www.harun.dev to harun.dev using Cloudflare Page Rules
resource "cloudflare_page_rule" "redirect_www" {
    zone_id  = var.cloudflare_zone_id
    target   = "www.harun.dev/*"
    priority = 1

    actions = {
        forwarding_url = {
            url         = "https://harun.dev/$1"
            status_code = 301
        }
    }
}



