import os
import sys
import zlib
import urllib.request

def plantuml_encode(text):
    zlibbed_str = zlib.compress(text.encode('utf-8'))
    compressed_string = zlibbed_str[2:-4]
    mapping = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'
    res = ''
    i = 0
    while i < len(compressed_string):
        b1 = compressed_string[i]
        b2 = compressed_string[i+1] if i+1 < len(compressed_string) else 0
        b3 = compressed_string[i+2] if i+2 < len(compressed_string) else 0
        c1 = b1 >> 2
        c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
        c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
        c4 = b3 & 0x3F
        res += mapping[c1] + mapping[c2] + mapping[c3] + mapping[c4]
        i += 3
    return res

def render_file(puml_path, output_png_path):
    if not os.path.exists(puml_path):
        print(f"Error: File not found: {puml_path}")
        return False
    
    with open(puml_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    encoded = plantuml_encode(content)
    url = f"http://www.plantuml.com/plantuml/png/{encoded}"
    print(f"Fetching from: {url}")
    
    os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            with open(output_png_path, 'wb') as out_f:
                out_f.write(data)
        print(f"Successfully rendered: {output_png_path} ({len(data)} bytes)")
        return True
    except Exception as e:
        print(f"Render failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python render_plantuml.py <input.puml> <output.png>")
        sys.exit(1)
    success = render_file(sys.argv[1], sys.argv[2])
    sys.exit(0 if success else 1)

