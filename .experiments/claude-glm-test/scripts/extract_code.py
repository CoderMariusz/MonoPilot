#!/usr/bin/env python3
import json
import sys

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

code = data['response']

# Remove markdown code fences
if '```typescript' in code:
    code = code.split('```typescript')[1].split('```')[0].strip()
elif '```' in code:
    code = code.split('```')[1].split('```')[0].strip()

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(code)

print(f"Extracted clean code to {output_file}")
