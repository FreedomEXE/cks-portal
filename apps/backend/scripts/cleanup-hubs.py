#!/usr/bin/env python3
import re
import sys

def cleanup_hub(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove preloaded order upsert effect
    content = re.sub(
        r'  // Upsert preloaded order.*?\n.*?\n.*?location\.state.*?\n.*?normalizedCode.*?\n.*?mutate\(`/hub/orders/\$\{[^}]+\}`, \(prev: any\) => \{.*?\n.*?if \(!prev\) return prev;.*?\n.*?const o = preloaded;.*?\n.*?const orders = \[o, \.\.\.\(prev\.orders.*?\n.*?const serviceOrders = o\.orderType === \'service\'.*?\n.*?\? \[o, \.\.\.\(prev\.serviceOrders.*?\n.*?: \(prev\.serviceOrders.*?\n.*?const productOrders = o\.orderType === \'product\'.*?\n.*?\? \[o, \.\.\.\(prev\.productOrders.*?\n.*?: \(prev\.productOrders.*?\n.*?return \{ \.\.\.prev, orders, serviceOrders, productOrders \};.*?\n.*?\}, false\);.*?\n.*?\}.*?\n.*?\}, \[location\.state,.*?\n',
        '',
        content,
        flags=re.DOTALL
    )

    # Remove revalidate orders effect (if present)
    content = re.sub(
        r'  // Revalidate orders when highlighting.*?\n.*?useEffect\(\(\) => \{.*?\n.*?if \(urlHighlightOrder.*?\n.*?mutate\(`/hub/orders.*?\n.*?\}.*?\n.*?\}, \[urlHighlightOrder,.*?\n',
        '',
        content,
        flags=re.DOTALL
    )

    # Simplify service orders useMemo - remove force-include logic
    content = re.sub(
        r'(\s+)(let mapped = .*?serviceOrders.*?\.map\(\(order\) => \(\{[^\}]+\}\)\);)\s*// Force-include highlighted order if it\'s a service order.*?if \(urlHighlightOrder\) \{.*?mapped = \[mappedHighlight, \.\.\.mapped\];.*?\}.*?\}.*?(return mapped;)',
        r'\1\2\n\n\1\3',
        content,
        flags=re.DOTALL
    )

    # Simplify product orders useMemo - remove force-include logic
    content = re.sub(
        r'(\s+)(let mapped = .*?productOrders.*?\.map\(\(order\) => \(\{[^\}]+\}\)\);)\s*// Force-include highlighted order if it\'s a product order.*?if \(urlHighlightOrder\) \{.*?mapped = \[mappedHighlight, \.\.\.mapped\];.*?\}.*?\}.*?(return mapped;)',
        r'\1\2\n\n\1\3',
        content,
        flags=re.DOTALL
    )

    # Fix dependencies in useMemos - remove urlHighlightOrder
    content = re.sub(r', urlHighlightOrder\]', ']', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Cleaned {filepath}")

if __name__ == '__main__':
    for filepath in sys.argv[1:]:
        cleanup_hub(filepath)
