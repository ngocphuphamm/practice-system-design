import os
import re
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

url = 'https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter'
out_dir = '/mnt/wsl.localhost/Ubuntu/home/binpham/coding/system-design/rate-limiter'
images_dir = os.path.join(out_dir, 'images')
os.makedirs(images_dir, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
}

resp = requests.get(url, headers=headers, timeout=30)
resp.raise_for_status()
html = resp.text
soup = BeautifulSoup(html, 'html.parser')

# Title
page_title = soup.title.get_text(' ', strip=True) if soup.title else 'Rate Limiter'

# Extract text from main article-like content, falling back to body
content_root = None
for selector in ['main', 'article', '[data-testid="article"]', 'div[class*="content"]']:
    content_root = soup.select_one(selector)
    if content_root:
        break
if content_root is None:
    content_root = soup.body or soup

# Gather headings and associated paragraphs
headings = content_root.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

# Build a markdown document preserving heading hierarchy and paragraph text
md_lines = []
md_lines.append(f'# {page_title}')
md_lines.append('')
md_lines.append('This document is a markdown export of the Hello Interview article on distributed rate limiting.')
md_lines.append('')

# Add intro summary from first few paragraphs before the first heading
intro_parts = []
for node in content_root.find_all(['p', 'li']):
    if node.name == 'p':
        text = re.sub(r'\s+', ' ', node.get_text(' ', strip=True))
        if text and len(text) > 20:
            intro_parts.append(text)
            if len(intro_parts) >= 6:
                break
if intro_parts:
    md_lines.append('## Overview')
    md_lines.append('')
    for para in intro_parts:
        md_lines.append(para)
        md_lines.append('')

# Download images and include them in markdown
image_markdown = []
img_tags = content_root.find_all('img')
seen = set()
for idx, img in enumerate(img_tags[:12], 1):
    src = img.get('src') or img.get('data-src')
    if not src or src in seen:
        continue
    seen.add(src)
    full_url = urljoin(url, src)
    try:
        img_resp = requests.get(full_url, headers=headers, timeout=20)
        img_resp.raise_for_status()
        ext = os.path.splitext(urlparse(full_url).path)[1] or '.png'
        if ext not in ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']:
            ext = '.png'
        filename = f'image_{idx}{ext}'
        path = os.path.join(images_dir, filename)
        with open(path, 'wb') as fh:
            fh.write(img_resp.content)
        alt = img.get('alt', '') or f'Image {idx}'
        image_markdown.append(f'![{alt}]({os.path.join("images", filename)})')
    except Exception as exc:
        image_markdown.append(f'![Image {idx}]({full_url})')

if image_markdown:
    md_lines.append('## Images')
    md_lines.append('')
    md_lines.extend(image_markdown)
    md_lines.append('')

# Extract sections based on headings
for heading in headings:
    level = int(heading.name[1])
    title = re.sub(r'\s+', ' ', heading.get_text(' ', strip=True))
    if not title:
        continue
    md_lines.append(f'{"#" * level} {title}')
    md_lines.append('')
    content = []
    for sibling in heading.next_siblings:
        if getattr(sibling, 'name', None) in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            break
        if getattr(sibling, 'name', None) in ['p', 'li', 'pre', 'code']:
            text = re.sub(r'\s+', ' ', sibling.get_text(' ', strip=True))
            if text:
                content.append(text)
        elif hasattr(sibling, 'get_text'):
            text = re.sub(r'\s+', ' ', sibling.get_text(' ', strip=True))
            if text:
                content.append(text)
    if content:
        for item in content[:20]:
            md_lines.append(item)
            md_lines.append('')

# Clean up excessive repetition and preserve code blocks more directly
text = '\n'.join(md_lines)
text = re.sub(r'(\n){3,}', '\n\n', text)
text = text.replace('```', '\n```')

out_path = os.path.join(out_dir, 'distributed-rate-limiter.md')
with open(out_path, 'w', encoding='utf-8') as fh:
    fh.write(text)

print(f'Wrote {out_path}')
print(f'Images saved to {images_dir}')
