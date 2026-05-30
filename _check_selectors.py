"""Check if Legado selectors match current website HTML"""
import urllib.request, sys, re, json
sys.stdout.reconfigure(encoding='utf-8')

# Read Legado sources
with open(r'C:\Users\yxx\.qwenpaw\workspaces\default\media\c53945eb5020.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Test each working source
sources_to_test = [
    ('蜘蛛小说网', 'https://www.zhizhuxs.com', '/sort/0/', '.CGsectionTwo-right-content-unit'),
    ('鲤鱼乡', 'http://www.liyuxiang123.com', '/', ''),
    ('桃桃书', 'https://m.ttshu.com', '/', ''),
]

for sname, host, path in sources_to_test:
    # Find the Legado source
    legado = None
    for item in data:
        url = item.get('bookSourceUrl', '')
        if host in url:
            legado = item
            break
    
    if not legado:
        print(f'\n=== {sname} === 未找到 Legado 源')
        continue
    
    # Get the explore rule's bookList selector
    rule_explore = legado.get('ruleExplore', {})
    book_list_selector = rule_explore.get('bookList', '')
    
    print(f'\n=== {sname} ({host}) ===')
    print(f'   书源名: {legado.get("bookSourceName","")}')
    print(f'   List选择器: {book_list_selector}')
    print(f'   名称规则: {rule_explore.get("name","")}')
    print(f'   URL规则: {rule_explore.get("bookUrl","")}')
    
    # Fetch the page and check if selector class exists
    try:
        req = urllib.request.Request(host + path, headers={'User-Agent': 'Mozilla/5.0'})
        req.timeout = 10
        resp = urllib.request.urlopen(req)
        text = resp.read().decode('utf-8', errors='replace')
        
        # Extract class name from selector (remove attr part after @)
        selector = book_list_selector.split('@')[0] if book_list_selector else ''
        # Check if this class exists in HTML
        if selector:
            # Remove CSS pseudo-classes like :eq(), :nth, etc.
            class_name = re.sub(r'[.:\[#].*', '', selector)
            if class_name:
                found = class_name in text
                print(f'   选择器 "{selector}" 在HTML中: {"✅ 存在" if found else "❌ 不存在"}')
            else:
                print(f'   选择器: {selector[:60]}')
        # Also check raw selector
        print(f'   页面大小: {len(text)} bytes')
        
        # Find book links count
        books = re.findall(r'href="(/book/\d+/)"', text)
        print(f'   书籍链接数: {len(books)}')
        
    except Exception as e:
        print(f'   Error: {e}')
