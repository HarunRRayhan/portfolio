#!/Users/rayhan/.hermes/hermes-agent/venv/bin/python3.11
"""
Generate blog cover images for haruns-portfolio.

Mirrors the approach from blog-writer/src/images/cover.ts:
  - Gradient background (1600x840)
  - Title text overlay (centered, word-wrapped)
  - Optional AWS icon row
  - Footer with site URL and social handle

Usage:
  python3 scripts/generate-cover.py <post-slug>
  python3 scripts/generate-cover.py <post-slug> --title "Custom Title"
  python3 scripts/generate-cover.py <post-slug> --icons lambda,terraform,s3 --gradient "#1a5276,#6c3483"
"""
from PIL import Image, ImageDraw, ImageFont
import argparse, json, os, re, sys, math

# --- Constants ---
COVER_W = 1600
COVER_H = 840
ICON_SIZE = 100
ICON_SPACING = 140
ICONS_DIR = os.path.expanduser("~/Code/blog-writer/src/images/aws-icons")
POSTS_DIR = os.path.expanduser("resources/blog/posts")
ASSETS_DIR = os.path.expanduser("public/blog-assets")

DEFAULT_GRADIENT = ("#1a5276", "#6c3483")
DEFAULT_ICONS = ["lambda", "rds", "apigateway", "codedeploy", "cloudformation"]

# --- Helpers ---

def parse_hex(color: str) -> tuple:
    """Parse '#RRGGBB' or '#RGB' to (R, G, B) tuple."""
    c = color.lstrip("#")
    if len(c) == 3:
        c = "".join(x * 2 for x in c)
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16))


def interpolate_color(c1: tuple, c2: tuple, t: float) -> tuple:
    """Linearly interpolate between two RGB colors at ratio t (0-1)."""
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def draw_gradient(draw: ImageDraw, w: int, h: int, from_color: str, to_color: str):
    """Draw a diagonal gradient from top-left to bottom-right."""
    c1 = parse_hex(from_color)
    c2 = parse_hex(to_color)
    for y in range(h):
        for x in range(w):
            t = (x / w + y / h) / 2  # diagonal blend
            t = max(0.0, min(1.0, t))
            color = interpolate_color(c1, c2, t)
            draw.point((x, y), fill=color)


def wrap_text(text: str, max_chars: int = 28) -> list:
    """Word-wrap text to fit within max_chars per line."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        if current and len(current) + len(word) + 1 > max_chars:
            lines.append(current.strip())
            current = word
        else:
            current += (" " if current else "") + word
    if current:
        lines.append(current.strip())
    return lines


def draw_title(draw: ImageDraw, title: str, font_path: str = None):
    """Draw centered, wrapped title on the cover."""
    lines = wrap_text(title, 28)
    font_size = 58
    if len(lines) >= 4:
        font_size = 44
    elif len(lines) >= 3:
        font_size = 50

    font = None
    if font_path and os.path.exists(font_path):
        try:
            font = ImageFont.truetype(font_path, font_size)
        except Exception:
            font = None

    if font is None:
        # Fallback to default — small but works
        font = ImageFont.load_default()

    line_height = int(font_size * 1.35)
    block_h = len(lines) * line_height
    start_y = COVER_H * 0.38 - block_h / 2 + font_size * 0.3

    for i, line in enumerate(lines):
        _, _, tw, th = font.getbbox(line) if hasattr(font, 'getbbox') else (0, 0, 0, 0)
        # Use textbbox for centering
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (COVER_W - tw) / 2
        y = start_y + i * line_height
        draw.text((x, y), line, fill="white", font=font)


def draw_footer(draw: ImageDraw, font_path: str = None):
    """Draw site URL and social handle footer."""
    font_size = 22
    font = None
    if font_path and os.path.exists(font_path):
        try:
            font = ImageFont.truetype(font_path, font_size)
        except Exception:
            font = None
    if font is None:
        font = ImageFont.load_default()

    base_y = COVER_H - 55
    fill = (255, 255, 255, 230)

    # Left: globe dot + harun.dev
    bbox = draw.textbbox((0, 0), "harun.dev", font=font)
    text_w = bbox[2] - bbox[0]
    draw.text((45, base_y - font_size * 0.25), "harun.dev", fill=fill, font=font)

    # Right: @HarunRRayhan
    bbox2 = draw.textbbox((0, 0), "@HarunRRayhan", font=font)
    handle_w = bbox2[2] - bbox2[0]
    draw.text((COVER_W - 45 - handle_w, base_y - font_size * 0.25),
              "@HarunRRayhan", fill=fill, font=font)


def load_post_slug(post_slug: str) -> dict | None:
    """Load blog post frontmatter from the markdown file."""
    md_path = os.path.join(POSTS_DIR, f"{post_slug}.md")
    if not os.path.exists(md_path):
        print(f"Post not found: {md_path}")
        return None

    with open(md_path) as f:
        content = f.read()

    # Parse YAML-ish frontmatter
    m = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not m:
        print(f"No frontmatter found in {md_path}")
        return None

    meta = {}
    for line in m.group(1).strip().split("\n"):
        if ":" in line:
            key, _, val = line.partition(":")
            meta[key.strip()] = val.strip().strip('"')
    return meta


def find_icons_for_post(post_slug: str) -> list[str]:
    """Guess relevant AWS icons from post slug content."""
    post = load_post_slug(post_slug)
    if not post:
        return DEFAULT_ICONS

    title = (post.get("title", "") + " " + post_slug).lower()

    # Map keywords to icons
    keyword_map = {
        "lambda": "lambda", "function": "lambda", "serverless": "lambda",
        "terraform": "terraform", "iac": "terraform", "infrastructure": "terraform",
        "s3": "s3", "storage": "s3", "object": "s3",
        "api": "apigateway", "gateway": "apigateway", "rest": "apigateway",
        "ecs": "ecs", "fargate": "fargate", "container": "ecs",
        "rds": "rds", "database": "rds", "postgres": "rds",
        "bedrock": "bedrock", "ai": "bedrock", "claude": "bedrock", "llm": "bedrock",
        "ec2": "ec2", "lightsail": "ec2",
        "cloudfront": "s3", "cdn": "s3",
        "cicd": "codedeploy", "ci/cd": "codedeploy", "deploy": "codedeploy",
        "sqs": "sqs", "queue": "sqs", "event": "eventbridge",
        "redis": "elasticache", "cache": "elasticache",
        "aurora": "aurora",
        "dynamodb": "dynamodb", "dynamo": "dynamodb",
        "ecr": "ecr", "docker": "ecr",
        "laravel": "laravel",
        "cloudformation": "cloudformation",
    }

    found = []
    for keyword, icon in keyword_map.items():
        if keyword in title:
            icon_path = os.path.join(ICONS_DIR, f"{icon}.png")
            if os.path.exists(icon_path) and icon not in found:
                found.append(icon)

    return found[:5] if found else DEFAULT_ICONS


def generate_cover(post_slug: str, title: str = None,
                   icons: list[str] = None, gradient: tuple = None):
    """Main cover generation function."""
    global POSTS_DIR, ASSETS_DIR

    # Allow running from project root
    alt_posts = os.path.join(os.getcwd(), "resources/blog/posts")
    alt_assets = os.path.join(os.getcwd(), "public/blog-assets")
    if not os.path.exists(POSTS_DIR) and os.path.exists(alt_posts):
        POSTS_DIR = alt_posts
        ASSETS_DIR = alt_assets

    # Resolve title from post frontmatter if not provided
    if not title:
        post = load_post_slug(post_slug)
        if post and post.get("title"):
            title = post["title"]
        else:
            title = post_slug.replace("-", " ").title()

    # Resolve icons
    if icons is None:
        icons = find_icons_for_post(post_slug)

    # Resolve gradient
    if gradient is None:
        if "bedrock" in post_slug or "migrat" in post_slug:
            gradient = ("#1a3a5c", "#6c3483")  # amber-ish
        elif "review" in post_slug or "code" in post_slug:
            gradient = ("#1a2a4c", "#4338ca")  # indigo
        elif "cicd" in post_slug or "actions" in post_slug or "deploy" in post_slug:
            gradient = ("#0f3b6c", "#3b82f6")  # blue
        else:
            gradient = DEFAULT_GRADIENT

    # Create output path
    out_dir = os.path.join(ASSETS_DIR, post_slug)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "cover.jpg")

    # Build image
    img = Image.new("RGB", (COVER_W, COVER_H))
    draw = ImageDraw.Draw(img)

    print(f"Generating cover for: {title}")
    print(f"  Gradient: {gradient[0]} → {gradient[1]}")
    print(f"  Icons: {', '.join(icons)}")
    print(f"  Output: {out_path}")

    # Draw gradient background
    from_color, to_color = gradient
    draw_gradient(draw, COVER_W, COVER_H, from_color, to_color)

    # Draw title
    draw_title(draw, title)

    # Draw footer
    draw_footer(draw)

    # Composite AWS icons
    icon_count = len(icons)
    total_icons_w = (icon_count - 1) * ICON_SPACING
    icons_start_x = int((COVER_W - total_icons_w) / 2 - ICON_SIZE / 2)
    icons_y = int(COVER_H * 0.62)

    for i, icon_name in enumerate(icons):
        icon_path = os.path.join(ICONS_DIR, f"{icon_name}.png")
        if os.path.exists(icon_path):
            try:
                icon_img = Image.open(icon_path).convert("RGBA")
                icon_img = icon_img.resize((ICON_SIZE, ICON_SIZE), Image.LANCZOS)
                x = icons_start_x + i * ICON_SPACING
                img.paste(icon_img, (x, icons_y), icon_img)
            except Exception as e:
                print(f"  Warning: Could not load icon '{icon_name}': {e}")
        else:
            print(f"  Warning: Icon not found: {icon_name}")

    # Save
    img.save(out_path, quality=95, optimize=True)
    print(f"✓ Cover image saved ({os.path.getsize(out_path)} bytes)")
    return out_path


# --- CLI ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate blog cover image")
    parser.add_argument("slug", help="Post slug (directory name)")
    parser.add_argument("--title", help="Override post title")
    parser.add_argument("--icons", help="Comma-separated icon names (e.g. lambda,terraform,s3)")
    parser.add_argument("--gradient", help='Gradient colors "from,to" (e.g. "#1a5276,#6c3483")')

    args = parser.parse_args()

    icons = args.icons.split(",") if args.icons else None
    gradient = None
    if args.gradient:
        parts = args.gradient.split(",")
        if len(parts) == 2:
            gradient = (parts[0].strip(), parts[1].strip())

    generate_cover(args.slug, title=args.title, icons=icons, gradient=gradient)
