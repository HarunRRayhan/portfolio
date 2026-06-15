#!/usr/bin/env python3
"""
Generate cover images for blog posts.

Usage:
    python scripts/generate-cover.py \
        --title "Lambda SnapStart with Terraform - Cutting Cold Starts" \
        --subtitle "How to enable SnapStart, measure cold start improvements, and compare costs" \
        --slug lambda-snapstart-terraform-cold-starts \
        --accent "#00BCD4" \
        --output public/blog-assets

Requirements: Pillow (pip install Pillow)
"""

import argparse
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# ── Constants ──────────────────────────────────────────────────────────────
WIDTH = 1600
HEIGHT = 840
BG_TOP = (18, 18, 22)       # Very dark near-black
BG_BOTTOM = (28, 30, 38)    # Slightly lighter dark
HANDLE = "harun.dev"
HANDLE_COLOR = (160, 165, 180)

# ── Font discovery ─────────────────────────────────────────────────────────

def find_font(weight="Bold", size=60):
    """Find a suitable font on the system. Prefer Inter, fallback broadly."""
    candidates = [
        f"/System/Library/Fonts/Supplemental/Arial {weight}.ttf",
        f"/System/Library/Fonts/Supplemental/Arial{weight}.ttf",
        f"/System/Library/Fonts/Supplemental/Helvetica {weight}.ttf",
        f"/System/Library/Fonts/Supplemental/Helvetica{weight}.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_centered_text(draw, text, font, y, max_width, fill=(255, 255, 255)):
    """Draw text centered horizontally at y, wrapping long lines if needed."""
    lines = []
    words = text.split()
    current = ""
    for word in words:
        test = current + " " + word if current else word
        bbox = draw.textbbox((0, 0), test, font=font)
        tw = bbox[2] - bbox[0]
        if tw > max_width and current:
            lines.append(current)
            current = word
        else:
            current = test
    if current:
        lines.append(current)

    # Use more lines if needed
    if len(lines) <= 2:
        # Draw as is
        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            tw = bbox[2] - bbox[0]
            x = (WIDTH - tw) // 2
            draw.text((x, y + i * (font.size + 10)), line, font=font, fill=fill)
        return len(lines)

    # If more than 2 lines, we need to dynamically reduce font or split better
    # Just draw all lines
    line_height = font.size + 8
    total_h = len(lines) * line_height
    start_y = y - total_h // 2
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (WIDTH - tw) // 2
        draw.text((x, start_y + i * line_height), line, font=font, fill=fill)
    return len(lines)


# ── Cover generation ───────────────────────────────────────────────────────

def generate_cover(title, subtitle, accent_color, output_path=None):
    """Generate and return/save a cover image."""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_TOP)
    draw = ImageDraw.Draw(img)

    # ── Background gradient ──
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * ratio)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * ratio)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * ratio)
        for x in range(WIDTH):
            # Slight horizontal gradient too (darker at edges)
            h_ratio = abs(x - WIDTH // 2) / (WIDTH // 2)
            h_factor = 1 - 0.05 * h_ratio
            draw.point((x, y), fill=(
                int(r * h_factor),
                int(g * h_factor),
                int(b * h_factor),
            ))

    # ── Decorative left accent bar ──
    # A thin accent color bar on the left
    bar_width = 6
    accent_rgb = _hex_to_rgb(accent_color)
    for y in range(0, HEIGHT):
        # Fade the bar
        ratio = abs(y - HEIGHT // 2) / (HEIGHT // 2)
        alpha = 1.0 - 0.4 * ratio
        draw.line(
            [(0, y), (bar_width - 1, y)],
            fill=(
                int(accent_rgb[0] * alpha),
                int(accent_rgb[1] * alpha),
                int(accent_rgb[2] * alpha),
            ),
        )

    # ── Subtle decorative dots pattern (geometric) ──
    dot_color = (50, 55, 68)
    for gx in range(50, WIDTH, 80):
        for gy in range(60, HEIGHT, 80):
            # Vary opacity
            dx = abs(gx - WIDTH // 2) / (WIDTH // 2)
            dy = abs(gy - HEIGHT // 2) / (HEIGHT // 2)
            alpha = max(0.2, 1.0 - (dx + dy) * 0.5)
            dot_color_adj = tuple(int(c * alpha) for c in dot_color)
            draw.point((gx, gy), fill=dot_color_adj)
            draw.point((gx + 1, gy), fill=dot_color_adj)
            draw.point((gx, gy + 1), fill=dot_color_adj)
            draw.point((gx + 1, gy + 1), fill=dot_color_adj)

    # ── Accent glow circle (very subtle, bottom-right) ──
    glow_center = (WIDTH - 200, HEIGHT - 200)
    glow_radius = 350
    for r in range(glow_radius, 0, -2):
        alpha = 0.02 * (1 - r / glow_radius)
        if alpha <= 0:
            continue
        draw_alpha_circle(draw, glow_center, r, accent_rgb, alpha)

    # ── Horizontal accent line ──
    line_y = 780
    line_color = tuple(int(c * 0.3) for c in accent_rgb)
    for x in range(80, WIDTH - 80, 2):
        # Fade the ends
        dist_from_edge = min(x - 80, WIDTH - 80 - x)
        if dist_from_edge < 100:
            fade = dist_from_edge / 100
        else:
            fade = 1.0
        c = tuple(int(v * fade) for v in line_color)
        draw.point((x, line_y), fill=c)

    # ── Title ──
    title_font_size = 56
    title_font = find_font("Bold", title_font_size)

    # Calculate title area - we need to handle long titles
    title_lines = []
    words = title.split()
    current = ""
    for word in words:
        test = current + " " + word if current else word
        bbox = draw.textbbox((0, 0), test, font=title_font)
        tw = bbox[2] - bbox[0]
        if tw > WIDTH - 160 and current:  # 80px padding each side
            title_lines.append(current)
            current = word
        else:
            current = test
    if current:
        title_lines.append(current)

    # If still too many lines, reduce font size
    while len(title_lines) > 3 and title_font_size > 30:
        title_font_size -= 4
        title_font = find_font("Bold", title_font_size)
        title_lines = []
        current = ""
        for word in words:
            test = current + " " + word if current else word
            bbox = draw.textbbox((0, 0), test, font=title_font)
            tw = bbox[2] - bbox[0]
            if tw > WIDTH - 160 and current:
                title_lines.append(current)
                current = word
            else:
                current = test
        if current:
            title_lines.append(current)

    # Draw title lines
    title_y_start = 240
    line_height = title_font_size + 12
    total_title_h = len(title_lines) * line_height
    title_y = title_y_start

    for line in title_lines:
        bbox = draw.textbbox((0, 0), line, font=title_font)
        tw = bbox[2] - bbox[0]
        x = (WIDTH - tw) // 2
        # Draw with slight shadow for readability
        draw.text((x + 2, title_y + 2), line, font=title_font, fill=(0, 0, 0, 80))
        draw.text((x, title_y), line, font=title_font, fill=(240, 242, 248))
        title_y += line_height

    # ── Subtitle ──
    if subtitle:
        sub_font_size = 24
        sub_font = find_font("Regular", sub_font_size)
        sub_color = (160, 165, 180)

        # Wrap subtitle
        sub_lines = []
        words = subtitle.split()
        current = ""
        for word in words:
            test = current + " " + word if current else word
            bbox = draw.textbbox((0, 0), test, font=sub_font)
            tw = bbox[2] - bbox[0]
            if tw > WIDTH - 200 and current:
                sub_lines.append(current)
                current = word
            else:
                current = test
        if current:
            sub_lines.append(current)

        sub_y = title_y + 30
        for line in sub_lines:
            bbox = draw.textbbox((0, 0), line, font=sub_font)
            tw = bbox[2] - bbox[0]
            x = (WIDTH - tw) // 2
            draw.text((x, sub_y), line, font=sub_font, fill=sub_color)
            sub_y += sub_font_size + 8

    # ── Handle / branding ──
    handle_font = find_font("Regular", 18)
    bbox = draw.textbbox((0, 0), HANDLE, font=handle_font)
    tw = bbox[2] - bbox[0]
    handle_x = WIDTH - 80 - tw
    draw.text((handle_x, HEIGHT - 50), HANDLE, font=handle_font, fill=HANDLE_COLOR)

    # ── Optional: small label above handle ──
    label = "BLOG POST"
    label_font = find_font("Regular", 11)
    bbox = draw.textbbox((0, 0), label, font=label_font)
    tw = bbox[2] - bbox[0]
    label_x = WIDTH - 80 - tw
    draw.text((label_x, HEIGHT - 72), label, font=label_font, fill=(100, 105, 120))

    # ── Date line (optional, always show) ──
    from datetime import date
    today = date.today().strftime("%B %d, %Y")
    date_font = find_font("Regular", 13)
    draw.text((80, HEIGHT - 50), today, font=date_font, fill=(100, 105, 120))

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img.save(output_path, "JPEG", quality=92)
        print(f"Cover saved: {output_path}")
    return img


def _hex_to_rgb(hex_color):
    """Convert hex color string to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))


def draw_alpha_circle(draw, center, radius, color, alpha):
    """Draw a translucent circle."""
    x, y = center
    r, g, b = color
    for dx in range(-radius, radius + 1, 2):
        for dy in range(-radius, radius + 1, 2):
            if dx * dx + dy * dy <= radius * radius:
                px, py = x + dx, y + dy
                if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                    try:
                        existing = draw.im.getpixel((px, py))
                    except Exception:
                        existing = (0, 0, 0)
                    nr = int(existing[0] * (1 - alpha) + r * alpha)
                    ng = int(existing[1] * (1 - alpha) + g * alpha)
                    nb = int(existing[2] * (1 - alpha) + b * alpha)
                    draw.point((px, py), fill=(nr, ng, nb))


# ── CLI Entry Point ────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate blog post cover image")
    parser.add_argument("--title", "-t", required=True, help="Post title")
    parser.add_argument("--subtitle", "-s", default="", help="Post subtitle/description")
    parser.add_argument("--slug", "-S", required=True, help="Post slug (directory name)")
    parser.add_argument("--accent", "-a", default="#00BCD4", help="Accent color hex (default: #00BCD4 teal)")
    parser.add_argument("--output", "-o", default="public/blog-assets",
                        help="Output base directory (default: public/blog-assets)")

    args = parser.parse_args()

    output_path = os.path.join(args.output, args.slug, "cover.jpg")
    generate_cover(args.title, args.subtitle, args.accent, output_path)


if __name__ == "__main__":
    main()
