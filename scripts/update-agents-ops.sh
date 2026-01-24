#!/bin/bash

# Script to update all agent definitions with the new ./ops check rule

target_dir=".claude/agents"

# Find all markdown files in the agents directory
find "$target_dir" -name "*.md" | while read -r file; do
    echo "Updating $file..."
    
    # Check if the file contains "Step 1: Do your task"
    if grep -q "Step 1: Do your task" "$file"; then
        # Check if already updated to avoid duplication
        if ! grep -q "./ops check" "$file"; then
            # Insert the rule after the "Do your task" header's bullet points
            # We look for "Use all your designated tools and skills" which seems common in the template
            # and append the new rule after it.
            sed -i '/- Use all your designated tools and skills/a \- **MANDATORY**: Run `./ops check` and ensure it passes before proceeding.' "$file"
            echo "✅ Updated $file"
        else
            echo "Skipping $file (already has rule)"
        fi
    else
        echo "⚠️  Skipping $file (pattern not found)"
    fi
done

echo "Done updating agents."
