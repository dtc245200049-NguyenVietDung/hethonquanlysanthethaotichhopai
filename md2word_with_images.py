import docx
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import re
import base64
import zlib
import urllib.request
import io

def render_diagram_kroki(code, diagram_type):
    try:
        compressed = zlib.compress(code.encode('utf-8'), 9)
        b64 = base64.urlsafe_b64encode(compressed).decode('ascii')
        url = f"https://kroki.io/{diagram_type}/png/{b64}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.getcode() == 200:
                return io.BytesIO(response.read())
    except Exception as e:
        print(f"Error rendering {diagram_type}:", e)
    return None

def add_formatted_paragraph(doc, text, style=None):
    p = doc.add_paragraph(style=style)
    # Simple bold parsing
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = p.add_run(part[2:-2])
            run.bold = True
        else:
            # Simple italic parsing inside non-bold
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
    
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(13)

    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    is_mermaid = False
    is_plantuml = False
    code_text = ""

    # Simple Table parser variables
    in_table = False
    table = None

    for line in lines:
        line = line.rstrip('\n')
        
        if line.startswith('<a id') or line == '---':
            continue
            
        if line.startswith('```'):
            if not in_code_block:
                in_code_block = True
                is_mermaid = 'mermaid' in line.lower()
                is_plantuml = 'plantuml' in line.lower()
                code_text = ""
            else:
                in_code_block = False
                if is_mermaid or is_plantuml:
                    diag_type = "mermaid" if is_mermaid else "plantuml"
                    img_stream = render_diagram_kroki(code_text.strip(), diag_type)
                    if img_stream:
                        p = doc.add_paragraph()
                        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        p.add_run().add_picture(img_stream, width=Inches(6.0))
                    else:
                        add_formatted_paragraph(doc, "[Lỗi khi tải ảnh biểu đồ từ Internet]")
                else:
                    p = doc.add_paragraph()
                    run = p.add_run(code_text.strip())
                    run.font.name = 'Courier New'
                    run.font.size = Pt(10)
            continue
            
        if in_code_block:
            code_text += line + "\n"
            continue

        # Handle Markdown Tables
        if line.strip().startswith('|') and line.strip().endswith('|'):
            cells = [cell.strip() for cell in line.strip().split('|')[1:-1]]
            
            if '---' in cells[0]: # Separator line
                continue
                
            if not in_table:
                in_table = True
                # Create table
                table = doc.add_table(rows=1, cols=len(cells))
                table.style = 'Table Grid'
                hdr_cells = table.rows[0].cells
                for i, cell in enumerate(cells):
                    hdr_cells[i].text = cell.replace('**', '')
            else:
                row_cells = table.add_row().cells
                for i, cell in enumerate(cells):
                    if i < len(row_cells):
                        row_cells[i].text = cell.replace('**', '')
            continue
        else:
            if in_table:
                in_table = False
                doc.add_paragraph() # Add space after table

        # Clean markdown links
        clean_line = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', line)
        
        if clean_line.startswith('# '):
            doc.add_heading(clean_line[2:], level=1)
        elif clean_line.startswith('## '):
            doc.add_heading(clean_line[3:], level=2)
        elif clean_line.startswith('### '):
            doc.add_heading(clean_line[4:], level=3)
        elif clean_line.startswith('#### '):
            doc.add_heading(clean_line[5:], level=4)
        elif clean_line.strip().startswith('- '):
            add_formatted_paragraph(doc, clean_line.strip()[2:], style='List Bullet')
        elif clean_line.strip().startswith('1. ') or clean_line.strip().startswith('2. ') or clean_line.strip().startswith('3. ') or clean_line.strip().startswith('4. ') or clean_line.strip().startswith('5. '):
            add_formatted_paragraph(doc, clean_line.strip()[3:], style='List Number')
        elif clean_line.strip() == '':
            pass
        else:
            add_formatted_paragraph(doc, clean_line)

    if in_table: # In case document ends with table
        pass

    doc.save(docx_file)
    print(f"File created")

if __name__ == '__main__':
    create_docx('TAI_LIEU_THIET_KE_V3.md', 'TAI_LIEU_THIET_KE_V3.docx')
