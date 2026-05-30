"""Find where books actually are in HTML"""
import urllib.request, sys, re
sys.stdout.reconfigure(encoding='utf-8')

req = urllib.request.Request('https://www.zhizhuxs.com/sort/0/', headers={'User-Agent': 'Mozilla/5.0'})
req.timeout = 10
resp = urllib.request.urlopen(req)
text = resp.read().decode('utf-8')

# Show everything between the navigation and pagination
start = text.find('<section class="sectionOne">')
end = text.find('footer-space', start)
if start >= 0 and end >= 0:
    section = text[start:end]
    print(f'Section between nav and footer ({(end-start)} chars):')
    print(section)
else:
    # Show area around book links
    for m in re.finditer(r'href="(/book/\d+/)"', text):
        pos = m.start()
        print(f'\n--- Book link at position {pos} ---')
        print(text[max(0,pos-200):pos+200])
