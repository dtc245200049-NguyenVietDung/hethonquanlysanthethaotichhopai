import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import re
import os
import sys

def add_formatted_paragraph(doc, text, style=None, indent_level=0, prefix=None):
    p = doc.add_paragraph(style=style)
    # Loại bỏ triệt để các ký tự chấm tròn kiểu AI (•, ·)
    text = text.replace('• ', '- ').replace('•', ' - ').replace('· ', '- ')
    
    # Định dạng khoảng cách dòng chuẩn học thuật (1.2 line spacing, 3pt space after)
    p.paragraph_format.line_spacing = 1.25
    p.paragraph_format.space_after = Pt(3.5)
    
    if indent_level > 0:
        if indent_level >= 4:
            p.paragraph_format.left_indent = Inches(0.55)
            p.paragraph_format.first_line_indent = Inches(-0.2)
        elif indent_level >= 2:
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.first_line_indent = Inches(-0.15)
        else:
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.first_line_indent = Inches(-0.15)
            
    if prefix:
        run_p = p.add_run(prefix)
        run_p.bold = False

    # Phân tách cú pháp Markdown Bold (**text**) & Italic (*text*)
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = p.add_run(part[2:-2])
            run.bold = True
        else:
            iparts = re.split(r'(\*.*?\*)', part)
            for ipart in iparts:
                if ipart.startswith('*') and ipart.endswith('*') and len(ipart) > 2:
                    run = p.add_run(ipart[1:-1])
                    run.italic = True
                else:
                    p.add_run(ipart)
    return p

def create_docx(md_file, docx_file):
    doc = docx.Document()
    
    # 1. Cấu hình Khổ giấy Chuẩn A4 Việt Nam & Lề trang chuẩn in ấn đóng bìa
    for section in doc.sections:
        section.page_width = Inches(8.27)     # Chiều ngang A4: 210mm
        section.page_height = Inches(11.69)   # Chiều cao A4: 297mm
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.85)    # Lề trái chừa gáy đóng bìa
        section.right_margin = Inches(0.65)
    
    # 2. Định dạng Font chữ mặc định: Times New Roman 13pt
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(13)
    font.color.rgb = RGBColor(0x11, 0x18, 0x27)

    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_text = ""
    in_table = False
    table = None

    for line in lines:
        line = line.rstrip('\n')
        
        # Bỏ qua neo HTML hoặc đường kẻ ngang trang trí
        if line.startswith('<a id') or line == '---':
            continue
            
        # Xử lý khối mã nguồn (Code block)
        if line.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_text = ""
            else:
                in_code_block = False
                p = doc.add_paragraph()
                p.paragraph_format.left_indent = Inches(0.25)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(6)
                clean_code = code_text.strip().replace('• ', '- ')
                run = p.add_run(clean_code)
                run.font.name = 'Courier New'
                run.font.size = Pt(9.5)
            continue
            
        if in_code_block:
            code_text += line + "\n"
            continue

        # 3. Xử lý Bảng biểu Markdown
        if line.strip().startswith('|') and line.strip().endswith('|'):
            cells = [cell.strip() for cell in line.strip().split('|')[1:-1]]
            
            if len(cells) > 0 and '---' in cells[0]: # Dòng phân cách header
                continue
                
            if not in_table:
                in_table = True
                table = doc.add_table(rows=1, cols=len(cells))
                table.style = 'Table Grid'
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                hdr_cells = table.rows[0].cells
                for i, cell in enumerate(cells):
                    clean_cell = cell.replace('**', '').replace('• ', '- ').replace('•', ' - ')
                    hdr_cells[i].text = clean_cell
                    # In đậm header bảng
                    for paragraph in hdr_cells[i].paragraphs:
                        for r in paragraph.runs:
                            r.bold = True
                            r.font.name = 'Times New Roman'
                            r.font.size = Pt(11)
            else:
                row_cells = table.add_row().cells
                for i, cell in enumerate(cells):
                    if i < len(row_cells):
                        clean_cell = cell.replace('**', '').replace('• ', '- ').replace('•', ' - ')
                        row_cells[i].text = clean_cell
                        for paragraph in row_cells[i].paragraphs:
                            for r in paragraph.runs:
                                r.font.name = 'Times New Roman'
                                r.font.size = Pt(11)
            continue
        else:
            if in_table:
                in_table = False
                p_spacer = doc.add_paragraph()
                p_spacer.paragraph_format.space_before = Pt(2)
                p_spacer.paragraph_format.space_after = Pt(4)

        # 4. Xử lý Chèn Hình ảnh Biểu đồ (Phóng to tối đa bề ngang trang giấy A4 6.7 inches)
        img_match = re.match(r'^!\[(.*?)\]\((.*?)\)', line.strip())
        if img_match:
            img_path = img_match.group(2).strip()
            if os.path.exists(img_path):
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.space_after = Pt(2)
                try:
                    # Kích thước cực đại 6.7 inch (gần 17.0 cm) phủ trọn chiều rộng A4
                    # Giúp mọi chữ, mũi tên, nhãn và khối đồ thị đều to, sắc nét và dễ đọc nhất!
                    p.add_run().add_picture(img_path, width=Inches(6.7))
                except Exception as e:
                    print(f"Error inserting image {img_path}:", e)
            continue

        # Làm sạch liên kết Markdown
        clean_line = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', line)
        clean_line = clean_line.replace('• ', '- ').replace('•', ' - ')
        
        # Canh giữa chú thích Hình ảnh
        if clean_line.strip().startswith('**_Hình') or clean_line.strip().startswith('*_Hình') or clean_line.strip().startswith('_Hình'):
            p = add_formatted_paragraph(doc, clean_line.strip())
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(10)
            for r in p.runs:
                r.italic = True
                r.font.size = Pt(11)
            continue

        # Xử lý Tiêu đề (Headings)
        if clean_line.startswith('# '):
            h = doc.add_heading(clean_line[2:], level=1)
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(6)
        elif clean_line.startswith('## '):
            h = doc.add_heading(clean_line[3:], level=2)
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(5)
        elif clean_line.startswith('### '):
            h = doc.add_heading(clean_line[4:], level=3)
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(4)
        elif clean_line.startswith('#### '):
            h = doc.add_heading(clean_line[5:], level=4)
            h.paragraph_format.space_before = Pt(8)
            h.paragraph_format.space_after = Pt(3)
        # 5. Xử lý Dấu gạch đầu dòng danh sách: DÙNG DẤU GẠCH NGANG (-) THAY VÌ DẤU CHẤM TRÒN (•)
        elif clean_line.strip().startswith('- '):
            raw_stripped = clean_line.lstrip()
            indent_spaces = len(clean_line) - len(raw_stripped)
            item_text = raw_stripped[2:].strip()
            prefix = "+ " if indent_spaces >= 4 else "- "
            add_formatted_paragraph(doc, item_text, indent_level=max(1, indent_spaces), prefix=prefix)
        # Danh sách số thứ tự (Numbered list)
        elif re.match(r'^\d+\.\s', clean_line.strip()):
            match = re.match(r'^(\d+\.)\s(.*)', clean_line.strip())
            if match:
                num_prefix = match.group(1) + " "
                num_text = match.group(2)
                add_formatted_paragraph(doc, num_text, indent_level=1, prefix=num_prefix)
            else:
                add_formatted_paragraph(doc, clean_line)
        # Trích dẫn (Blockquote)
        elif clean_line.strip().startswith('> '):
            p = add_formatted_paragraph(doc, clean_line.strip()[2:])
            p.paragraph_format.left_indent = Inches(0.3)
            for r in p.runs:
                r.italic = True
        elif clean_line.strip() == '':
            pass
        else:
            add_formatted_paragraph(doc, clean_line)

    if in_table:
        pass

    doc.save(docx_file)
    print(f"File created successfully: {docx_file}")

if __name__ == '__main__':
    if len(sys.argv) >= 3:
        create_docx(sys.argv[1], sys.argv[2])
    elif len(sys.argv) == 2:
        out_name = sys.argv[1].replace('.md', '')
        if not out_name.endswith('.docx'):
            out_name += '.docx'
        create_docx(sys.argv[1], out_name)
    else:
        print("Usage: python md2word_with_images.py <input.md> [output.docx]")
