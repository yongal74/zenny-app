import json, os, glob

base = r'C:\Users\장우경\.gemini\antigravity\zenny-spec-push\apps\mobile\node_modules'

patterns = [
    os.path.join(base, 'metro*', 'package.json'),
    os.path.join(base, '@expo', 'metro*', 'package.json'),
    os.path.join(base, 'metro*', 'node_modules', 'metro*', 'package.json'),
]

files = set()
for p in patterns:
    files.update(glob.glob(p))

print(f'Found {len(files)} metro-* package.json files')

for f in sorted(files):
    try:
        fp = open(f, 'r', encoding='utf-8')
        pkg = json.load(fp)
        fp.close()
    except Exception as e:
        print(f'  SKIP: {f}')
        continue

    exports = pkg.get('exports')
    if not exports or not isinstance(exports, dict):
        continue

    src_dir = os.path.join(os.path.dirname(f), 'src')
    if not os.path.exists(src_dir):
        continue

    changed = False
    if './src/*' not in exports:
        exports['./src/*'] = './src/*.js'
        pkg['exports'] = exports
        changed = True

    if changed:
        fp = open(f, 'w', encoding='utf-8')
        json.dump(pkg, fp, indent=2)
        fp.close()
        name = pkg.get('name', 'unknown')
        print(f'  PATCHED: {name}')
    else:
        name = pkg.get('name', 'unknown')
        print(f'  OK: {name}')
