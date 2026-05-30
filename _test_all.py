"""Quick test all new Legado sources"""
import json, sys, urllib.request, urllib.parse, os, glob, re
sys.stdout.reconfigure(encoding='utf-8')

spider_dir = r'C:\data\code\drpy-node\spider\js'
files = [f for f in os.listdir(spider_dir) if f.endswith('[书].js')]

# Exclude original drpy book sources
originals = {'七猫小说[书].js', '努努书坊[书].js', '去读书[书].js', 
             '番茄小说[书].js', '阅读助手[书].js', '顶点小说[书].js'}
files = [f for f in files if f not in originals]
files.sort()

results = {}
for filename in files:
    name = filename.replace('.js', '')
    encoded = urllib.parse.quote(name, safe='')
    url = f"http://127.0.0.1:5757/api/{encoded}"
    try:
        req = urllib.request.Request(url)
        req.timeout = 10
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode('utf-8'))
        if 'error' in data:
            results[name] = f"ERR:{data['error'][:60]}"
        elif 'list' in data:
            lst = data.get('list', [])
            cls = data.get('class', [])
            if lst and len(lst) > 0:
                results[name] = f"OK cls={len(cls)} items={len(lst)}"
            elif cls:
                results[name] = f"EMPTY cls={len(cls)}"
            else:
                results[name] = "EMPTY no cls"
        else:
            results[name] = f"UNK"
    except Exception as e:
        results[name] = f"FAIL:{str(e)[:60]}"

ok = [k for k,v in results.items() if v.startswith('OK')]
empty = [k for k,v in results.items() if v.startswith('EMPTY')]
err = [k for k,v in results.items() if v.startswith('ERR')]
fail = [k for k,v in results.items() if v.startswith('FAIL')]

print(f'=== 测试结果 (共{len(results)}源) ===')
print(f'正常(有数据): {len(ok)}')
print(f'空数据: {len(empty)}')
print(f'错误: {len(err)}')
print(f'失败: {len(fail)}')
print()
for k, v in results.items():
    icon = '✅' if v.startswith('OK') else '⚠️' if v.startswith('EMPTY') else '❌' if v.startswith('ERR') else '💥'
    print(f'  {icon} {k}: {v}')
