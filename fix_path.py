import glob

files = glob.glob('*.html')

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'src="img/brand-icon.png"' in content:
        content = content.replace('src="img/brand-icon.png"', 'src="images/brand-icon.png"')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {file}')
