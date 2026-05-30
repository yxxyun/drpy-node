"""Fetch and show page structure for spider novel site"""
import urllib.request, re, sys, html as html_mod
sys.stdout.reconfigure(encoding='utf-8')

urls = [
    ('蜘蛛小说网', 'https://www.zhizhuxs.com/sort/0/'),
    ('桃桃书', 'https://m.ttshu.com'),
    ('鲤鱼乡', 'http://www.liyuxiang123.com')
]

for name, url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        req.timeout = 10
        resp = urllib.request.urlopen(req)
        raw = resp.read().decode('utf-8', errors='replace')
        # Show first 3000 chars, strip excessive whitespace
        cleaned = re.sub(r'\s+', ' ', raw[:5000])
        print(f'\n=== {name} ({url}) ===')
        print(cleaned)
    except Exception as e:
        print(f'\n=== {name} ({url}) === ERROR: {e}')
