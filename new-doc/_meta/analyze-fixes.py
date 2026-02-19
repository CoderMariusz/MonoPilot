#!/usr/bin/env python3
"""
Parse fix-commits-with-stats.txt and categorize all 341 bug fixes by module and type.
"""

import re
from collections import defaultdict, Counter
from typing import Dict, List, Tuple

# Module detection patterns (based on file paths)
MODULE_PATTERNS = {
    '01-settings': [
        r'app/\(authenticated\)/settings/',
        r'app/api/settings/',
        r'app/api/v1/settings/',
        r'components/settings/',
        r'lib/services/.*(?:user|role|location|warehouse|production-line|allergen|tax)',
    ],
    '02-technical': [
        r'app/\(authenticated\)/technical/',
        r'app/api/technical/',
        r'app/api/v1/technical/',
        r'components/technical/',
        r'lib/services/.*(?:product|bom|routing|recipe|spec)',
    ],
    '03-planning': [
        r'app/\(authenticated\)/planning/',
        r'app/api/planning/',
        r'components/planning/',
        r'lib/services/.*(?:purchase-order|po-|supplier|work-order|wo-|transfer-order)',
    ],
    '04-production': [
        r'app/\(authenticated\)/production/',
        r'app/api/production/',
        r'components/production/',
        r'lib/services/.*(?:production|consumption|output)',
    ],
    '05-warehouse': [
        r'app/\(authenticated\)/warehouse/',
        r'app/api/warehouse/',
        r'components/warehouse/',
        r'lib/services/.*(?:inventory|license-plate|lp-|asn|aging|expiry)',
    ],
    '06-quality': [
        r'app/\(authenticated\)/quality/',
        r'app/api/quality/',
        r'components/quality/',
        r'lib/services/.*(?:quality|hold|ncr|inspection)',
    ],
    '07-shipping': [
        r'app/\(authenticated\)/shipping/',
        r'app/api/shipping/',
        r'components/shipping/',
        r'lib/services/.*(?:shipping|shipment|sales-order)',
    ],
    '05-scanner': [
        r'app/\(authenticated\)/scanner/',
        r'app/api/.*scanner',
        r'components/scanner/',
    ],
    '00-dashboard': [
        r'app/\(authenticated\)/dashboard/',
        r'components/dashboard/',
        r'lib/services/dashboard',
    ],
}

# Bug type detection patterns (from commit messages)
BUG_TYPE_PATTERNS = {
    'API': [
        r'\bapi\b', r'endpoint', r'route\.ts', r'status code', r'cors', r'401', r'404', r'500',
        r'missing.*route', r'wrong.*response', r'http'
    ],
    'UI': [
        r'\bui\b', r'display', r'empty state', r'loading', r'render', r'visible', r'visibility',
        r'button', r'modal', r'table', r'form', r'dropdown', r'badge', r'responsive'
    ],
    'Data/DB': [
        r'database', r'\bdb\b', r'migration', r'schema', r'query', r'\bsql\b', r'rls',
        r'policy', r'supabase', r'column', r'table.*missing', r'unit_cost', r'cost_per_unit'
    ],
    'Validation': [
        r'validation', r'validate', r'zod', r'schema.*error', r'type.*error', r'missing.*validation',
        r'invalid'
    ],
    'State Management': [
        r'state', r'stale', r'cache', r'race condition', r'timeout', r'hang', r'persist'
    ],
    'Security': [
        r'auth', r'session', r'csrf', r'xss', r'permission', r'role', r'rls', r'org_id.*hardcoded',
        r'multi-tenant', r'cookie'
    ],
    'Performance': [
        r'slow', r'n\+1', r'pagination', r'optimize', r'index', r'performance'
    ],
    'Type/TypeScript': [
        r'typescript', r'\btype\b', r'interface', r'generic', r'lint', r'eslint',
        r'\.d\.ts', r'tsconfig'
    ],
    'Integration': [
        r'supabase.*client', r'third.*party', r'integration', r'external'
    ],
    'UX': [
        r'workflow', r'confusing', r'feedback', r'toast', r'navigation', r'redirect',
        r'user.*experience'
    ],
    'Routing': [
        r'routing', r'route.*conflict', r'404.*route', r'navigation.*error', r'slug',
        r'dynamic.*route'
    ],
    'E2E/Testing': [
        r'e2e', r'test', r'playwright', r'selector', r'data-testid', r'seeding',
        r'fixture'
    ],
}

def parse_commits(filename: str) -> List[Dict]:
    """Parse the fix commits file into structured data."""
    commits = []
    current_commit = None

    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()

            if line.startswith('=== COMMIT:'):
                if current_commit:
                    commits.append(current_commit)
                commit_hash = line.split('=== COMMIT:')[1].strip().replace('===', '').strip()
                current_commit = {
                    'hash': commit_hash,
                    'msg': '',
                    'date': '',
                    'files': []
                }
            elif line.startswith('MSG:') and current_commit:
                current_commit['msg'] = line.split('MSG:', 1)[1].strip()
            elif line.startswith('DATE:') and current_commit:
                current_commit['date'] = line.split('DATE:', 1)[1].strip()
            elif '|' in line and current_commit:
                # File change line
                parts = line.split('|')
                if len(parts) >= 2:
                    filepath = parts[0].strip()
                    if filepath and not filepath.startswith('='):
                        current_commit['files'].append(filepath)

        # Add last commit
        if current_commit:
            commits.append(current_commit)

    return commits

def detect_module(commit: Dict) -> str:
    """Detect which module this commit belongs to."""
    files_str = ' '.join(commit['files'])
    msg_str = commit['msg'].lower()

    # Check file patterns
    for module, patterns in MODULE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, files_str, re.IGNORECASE):
                return module

    # Check message patterns
    module_keywords = {
        '01-settings': ['settings', 'user', 'role', 'location', 'warehouse', 'production line', 'tax code', 'allergen'],
        '02-technical': ['technical', 'product', 'bom', 'routing', 'recipe', 'spec', 'formula'],
        '03-planning': ['planning', 'purchase order', 'po ', 'supplier', 'work order', 'wo ', 'transfer order'],
        '04-production': ['production', 'consumption', 'output', 'manufacturing'],
        '05-warehouse': ['warehouse', 'inventory', 'license plate', 'lp ', 'asn', 'aging', 'expiry'],
        '06-quality': ['quality', 'hold', 'ncr', 'inspection'],
        '07-shipping': ['shipping', 'shipment', 'sales order'],
        '05-scanner': ['scanner', 'receive', 'pick', 'pack'],
        '00-dashboard': ['dashboard'],
    }

    for module, keywords in module_keywords.items():
        for keyword in keywords:
            if keyword in msg_str:
                return module

    # Foundation for everything else
    if any(x in files_str for x in ['middleware.ts', 'lib/auth', 'lib/supabase', '.claude', 'docs/']):
        return '00-foundation'
    if any(x in files_str for x in ['e2e/', 'test', 'playwright']):
        return '00-testing'

    return '00-foundation'

def detect_bug_types(commit: Dict) -> List[str]:
    """Detect bug types for this commit."""
    msg_lower = commit['msg'].lower()
    files_str = ' '.join(commit['files']).lower()
    combined = msg_lower + ' ' + files_str

    types = []
    for bug_type, patterns in BUG_TYPE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                types.append(bug_type)
                break

    if not types:
        types.append('Other')

    return types

def analyze_commits(commits: List[Dict]) -> Dict:
    """Analyze all commits and generate statistics."""
    stats = {
        'total': len(commits),
        'by_module': Counter(),
        'by_type': Counter(),
        'module_types': defaultdict(Counter),
        'commits_by_module': defaultdict(list),
        'commits_by_type': defaultdict(list),
    }

    for commit in commits:
        module = detect_module(commit)
        bug_types = detect_bug_types(commit)

        stats['by_module'][module] += 1
        stats['commits_by_module'][module].append(commit)

        for bug_type in bug_types:
            stats['by_type'][bug_type] += 1
            stats['module_types'][module][bug_type] += 1
            stats['commits_by_type'][bug_type].append(commit)

    return stats

def format_report(stats: Dict) -> str:
    """Generate the markdown report."""
    lines = []
    lines.append("# Bug Fix Analysis Report\n")
    lines.append(f"**Total Commits Analyzed**: {stats['total']}\n")

    # Module distribution
    lines.append("\n## Distribution by Module\n")
    lines.append("| Module | Count | % |\n")
    lines.append("|--------|-------|----|\n")
    for module, count in sorted(stats['by_module'].items()):
        pct = (count / stats['total']) * 100
        lines.append(f"| {module} | {count} | {pct:.1f}% |\n")

    # Type distribution
    lines.append("\n## Distribution by Bug Type\n")
    lines.append("| Type | Count | % |\n")
    lines.append("|------|-------|----|\n")
    for bug_type, count in stats['by_type'].most_common():
        pct = (count / stats['total']) * 100
        lines.append(f"| {bug_type} | {count} | {pct:.1f}% |\n")

    # Module-Type matrix
    lines.append("\n## Bug Types by Module\n")
    for module in sorted(stats['by_module'].keys()):
        lines.append(f"\n### {module}\n")
        types = stats['module_types'][module]
        if types:
            for bug_type, count in types.most_common(5):
                lines.append(f"- {bug_type}: {count}\n")

    # Top commits per module
    lines.append("\n## Sample Commits by Module\n")
    for module in sorted(stats['commits_by_module'].keys()):
        commits = stats['commits_by_module'][module]
        lines.append(f"\n### {module} ({len(commits)} fixes)\n")
        for commit in commits[:5]:  # Show first 5
            lines.append(f"- `{commit['hash']}`: {commit['msg']}\n")

    return ''.join(lines)

def main():
    print("Parsing commits...")
    commits = parse_commits('/workspaces/MonoPilot/new-doc/_meta/fix-commits-with-stats.txt')
    print(f"Found {len(commits)} commits")

    print("Analyzing commits...")
    stats = analyze_commits(commits)

    print("Generating report...")
    report = format_report(stats)

    output_file = '/workspaces/MonoPilot/new-doc/_meta/bug-analysis-report.txt'
    with open(output_file, 'w') as f:
        f.write(report)

    print(f"Report written to {output_file}")

    # Also save structured data for deeper analysis
    import json
    json_output = '/workspaces/MonoPilot/new-doc/_meta/bug-analysis-data.json'
    with open(json_output, 'w') as f:
        json.dump({
            'total': stats['total'],
            'by_module': dict(stats['by_module']),
            'by_type': dict(stats['by_type']),
            'commits': [{
                'hash': c['hash'],
                'msg': c['msg'],
                'module': detect_module(c),
                'types': detect_bug_types(c),
                'file_count': len(c['files'])
            } for c in commits]
        }, f, indent=2)
    print(f"JSON data written to {json_output}")

if __name__ == '__main__':
    main()
