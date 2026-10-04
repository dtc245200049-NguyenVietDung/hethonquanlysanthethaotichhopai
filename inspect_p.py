import docx, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
doc = docx.Document('PHẦN 1, 2, 3 - TÀI LIỆU YÊU CẦU VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ SÂN THỂ THAO.docx')

rels = doc.part.rels

for i, p in enumerate(doc.paragraphs):
    blips = p._element.xpath('.//a:blip/@r:embed')
    text = p.text.strip()
    if blips or any(k in text.lower() for k in ['hình', 'sơ đồ', 'biểu đồ']):
        target_imgs = [rels[rId].target_ref for rId in blips if rId in rels]
        print(f"P{i:03d} | Blips: {target_imgs} | Text: {text[:80]}")
