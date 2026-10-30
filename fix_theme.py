#!/usr/bin/env python3
"""
Fix theme issues across all frontend TSX files.
Replaces:
  - text-white  -> text-foreground   (except inside "hover:bg-X hover:text-white" which should stay)
  - hover:text-white -> hover:text-foreground
  - bg-background-surface (keep as is, it's in tailwind config)
  - Also fixes select/textarea/input inline styles with text-white -> text-foreground
"""
import os
import re

SRC = "/home/khun-si-thu/Desktop/royal-delivery-management-system/frontend/src"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix hover:text-white -> hover:text-foreground
    content = content.replace('hover:text-white', 'hover:text-foreground')
    
    # Fix text-white -> text-foreground ONLY when it's not part of "hover:bg-X hover:text-white"
    # (those were already handled above since we fix hover:text-white first)
    # Now fix remaining plain "text-white" instances
    # We use word-boundary-style matching to avoid partial replacements
    content = re.sub(r'\btext-white\b', 'text-foreground', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")
    else:
        print(f"No changes: {filepath}")

def main():
    for root, dirs, files in os.walk(SRC):
        # Skip node_modules if somehow inside src
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for filename in files:
            if filename.endswith(('.tsx', '.ts', '.css')):
                fix_file(os.path.join(root, filename))

if __name__ == '__main__':
    main()
