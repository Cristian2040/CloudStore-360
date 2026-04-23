import glob

files = glob.glob('*.html')
old_sidebar = '<div class="sidebar-brand-icon"><i data-lucide="store"></i></div>'
new_sidebar = '<div class="sidebar-brand-icon" style="background: transparent; border: none; box-shadow: none;"><img src="img/brand-icon.png" alt="Icono" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));"></div>'

old_navbar = '<i data-lucide="store" style="color: var(--primary-color);"></i>'
new_navbar = '<img src="img/brand-icon.png" alt="Icono" style="width: 24px; height: 24px; object-fit: contain; vertical-align: middle; margin-right: 8px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));">'

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False
    if old_sidebar in content:
        content = content.replace(old_sidebar, new_sidebar)
        changed = True
    if old_navbar in content:
        content = content.replace(old_navbar, new_navbar)
        changed = True

    if changed:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file}')
