"""Show Legado explore rules for spider novel site"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\yxx\.qwenpaw\workspaces\default\media\c53945eb5020.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find 蜘蛛小说网 source
for item in data:
    url = item.get('bookSourceUrl', '')
    name = item.get('bookSourceName', '')
    if 'zhizhuxs' in url or '蜘蛛' in name:
        print(f'书源: {name}')
        print(f'URL: {url}')
        print(f'\n=== exploreUrl ===')
        print(json.dumps(item.get('exploreUrl', 'N/A'), ensure_ascii=False)[:1000])
        print(f'\n=== ruleExplore ===')
        print(json.dumps(item.get('ruleExplore', 'N/A'), ensure_ascii=False)[:1000])
        print(f'\n=== searchUrl ===')
        print(json.dumps(item.get('searchUrl', 'N/A'), ensure_ascii=False)[:500])
        print(f'\n=== ruleSearch ===')
        print(json.dumps(item.get('ruleSearch', 'N/A'), ensure_ascii=False)[:1000])
        break
