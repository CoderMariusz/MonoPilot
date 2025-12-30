#!/usr/bin/env python3
"""
Fix missing `const { id } = await params` in API routes.
"""
import os
import re

def fix_file(filepath):
    """Add params destructuring if missing."""
    with open(filepath, 'r') as f:
        content = f.read()

    # Check if file has params: Promise<{ id: string }> pattern
    if 'params: Promise<{ id: string }>' not in content:
        return False

    # Check if already has the fix
    if 'const { id } = await params' in content:
        return False

    # Check if uses .eq('id', id) pattern
    if ".eq('id', id)" not in content:
        return False

    # Pattern: Look for "const orgId = userData.org_id" without "const { id } = await params" after it
    # Insert the fix after the first occurrence
    pattern = r"(const orgId = userData\.org_id\n)"

    def replacement(match):
        return match.group(1) + "    const { id } = await params\n"

    new_content, count = re.subn(pattern, replacement, content, count=1)

    if count == 0:
        # Try alternative pattern without orgId
        pattern2 = r"(const supabase = await createServerSupabase\(\)\n)"
        def replacement2(match):
            return match.group(1) + "    const { id } = await params\n"
        new_content, count = re.subn(pattern2, replacement2, content, count=1)

    if count > 0 and new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

# Find all files with the pattern
root = '/workspaces/MonoPilot/apps/frontend/app/api/v1'
fixed = []

for dirpath, dirnames, filenames in os.walk(root):
    for filename in filenames:
        if filename.endswith('.ts'):
            filepath = os.path.join(dirpath, filename)
            if fix_file(filepath):
                fixed.append(filepath)

print(f"Fixed {len(fixed)} files:")
for f in fixed:
    print(f"  {f}")
