with open('scratch/diff.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_js_diff = False
js_diff_lines = []
current_hunk = ""
line_count = 0

for line in lines:
    if line.startswith('@@'):
        current_hunk = line
    # Detect the file and search for the script block or line indicators
    if line.startswith('+++ b/apps/tenant-dashboard/public/index.html'):
        in_js_diff = True
        continue
    elif line.startswith('---') or line.startswith('diff --git'):
        in_js_diff = False
        
    if in_js_diff:
        # Check if we are inside the script tag of index.html
        # We can look at line numbers in hunks, or just look for JS-like additions
        # Let's collect lines starting with + or - that are in the Javascript portion
        # (Usually after the HTML layout, which is lines 1 to ~11438)
        # Let's parse the @@ hunks: @@ -old_start,old_len +new_start,new_len @@
        if line.startswith('@@'):
            parts = line.split()
            if len(parts) >= 3:
                # new_start is in parts[2] e.g. +11500,200
                try:
                    new_start = int(parts[2].split(',')[0].replace('+', ''))
                    if new_start > 11000:
                        in_js_diff = True
                    else:
                        in_js_diff = False
                except:
                    pass
        if in_js_diff:
            if line.startswith('+') or line.startswith('-'):
                if not (line.startswith('+++') or line.startswith('---')):
                    js_diff_lines.append(line.strip('\n'))

print(f"Total JS diff lines: {len(js_diff_lines)}")
for l in js_diff_lines[:150]:  # print first 150 lines
    print(l)
