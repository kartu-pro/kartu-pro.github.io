import os
import math
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

SITE_URL = "https://kartu-pro.github.io"
CHUNK_SIZE = 5000  # Max URLs per sub-sitemap file

def collect_urls():
    urls = []
    for root, dirs, files in os.walk('.'):
        # Ignore hidden directories like .git
        if '/.' in root or root.startswith('./.'):
            continue

        for file in files:
            if file.startswith('google') or not file.endswith('.html'):
                continue

            full_path = os.path.join(root, file)
            clean_path = os.path.normpath(full_path)

            if clean_path == 'index.html':
                url_path = ''
            elif clean_path.endswith('index.html'):
                url_path = clean_path[:-10]
            else:
                url_path = clean_path[:-5]

            if url_path and not url_path.startswith('/'):
                url_path = '/' + url_path

            full_url = f'{SITE_URL}{url_path}'

            if not full_url.endswith('/') and '.' not in os.path.basename(full_url):
                full_url += '/'

            if full_url == SITE_URL:
                full_url = SITE_URL + '/'

            mtime = os.path.getmtime(full_path)
            lastmod = datetime.fromtimestamp(mtime, tz=timezone.utc).strftime('%Y-%m-%d')

            urls.append((full_url, lastmod))

    return sorted(set(urls))

def write_sub_sitemap(filename, url_chunk):
    urlset = ET.Element('urlset', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')

    for url, lastmod in url_chunk:
        priority = '1.0' if url == SITE_URL + '/' else '0.8'
        url_elem = ET.SubElement(urlset, 'url')
        ET.SubElement(url_elem, 'loc').text = url
        ET.SubElement(url_elem, 'lastmod').text = lastmod
        ET.SubElement(url_elem, 'changefreq').text = 'weekly'
        ET.SubElement(url_elem, 'priority').text = priority

    tree = ET.ElementTree(urlset)
    if hasattr(ET, 'indent'):
        ET.indent(tree, space='  ')

    with open(filename, 'wb') as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        tree.write(f, encoding='utf-8', xml_declaration=False)

def write_sitemap_index(sub_sitemap_files):
    sitemapindex = ET.Element('sitemapindex', xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')

    now = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    for filename in sub_sitemap_files:
        sitemap_elem = ET.SubElement(sitemapindex, 'sitemap')
        ET.SubElement(sitemap_elem, 'loc').text = f'{SITE_URL}/{filename}'
        ET.SubElement(sitemap_elem, 'lastmod').text = now

    tree = ET.ElementTree(sitemapindex)
    if hasattr(ET, 'indent'):
        ET.indent(tree, space='  ')

    with open('sitemap.xml', 'wb') as f:
        f.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        tree.write(f, encoding='utf-8', xml_declaration=False)

def main():
    urls = collect_urls()
    print(f"Collected {len(urls)} unique URLs.")

    if not urls:
        print("No HTML files found.")
        return

    num_chunks = math.ceil(len(urls) / CHUNK_SIZE)
    sub_files = []

    for i in range(num_chunks):
        chunk = urls[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
        sub_filename = f'sitemap-{i + 1}.xml'
        write_sub_sitemap(sub_filename, chunk)
        sub_files.append(sub_filename)
        print(f"Generated {sub_filename} ({len(chunk)} URLs)")

    write_sitemap_index(sub_files)
    print(f"Generated sitemap.xml indexing {len(sub_files)} sub-sitemaps.")

if __name__ == '__main__':
    main()