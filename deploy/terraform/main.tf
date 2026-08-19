terraform {
  required_providers {
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

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "random_id" "bucket_suffix" {
  byte_length = 4 # 8 hex characters
}

# Cloudflare R2 CDN Worker
resource "cloudflare_workers_script" "cdn_proxy" {
  account_id  = var.cloudflare_account_id
  script_name = "cdn-harun-dev"
  content     = file("${path.module}/cdn-proxy.js")

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

# Apex now serves via Railway behind the Cloudflare proxy (verified live
# against the Cloudflare API 2026-08-19). Resource address kept as
# "root_a" even though it's a CNAME now, to avoid a destroy/create on
# next apply — renaming would need a `terraform state mv` first.
resource "cloudflare_dns_record" "root_a" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "CNAME"
  content = "0iyhmk4h.up.railway.app"
  proxied = true
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

# Simple www redirect using Workers
resource "cloudflare_workers_script" "www_redirect" {
  account_id  = var.cloudflare_account_id
  script_name = "www-redirect-harun-dev"
  content     = <<-EOF
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (url.hostname === 'www.harun.dev') {
    const redirectUrl = 'https://harun.dev' + url.pathname + url.search
    return Response.redirect(redirectUrl, 301)
  }
  
  return fetch(request)
}
EOF
}

resource "cloudflare_workers_route" "www_redirect_route" {
  zone_id = var.cloudflare_zone_id
  pattern = "www.harun.dev/*"
  script  = cloudflare_workers_script.www_redirect.script_name
}

resource "cloudflare_dns_record" "blog_cname" {
  zone_id = var.cloudflare_zone_id
  name    = "blog"
  type    = "CNAME"
  content = "workers.dev"
  proxied = true
  ttl     = 1
}

resource "cloudflare_workers_script" "blog_redirect" {
  account_id  = var.cloudflare_account_id
  script_name = "blog-redirect-harun-dev"
  content     = <<-EOF
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  if (url.hostname === 'blog.harun.dev' || url.hostname === 'www.blog.harun.dev') {
    const path = url.pathname === '/' ? '' : url.pathname.replace(/^\//, '')
    const redirectUrl = `https://harun.dev/blog/$${path}$${url.search}`
    return Response.redirect(redirectUrl, 301)
  }

  return fetch(request)
}
EOF
}

resource "cloudflare_workers_route" "blog_redirect_route" {
  zone_id = var.cloudflare_zone_id
  pattern = "blog.harun.dev/*"
  script  = cloudflare_workers_script.blog_redirect.script_name
}

resource "cloudflare_workers_route" "blog_redirect_www_route" {
  zone_id = var.cloudflare_zone_id
  pattern = "www.blog.harun.dev/*"
  script  = cloudflare_workers_script.blog_redirect.script_name
}



