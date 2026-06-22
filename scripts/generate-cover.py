#!/Users/rayhan/.hermes/hermes-agent/venv/bin/python3.11
"""
Generate blog cover images for haruns-portfolio.

Replicates the exact layout from blog-writer/src/images/cover.ts:
  - Smooth SVG gradient background (1600x840)
  - Centered title text (bold, white, word-wrapped)
  - AWS icon row (from blog-writer's icon set)
  - Footer: harun.dev on left, social icons + @HarunRRayhan on right

Then converts to JPEG using sharp from blog-writer's node_modules.

Usage:
  python3 scripts/generate-cover.py <post-slug>
  python3 scripts/generate-cover.py <post-slug> --title "Custom Title" --icons lambda,bedrock
"""
import subprocess, json, os, re, sys, tempfile, shutil, math, argparse, base64

COVER_W = 1600
COVER_H = 840
ICON_SIZE = 100
ICON_SPACING = 140
ICONS_DIR = os.path.expanduser("~/Code/blog-writer/src/images/aws-icons")
POSTS_DIR = os.path.expanduser("resources/blog/posts")
ASSETS_DIR = os.path.expanduser("public/blog-assets")
SHARP_BIN = os.path.expanduser("~/Code/blog-writer/node_modules/.bin/")

DEFAULT_GRADIENT = ("#0f172a", "#1e293b")
DEFAULT_ICONS = ["lambda", "rds", "apigateway", "codedeploy", "cloudformation"]

# Social icon SVG paths (matching blog-writer cover.ts style)
X_ICON_PATH = "M13.6,10.47 L21.15,2 L19.22,2 L12.78,9.26 L7.26,2 L2,2 L9.89,13.17 L2,22 L3.93,22 L10.72,14.38 L16.58,22 L22,22 L13.6,10.47 Z M11.6,13.3 L10.76,12.16 L4.68,3.34 L6.66,3.34 L12.36,10.1 L13.2,11.24 L19.23,20.74 L17.25,20.74 L11.6,13.3 Z"
LINKEDIN_PATH = "M0,0 h22 v22 h-22 z"
FACEBOOK_PATH = "M0,0 h22 v22 h-22 z"

def escape_xml(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def wrap_lines(text, max_chars=28):
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        if cur and len(cur) + len(w) + 1 > max_chars:
            lines.append(cur.strip())
            cur = w
        else:
            cur += (" " if cur else "") + w
    if cur:
        lines.append(cur.strip())
    return lines

def load_post_meta(post_slug):
    md_path = os.path.join(POSTS_DIR, f"{post_slug}.md")
    if not os.path.exists(md_path):
        return None
    with open(md_path) as f:
        content = f.read()
    m = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not m:
        return None
    meta = {}
    for line in m.group(1).strip().split("\n"):
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip().strip('"')
    return meta

def find_icons(post_slug):
    post = load_post_meta(post_slug)
    title = ((post or {}).get("title", "") + " " + post_slug).lower()
    kw_map = {
        "lambda":"lambda","function":"lambda","serverless":"lambda",
        "terraform":"terraform","iac":"terraform","infrastructure":"terraform",
        "s3":"s3","storage":"s3","bedrock":"bedrock","ai":"bedrock","claude":"bedrock","llm":"bedrock",
        "ecs":"ecs","fargate":"fargate","container":"ecs",
        "sqs":"sqs","queue":"sqs","event":"eventbridge",
        "cicd":"codedeploy","ci/cd":"codedeploy","deploy":"codedeploy",
        "ec2":"ec2","lightsail":"ec2",
        "api":"apigateway","gateway":"apigateway",
        "rds":"rds","database":"rds"
    }
    found = []
    for kw, icon in kw_map.items():
        if kw in title:
            ip = os.path.join(ICONS_DIR, f"{icon}.png")
            if os.path.exists(ip) and icon not in found:
                found.append(icon)
    return found[:5] or DEFAULT_ICONS

def build_cover_svg(title, gradient, icons):
    """Build full cover SVG matching blog-writer's layout."""
    f, t = gradient
    lines = wrap_lines(title, 28)
    fs = 58
    if len(lines) >= 4: fs = 44
    elif len(lines) >= 3: fs = 50
    lh = 72
    block_h = len(lines) * lh
    start_y = int(COVER_H * 0.38 - block_h / 2 + fs * 0.35)

    # Title lines
    tspans = "\n".join(
        f'<tspan x="{COVER_W//2}" dy="{0 if i==0 else lh}">{escape_xml(l)}</tspan>'
        for i, l in enumerate(lines)
    )
    title_svg = f'''<text x="{COVER_W//2}" y="{start_y}" text-anchor="middle"
        font-family="Arial,Helvetica,sans-serif" font-size="{fs}" font-weight="bold" fill="white">
        {tspans}</text>'''

    # Icons row
    icon_svgs = ""
    icon_count = len(icons)
    total_w = (icon_count - 1) * ICON_SPACING
    start_x = (COVER_W - total_w) // 2 - ICON_SIZE // 2
    icons_y = int(COVER_H * 0.62)

    for i, icon_name in enumerate(icons):
        ip = os.path.join(ICONS_DIR, f"{icon_name}.png")
        if os.path.exists(ip):
            import base64
            with open(ip, "rb") as fh:
                b64 = base64.b64encode(fh.read()).decode()
            x = start_x + i * ICON_SPACING
            icon_svgs += f'''<image x="{x}" y="{icons_y}" width="{ICON_SIZE}" height="{ICON_SIZE}"
                href="data:image/png;base64,{b64}" />\n'''

    # Footer — compact group on the right side
    # Layout (left to right):
    #   [🌐] [harun.dev]  ··  [X] [in] [f]  ··  @HarunRRayhan
    # All right-aligned at right_edge, all icons and text in close proximity
    pad = int(COVER_W * 0.15)  # 240px on 1600px
    base_y = COVER_H - 55
    icon_s = 20          # icon square size
    icon_gap = 8         # gap between adjacent icons
    section_gap = 20     # gap between (globe+text) and (social icons) and (handle)
    fs_footer = 20
    fill = "rgba(255,255,255,0.9)"
    # Vertical center for icons relative to text baseline
    icon_top_y = base_y - 18  # centers ~20px icon with 20px text

    right_edge = COVER_W - pad
    handle_text_str = "@HarunRRayhan"

    # Build from right to left, anchoring at right_edge:
    # Layout: [🌐] 8px [harun.dev] 20px [X] 8px [LinkedIn] 8px [Facebook] 20px [@HarunRRayhan]

    # 1. Handle text (right-aligned)
    handle_x = right_edge

    # Approximate text widths at 20px bold Arial (~10-11px per char)
    est_handle_w = len(handle_text_str) * 11
    est_url_w = len("harun.dev") * 11

    # 2. Social icons (right to left: Facebook, LinkedIn, X)
    fb_x = right_edge - est_handle_w - section_gap - icon_s          # Facebook left edge
    li_x = fb_x - icon_gap - icon_s                                   # LinkedIn left edge
    x_x = li_x - icon_gap - icon_s                                    # X left edge

    # 3. URL group: [🌐] harun.dev (left-anchored) to the left of social icons
    #    globe at [globe_x], 8px gap, then harun.dev text starts at [url_text_x]
    url_text_x = x_x - section_gap - est_url_w                        # harun.dev left edge (left-aligned)
    globe_x = url_text_x - icon_gap - icon_s                          # globe left edge

    # Scale factor for X icon path (designed at 24x24)
    s = icon_s / 24
    x_logo = f'''<g transform="translate({x_x}, {icon_top_y})">
        <path d="M{13.6*s},{10.47*s} L{21.15*s},{2*s} L{19.22*s},{2*s} L{12.78*s},{9.26*s} L{7.26*s},{2*s} L{2*s},{2*s} L{9.89*s},{13.17*s} L{2*s},{22*s} L{3.93*s},{22*s} L{10.72*s},{14.38*s} L{16.58*s},{22*s} L{22*s},{22*s} L{13.6*s},{10.47*s} Z M{11.6*s},{13.3*s} L{10.76*s},{12.16*s} L{4.68*s},{3.34*s} L{6.66*s},{3.34*s} L{12.36*s},{10.1*s} L{13.2*s},{11.24*s} L{19.23*s},{20.74*s} L{17.25*s},{20.74*s} L{11.6*s},{13.3*s} Z" fill="{fill}"/></g>'''

    linkedin = f'''<g transform="translate({li_x}, {icon_top_y})">
        <rect x="0" y="0" width="{icon_s}" height="{icon_s}" rx="3" fill="#0A66C2"/>
        <text x="{icon_s//2}" y="{icon_s - 4}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="white">in</text></g>'''

    facebook = f'''<g transform="translate({fb_x}, {icon_top_y})">
        <rect x="0" y="0" width="{icon_s}" height="{icon_s}" rx="3" fill="#1877F2"/>
        <text x="{icon_s//2}" y="{icon_s - 4}" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="white">f</text></g>'''

    handle_text = f'''<text x="{handle_x}" y="{base_y}" text-anchor="end"
        font-family="Arial,Helvetica,sans-serif" font-size="{fs_footer}" fill="{fill}" font-weight="bold">{handle_text_str}</text>'''

    globe = f'''<g transform="translate({globe_x}, {icon_top_y})">
        <circle cx="10" cy="10" r="9" stroke="{fill}" stroke-width="1.6" fill="none"/>
        <ellipse cx="10" cy="10" rx="4.5" ry="9" stroke="{fill}" stroke-width="1.3" fill="none"/>
        <line x1="1" y1="10" x2="19" y2="10" stroke="{fill}" stroke-width="1.3"/></g>'''

    url_text = f'''<text x="{url_text_x}" y="{base_y}" font-family="Arial,Helvetica,sans-serif"
        font-size="{fs_footer}" fill="{fill}" font-weight="bold" >harun.dev</text>'''

    svg = f'''<svg width="{COVER_W}" height="{COVER_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="{f}"/>
            <stop offset="100%" stop-color="{t}"/>
        </linearGradient>
    </defs>
    <rect width="{COVER_W}" height="{COVER_H}" fill="url(#bg)"/>
    {title_svg}
    {icon_svgs}
    {globe}
    {url_text}
    {x_logo}
    {linkedin}
    {facebook}
    {handle_text}
    </svg>'''
    return svg

def generate_cover(post_slug, title=None, icons=None, gradient=None):
    # Resolve paths
    global POSTS_DIR, ASSETS_DIR
    for alt_p, alt_a in [(os.path.join(os.getcwd(), p) for p in ("resources/blog/posts", "public/blog-assets"))]:
        pass
    alt_posts = os.path.join(os.getcwd(), "resources/blog/posts")
    alt_assets = os.path.join(os.getcwd(), "public/blog-assets")
    if not os.path.exists(POSTS_DIR) and os.path.exists(alt_posts):
        POSTS_DIR = alt_posts
        ASSETS_DIR = alt_assets

    # Resolve title
    if not title:
        post = load_post_meta(post_slug)
        title = (post or {}).get("title", post_slug.replace("-", " ").title())

    # Resolve icons
    if icons is None:
        icons = find_icons(post_slug)

    # Resolve gradient
    if gradient is None:
        if any(x in post_slug for x in ("bedrock","migrat","ai")):
            gradient = ("#1a3a5c", "#6c3483")
        elif any(x in post_slug for x in ("review","code")):
            gradient = ("#1a2a4c", "#4338ca")
        elif any(x in post_slug for x in ("cicd","actions","deploy")):
            gradient = ("#0f3b6c", "#3b82f6")
        else:
            gradient = DEFAULT_GRADIENT

    out_dir = os.path.join(ASSETS_DIR, post_slug)
    os.makedirs(out_dir, exist_ok=True)
    svg_path = os.path.join(out_dir, "cover.svg")
    out_path = os.path.join(out_dir, "cover.jpg")

    print(f"Generating cover for: {title}")
    print(f"  Gradient: {gradient[0]} -> {gradient[1]}")
    print(f"  Icons: {', '.join(icons)}")
    print(f"  Output: {out_path}")

    # Build SVG
    svg = build_cover_svg(title, gradient, icons)
    with open(svg_path, "w") as f:
        f.write(svg)

    # Convert SVG to JPEG using sharp from blog-writer
    node_script = f'''
const sharp = require("sharp");
const svg = require("fs").readFileSync("{svg_path}", "utf8");
sharp(Buffer.from(svg)).resize({COVER_W}, {COVER_H}).jpeg({{ quality: 95 }}).toFile("{out_path}")
  .then(() => console.log("OK"))
  .catch(e => {{ console.error(e.message); process.exit(1); }});
'''
    # Try to use sharp from blog-writer's node_modules
    env = os.environ.copy()
    env["NODE_PATH"] = os.path.expanduser("~/Code/blog-writer/node_modules")

    result = subprocess.run(
        ["node", "-e", node_script],
        capture_output=True, text=True, timeout=60, env=env
    )

    if result.returncode != 0:
        print(f"  WARNING: sharp conversion failed: {result.stderr.strip()}")
        print("  Using SVG directly instead")
        os.rename(svg_path, out_path.replace(".jpg", ".svg"))
        return out_path.replace(".jpg", ".svg")
    else:
        os.remove(svg_path)
        size = os.path.getsize(out_path)
        print(f"  OK ({size} bytes)")
        return out_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate blog cover image")
    parser.add_argument("slug", help="Post slug")
    parser.add_argument("--title", help="Override title")
    parser.add_argument("--icons", help="Comma-separated icon names")
    parser.add_argument("--gradient", help='Gradient "from,to"')
    args = parser.parse_args()

    icons = args.icons.split(",") if args.icons else None
    gradient = None
    if args.gradient:
        parts = args.gradient.split(",")
        if len(parts) == 2:
            gradient = (parts[0].strip(), parts[1].strip())

    generate_cover(args.slug, args.title, icons, gradient)
