#!/usr/bin/env python3
import re
import os
import glob

def fix_route_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    modified = False
    new_lines = []

    for i, line in enumerate(lines):
        # Fix function signature - add Promise wrapper
        if '{ params }: { params: {' in line and 'Promise<' not in line:
            line = re.sub(
                r'\{ params \}: \{ params: (\{[^}]+\}) \}',
                r'{ params }: { params: Promise<\1> }',
                line
            )
            modified = True

            # Now we need to add destructuring right after the try block
            # Find the next line that starts the try block and inject destructuring
            new_lines.append(line)

            # Look ahead to find "try {" and add destructuring
            for j in range(i+1, min(i+10, len(lines))):
                new_lines.append(lines[j])
                if 'try {' in lines[j]:
                    # Extract param names from the signature
                    match = re.search(r'\{ params \}: \{ params: Promise<\{([^}]+)\}>', line)
                    if match:
                        params_def = match.group(1).strip()
                        # Extract param names (e.g., "id: string" -> "id")
                        param_names = [p.split(':')[0].strip() for p in params_def.split(',')]

                        # Add destructuring line
                        indent = '    '  # Assuming 4-space indent
                        destructure_line = f"{indent}const {{ {', '.join(param_names)} }} = await params\n"
                        new_lines.append(destructure_line)
                        modified = True
                    break
            # Skip to the line after try block was found
            continue

        new_lines.append(line)

    if modified:
        with open(filepath, 'w') as f:
            f.writelines(new_lines)
        return True
    return False

# Find all route files
route_files = glob.glob('apps/frontend/app/api/**/route.ts', recursive=True)

fixed_count = 0
for filepath in route_files:
    try:
        if '{ params }: { params: Promise<{' in open(filepath).read():
            if fix_route_file(filepath):
                print(f"✓ Fixed: {filepath}")
                fixed_count += 1
    except Exception as e:
        print(f"✗ Error in {filepath}: {e}")

print(f"\nTotal fixed: {fixed_count} files")
