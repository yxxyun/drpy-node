"""
Legado → drpy-node 书源转换脚本 v3.1
"""
import json, sys, re, os
sys.stdout.reconfigure(encoding='utf-8')

SPIDER_DIR = r'C:\data\code\drpy-node\spider\js'
LEGADO_JSON = r'C:\Users\yxx\.qwenpaw\workspaces\default\media\c53945eb5020.json'

def legado_to_drpy_selector(legado_sel):
    """Convert Legado CSS selector to drpy format."""
    if not legado_sel or not isinstance(legado_sel, str):
        return None
    if '@js:' in legado_sel or '<js>' in legado_sel:
        return None
    if '@' in legado_sel:
        parts = legado_sel.rsplit('@', 1)
        selector = parts[0]
        attr = parts[1] if len(parts) > 1 else 'text'
    else:
        selector = legado_sel
        attr = 'text'
    
    # Fix index notation
    def fix_index(m):
        tag = m.group(1)
        indices = m.group(2)
        parts = indices.split(':')
        result_parts = []
        for p in parts:
            p = p.strip()
            if p == '-1' or p == 'last':
                result_parts.append(f'{tag}:last')
            elif p == '0':
                result_parts.append(tag)
            elif p.isdigit():
                result_parts.append(f'{tag}:eq({p})')
            elif p.startswith('-') and p[1:].isdigit():
                result_parts.append(f'{tag}:eq({p})')
            else:
                result_parts.append(tag)
        return ', '.join(result_parts)
    
    selector = re.sub(r'(\w[\w-]*)(\.\-?\d+(?::\-?\d+)*)', fix_index, selector)
    
    attr_map = {
        'text': 'Text', 'href': 'href', 'src': 'src', 'html': 'Html',
        'content': 'content', 'alt': 'alt', 'title': 'title',
        'data-src': '_src', '_src': '_src',
    }
    drpy_attr = attr_map.get(attr, attr)
    return f'{selector}&&{drpy_attr}'


def legado_list_to_drpy(legado_sel):
    if not legado_sel or not isinstance(legado_sel, str):
        return None
    if '@' in legado_sel:
        return legado_sel.rsplit('@', 1)[0]
    return legado_sel


def clean_source_name(name):
    """Remove emoji/special chars, keep clean name."""
    name = re.sub(r'[^\w\u4e00-\u9fff\u3400-\u4dbf\s\[\]]+', '', name)
    name = name.strip()
    if not name or len(name) < 2:
        return None
    return name


def make_spider_source(item):
    url = item.get('bookSourceUrl', '').rstrip('/')
    name = item.get('bookSourceName', '')
    rule_explore = item.get('ruleExplore', {})
    rule_search = item.get('ruleSearch', {})
    rule_content = item.get('ruleContent', {})
    explore_url = item.get('exploreUrl', '')
    search_url = item.get('searchUrl', '')
    
    clean_name = clean_source_name(name)
    if not clean_name:
        return None
    
    # Parse explore URL list
    class_names = []
    class_urls = []
    if explore_url and isinstance(explore_url, str):
        try:
            explore_json = json.loads(explore_url)
            if isinstance(explore_json, list):
                for cat in explore_json:
                    title = cat.get('title', '')
                    cu = cat.get('url', '')
                    cu = cu.replace('{{page}}', 'fypage').replace('{{pg}}', 'fypage')
                    if title and cu:
                        class_names.append(title)
                        class_urls.append(cu)
        except:
            pass
    
    # Remove dupes preserving order
    seen = set()
    unique_names, unique_urls = [], []
    for cn, cu in zip(class_names, class_urls):
        if cu not in seen:
            seen.add(cu)
            unique_names.append(cn)
            unique_urls.append(cu)
    class_names = unique_names
    class_urls = unique_urls
    
    # Extract class IDs from URLs
    # e.g. /sort/0/fypage/ → 0, /sort/1/fypage/ → 1
    class_ids = []
    for cu in class_urls:
        # Extract the ID part from /sort/ID/fypage/
        m = re.search(r'/sort/([^/]+)', cu)
        if m:
            class_ids.append(m.group(1))
        else:
            class_ids.append(cu)
    
    # Determine URL pattern
    if class_urls:
        first_url = class_urls[0]
        url_pattern = first_url.replace('fypage', 'fypage').replace(class_ids[0] if class_ids else '', 'fyclass')
    else:
        url_pattern = '/fyclass/fypage/'
    
    # Build JS
    lines = []
    lines.append(f'// 源: {name}')
    lines.append(f'// URL: {url}')
    lines.append('/*')
    lines.append('@header({')
    lines.append('  searchable: 1,')
    lines.append('  filterable: 0,')
    lines.append('  quickSearch: 1,')
    lines.append(f"  title: '{clean_name}[书]',")
    lines.append("  author: 'Legado',")
    lines.append("  '类型': '小说',")
    lines.append("  lang: 'ds'")
    lines.append('})')
    lines.append('*/')
    lines.append('')
    lines.append('var rule = {')
    lines.append(f"  title: '{clean_name}[书]',")
    lines.append(f"  host: '{url}',")
    lines.append(f"  url: '{url_pattern}',")
    
    # Search URL
    if search_url and isinstance(search_url, str):
        clean_search = search_url.split(',{')[0].strip().strip('"\'')
        clean_search = clean_search.replace('{{key}}', '**').replace('{key}', '**').replace('${key}', '**')
        lines.append(f"  searchUrl: '{clean_search}',")
    else:
        lines.append("  searchUrl: '',")
    
    lines.append('  searchable: 1,')
    lines.append('  quickSearch: 1,')
    lines.append('  filterable: 0,')
    lines.append('  timeout: 10000,')
    lines.append('  play_parse: true,')
    lines.append("  headers: { 'User-Agent': 'MOBILE_UA' },")
    
    if class_names:
        lines.append(f"  class_name: '{'&'.join(class_names)}',")
    if class_ids:
        lines.append(f"  class_url: '{'&'.join(class_ids)}',")
    
    lines.append('')
    
    # ---- 一级 ----
    book_list = rule_explore.get('bookList', '')
    drpy_list_sel = legado_list_to_drpy(book_list)
    
    lines.append('  一级: async function() {')
    lines.append('    let [cateUrl, pg] = this.input.split("##");')
    lines.append('    let fullUrl = cateUrl.startsWith("http") ? cateUrl : this.host + cateUrl;')
    lines.append('    let html = await request(fullUrl);')
    lines.append('    let d = [];')
    lines.append('    // Try Legado selector first, then common fallbacks')
    if drpy_list_sel:
        lines.append(f"    let items = this.pdfa(html, '{drpy_list_sel}')")
    else:
        lines.append("    let items = this.pdfa(html, 'li')")
    lines.append("      || this.pdfa(html, '.book_list_img li')")
    lines.append("      || this.pdfa(html, '.list-item')")
    lines.append("      || this.pdfa(html, '.book-item')")
    lines.append("      || this.pdfa(html, '.search-list li')")
    lines.append("      || this.pdfa(html, '.ptm-list-view-cell')")
    lines.append("      || this.pdfa(html, 'li');")
    lines.append('    items.forEach(item => {')
    lines.append("      let name = this.pdfh(item, 'a&&Text') || this.pdfh(item, '.book_img_name a&&Text') || this.pdfh(item, '.name a&&Text') || '';")
    lines.append("      let href = this.pd(item, 'a&&href') || this.pd(item, '.book_img_pic a&&href') || this.pd(item, '.book_img_name a&&href') || '';")
    lines.append('      if (name && href && href.match(/\\/(book|read|info|novel|txt|article)\\/?\\d*/)) {')
    lines.append('        d.push({')
    lines.append('          title: name.trim(),')
    lines.append("          url: href.startsWith('http') ? href : this.host + href,")
    lines.append("          pic_url: this.pd(item, 'img&&src') || this.pd(item, 'img&&_src') || ''")
    lines.append('        });')
    lines.append('      }')
    lines.append('    });')
    lines.append('    return setResult(d);')
    lines.append('  },')
    lines.append('')
    
    # ---- 二级 ----
    lines.append('  二级: async function() {')
    lines.append('    let html = await request(this.input);')
    lines.append('    let VOD = {')
    lines.append("      vod_name: this.pdfh(html, '[property=\"og:novel:book_name\"]&&content') || this.pdfh(html, '[property=\"og:title\"]&&content') || '',")
    lines.append("      vod_pic: this.pdfh(html, '[property=\"og:image\"]&&content') || '',")
    lines.append("      vod_content: this.pdfh(html, '[property=\"og:description\"]&&content') || '',")
    lines.append("      vod_author: this.pdfh(html, '[property=\"og:novel:author\"]&&content') || this.pdfh(html, '[property=\"og:author\"]&&content') || ''")
    lines.append('    };')
    lines.append("    let chapters = this.pdfa(html, '#chapterlist li a') || this.pdfa(html, '.chapter-list li a') || this.pdfa(html, '#list a') || this.pdfa(html, '#chapters a') || this.pdfa(html, '#readercontainer a') || [];")
    lines.append('    if (chapters.length === 0) {')
    lines.append("      let tocUrl = this.pd(html, 'a[href*=index]&&href') || this.pd(html, 'a[href*=chapter]&&href') || '';")
    lines.append('      if (tocUrl) {')
    lines.append('        let tocHtml = await request(tocUrl.startsWith("http") ? tocUrl : this.host + tocUrl);')
    lines.append("        chapters = this.pdfa(tocHtml, '#chapterlist li a') || this.pdfa(tocHtml, '.chapter-list li a') || [];")
    lines.append('      }')
    lines.append('    }')
    lines.append(f"    VOD.vod_play_from = '{clean_name}';")
    lines.append("    VOD.vod_play_url = chapters.map(c => {")
    lines.append("      let title = this.pdfh(c, '&&Text');")
    lines.append("      let url = this.pd(c, '&&href');")
    lines.append('      if (title && url) {')
    lines.append("        if (!url.startsWith('http')) url = this.host + url;")
    lines.append("        return title.trim() + '$' + url;")
    lines.append('      }')
    lines.append('      return null;')
    lines.append("    }).filter(Boolean).join('#');")
    lines.append('    return VOD;')
    lines.append('  },')
    lines.append('')
    
    # ---- 搜索 ----
    search_book_list = rule_search.get('bookList', '')
    drpy_search_list = legado_list_to_drpy(search_book_list) or drpy_list_sel
    
    lines.append('  搜索: async function() {')
    lines.append('    let html = await request(this.input);')
    lines.append('    let d = [];')
    if drpy_search_list:
        lines.append(f'    let items = this.pdfa(html, \'{drpy_search_list}\');')
    else:
        lines.append("    let items = this.pdfa(html, 'li');")
    lines.append('    items.forEach(item => {')
    lines.append("      let name = this.pdfh(item, 'a&&Text') || '';")
    lines.append("      let href = this.pd(item, 'a&&href') || '';")
    lines.append('      if (name && href) {')
    lines.append('        d.push({')
    lines.append('          title: name.trim(),')
    lines.append("          url: href.startsWith('http') ? href : this.host + href,")
    lines.append("          pic_url: this.pd(item, 'img&&src') || ''")
    lines.append('        });')
    lines.append('      }')
    lines.append('    });')
    lines.append('    return setResult(d);')
    lines.append('  },')
    lines.append('')
    
    # ---- lazy ----
    content_sel = rule_content.get('content', '')
    if content_sel and isinstance(content_sel, str) and '@' in content_sel:
        parts = content_sel.rsplit('@', 1)
        drpy_content = f'{parts[0]}&&Html' if parts[1].lower() in ('html', 'Html') else f'{parts[0]}&&Text'
    else:
        drpy_content = '#content&&Html'
    
    lines.append('  lazy: async function() {')
    lines.append('    let { input, pdfh } = this;')
    lines.append('    let html = await request(input);')
    lines.append(f'    let content = pdfh(html, \'{drpy_content}\') || pdfh(html, \'#booktxt&&Html\') || pdfh(html, \'.content&&Html\') || pdfh(html, \'#chaptercontent&&Html\') || \'\';')
    lines.append('    if (content) {')
    lines.append('      content = content')
    lines.append("        .replace(/<script[^>]*?>.*?<\\/script>/gs, '')")
    lines.append("        .replace(/<[^>]+>/g, '')")
    lines.append("        .replace(/&nbsp;/g, ' ')")
    lines.append("        .replace(/&ldquo;/g, '\u201c')")
    lines.append("        .replace(/&rdquo;/g, '\u201d')")
    lines.append("        .replace(/&mdash;/g, '\u2014')")
    lines.append("        .replace(/&hellip;/g, '\u2026')")
    lines.append("        .replace(/&amp;/g, '&')")
    lines.append('        .trim();')
    lines.append('    }')
    lines.append('    if (content) return content;')
    lines.append("    throw new Error('Content not found');")
    lines.append('  }')
    lines.append('};')
    
    return '\n'.join(lines)


def main():
    with open(LEGADO_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    working_domains = [
        'www.zhizhuxs.com', 'www.hzxsw.com', 'bqg.net',
        'www.liyuxiang123.com', 'www.yjxsw.com', 'www.fuxsb.com',
        'www.fxshu.cc', 'm.ttshu.com', 'www.bimidu.com',
        'www.fuxiaoshu.com', 'www.ciweimao.com', 'xingxingxsw.com',
        'ylxs.de', 'xbookcn.org', 'seseclub.com',
        'm.roushuwu7.com', 'www.alicesw.com', 'www.qubook.org',
        'www.7wxs.com', 'www.cuoceng.com', 'www.xiguashuwu.com',
        'www.6mj.com', 'www.kana.com'
    ]
    
    books = [item for item in data if item.get('bookSourceType') == 0]
    
    count = 0
    for item in books:
        book_url = item.get('bookSourceUrl', '')
        if not any(d in book_url for d in working_domains):
            continue
        
        js = make_spider_source(item)
        if not js:
            continue
        
        name = clean_source_name(item.get('bookSourceName', ''))
        if not name:
            continue
        
        filename = f'{name}[书].js'
        filepath = os.path.join(SPIDER_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(js)
        
        print(f'  ✅ {filename}')
        count += 1
    
    print(f'\n共创建 {count} 个书源')


if __name__ == '__main__':
    main()
