#!/usr/bin/env python3
import re
import os
import glob

def fix_route_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Pattern 1: Fix params type in function signature
    # FROM: { params }: { params: { id: string } }
    # TO: { params }: { params: Promise<{ id: string }> }
    content = re.sub(
        r'\{ params \}: \{ params: (\{[^}]+\}) \}',
        r'{ params }: { params: Promise<\1> }',
        content
    )

    # Pattern 2: Fix params destructuring
    # FROM: const { id } = params
    # TO: const { id } = await params
    content = re.sub(
        r'const \{ ([^}]+) \} = params\b',
        r'const { \1 } = await params',
        content
    )

    # Pattern 3: Fix direct params access
    # FROM: params.id
    # TO: (await params).id
    # But be careful not to replace already fixed ones
    if '{ params }: { params: Promise<' in content:
        # Only fix params.X if params is not already awaited in that context
        lines = content.split('\n')
        new_lines = []
        in_function_with_promise_params = False
        params_destructured = False

        for line in lines:
            # Check if we're in a function with Promise params
            if '{ params }: { params: Promise<' in line:
                in_function_with_promise_params = True
                params_destructured = False

            # Check if params was destructured
            if 'const {' in line and '} = await params' in line:
                params_destructured = True

            # Replace params.X if we're in a Promise params function and params hasn't been destructured
            if in_function_with_promise_params and not params_destructured:
                # Replace params.X with (await params).X, but avoid replacing in comments
                if not line.strip().startswith('//') and not line.strip().startswith('*'):
                    line = re.sub(r'\bparams\.(\w+)', r'(await params).\1', line)

            new_lines.append(line)

            # Reset if we hit a new function
            if line.strip().startswith('export async function'):
                in_function_with_promise_params = False
                params_destructured = False

        content = '\n'.join(new_lines)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

# Find all route files
route_files = glob.glob('apps/frontend/app/api/**/route.ts', recursive=True)

fixed_count = 0
for filepath in route_files:
    if '{ params }: { params: {' in open(filepath).read():
        if fix_route_file(filepath):
            print(f"✓ Fixed: {filepath}")
            fixed_count += 1

print(f"\nTotal fixed: {fixed_count} files")
