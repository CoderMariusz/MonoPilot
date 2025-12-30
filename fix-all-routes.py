#!/usr/bin/env python3
import re
import glob

def fix_route_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # Find all functions with Promise<{ ... }> params
    pattern = r'(export async function \w+)\([^)]*\{ params \}: \{ params: Promise<\{([^}]+)\}> \}\) \{\s*try \{'

    def replace_func(match):
        func_decl = match.group(0)
        params_str = match.group(2).strip()

        # Extract param names (e.g., "id: string, other: number" -> ["id", "other"])
        param_names = [p.split(':')[0].strip() for p in params_str.split(',')]

        # Add destructuring after "try {"
        destructure = f"    const {{ {', '.join(param_names)} }} = await params\n"

        return func_decl + "\n" + destructure

    content = re.sub(pattern, replace_func, content)

    # Now replace all params.X with just X
    # But only for params that were destructured
    for match in re.finditer(r'const \{ ([^}]+) \} = await params', content):
        param_names = [p.strip() for p in match.group(1).split(',')]
        for param_name in param_names:
            # Replace params.paramName with just paramName
            content = re.sub(rf'\bparams\.{param_name}\b', param_name, content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

# Find all route files with Promise params
route_files = []
for filepath in glob.glob('apps/frontend/app/api/**/route.ts', recursive=True):
    with open(filepath, 'r') as f:
        if 'Promise<{' in f.read():
            route_files.append(filepath)

print(f"Found {len(route_files)} files to fix")

fixed_count = 0
for filepath in route_files:
    try:
        if fix_route_file(filepath):
            print(f"✓ Fixed: {filepath}")
            fixed_count += 1
    except Exception as e:
        print(f"✗ Error in {filepath}: {e}")

print(f"\nTotal fixed: {fixed_count} files")
