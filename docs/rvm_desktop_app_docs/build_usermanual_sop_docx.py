import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(f'''<w:tcMar {nsdecls("w")}>
        <w:top w:w="{top}" w:type="dxa"/>
        <w:bottom w:w="{bottom}" w:type="dxa"/>
        <w:left w:w="{left}" w:type="dxa"/>
        <w:right w:w="{right}" w:type="dxa"/>
    </w:tcMar>''')
    tcPr.append(tcMar)

def markdown_to_docx(md_path, docx_path, title_text, subtitle_text):
    doc = Document()
    
    # Page setup - 0.75 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Base Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Segoe UI'
    style_normal.font.size = Pt(10)
    style_normal.font.color.rgb = RGBColor(51, 65, 85) # Slate 700

    # Header / Title Banner Table
    title_table = doc.add_table(rows=1, cols=1)
    title_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    title_cell = title_table.cell(0, 0)
    set_cell_background(title_cell, "073B28") # Deep Forest Eco Green
    set_cell_margins(title_cell, top=300, bottom=300, left=350, right=350)
    
    p = title_cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run_badge = p.add_run("ENVIRONMENTAL SOLUTIONS PVT. LTD • WORLD BANK GROUP\nOFFICIAL KIOSK OPERATIONAL SYSTEM MANUAL\n\n")
    run_badge.font.name = 'Segoe UI'
    run_badge.font.size = Pt(9.5)
    run_badge.font.bold = True
    run_badge.font.color.rgb = RGBColor(74, 222, 128) # Bright Leaf Green
    
    run_title = p.add_run(title_text + "\n")
    run_title.font.name = 'Segoe UI'
    run_title.font.size = Pt(21)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(255, 255, 255)
    
    run_sub = p.add_run(subtitle_text)
    run_sub.font.name = 'Segoe UI'
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(226, 232, 240)

    doc.add_paragraph() # Spacing

    if not os.path.exists(md_path):
        print(f"Error: {md_path} not found.")
        return

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_lines = []
    in_table = False
    table_data = []

    for raw_line in lines:
        line = raw_line.rstrip('\r\n')

        # Check Code block delimiters
        if line.strip().startswith('```'):
            if in_code_block:
                # Flush code block
                in_code_block = False
                block_text = "\n".join(code_lines)
                code_lines = []
                
                tbl = doc.add_table(rows=1, cols=1)
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                c = tbl.cell(0, 0)
                
                is_diagram = any(k in block_text for k in ["RVM MACHINE GUIDE", "ARDUINO UNO", "CHAMBER APERTURE", "RECYCLE PLASTIC"])
                
                if is_diagram:
                    set_cell_background(c, "0F172A") # Dark Navy Slate
                    set_cell_margins(c, top=140, bottom=140, left=180, right=180)
                    cp = c.paragraphs[0]
                    r = cp.add_run(block_text)
                    r.font.name = 'Consolas'
                    r.font.size = Pt(8.0)
                    r.font.color.rgb = RGBColor(56, 189, 248) # Cyan Blue Terminal
                else:
                    set_cell_background(c, "F8FAFC") # Light Slate
                    set_cell_margins(c, top=140, bottom=140, left=180, right=180)
                    cp = c.paragraphs[0]
                    r = cp.add_run(block_text)
                    r.font.name = 'Consolas'
                    r.font.size = Pt(8.5)
                    r.font.color.rgb = RGBColor(30, 41, 59)
                
                doc.add_paragraph()
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Check Table
        if line.strip().startswith('|') and line.strip().endswith('|'):
            cells = [c.strip() for c in line.strip().split('|')[1:-1]]
            if all(set(c).issubset({'-', ':', ' '}) for c in cells):
                continue
            table_data.append(cells)
            in_table = True
            continue
        else:
            if in_table:
                # Flush table
                in_table = False
                if table_data:
                    num_rows = len(table_data)
                    num_cols = max(len(r) for r in table_data)
                    tbl = doc.add_table(rows=num_rows, cols=num_cols)
                    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                    
                    for r_idx, row in enumerate(table_data):
                        for c_idx, val in enumerate(row):
                            if c_idx < num_cols:
                                cell = tbl.cell(r_idx, c_idx)
                                cell.text = val
                                set_cell_margins(cell, top=70, bottom=70, left=110, right=110)
                                p = cell.paragraphs[0]
                                if p.runs:
                                    p.runs[0].font.name = 'Segoe UI'
                                    p.runs[0].font.size = Pt(9)
                                    if r_idx == 0:
                                        set_cell_background(cell, "073B28") # Deep Green Header
                                        p.runs[0].font.bold = True
                                        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
                                    else:
                                        bg = "F1F5F9" if r_idx % 2 == 1 else "FFFFFF"
                                        set_cell_background(cell, bg)
                                        p.runs[0].font.color.rgb = RGBColor(30, 41, 59)
                    doc.add_paragraph()
                table_data = []

        # Empty lines
        if not line.strip():
            continue

        # Headings
        if line.startswith('# '):
            h_text = line[2:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(20)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h_text)
            run.font.name = 'Segoe UI'
            run.font.size = Pt(17)
            run.font.bold = True
            run.font.color.rgb = RGBColor(7, 59, 40) # Forest Green
            continue
        elif line.startswith('## '):
            h_text = line[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h_text)
            run.font.name = 'Segoe UI'
            run.font.size = Pt(13.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(15, 118, 110) # Teal
            continue
        elif line.startswith('### '):
            h_text = line[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h_text)
            run.font.name = 'Segoe UI'
            run.font.size = Pt(11.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(30, 41, 59) # Slate 800
            continue
        elif line.startswith('#### '):
            h_text = line[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(h_text)
            run.font.name = 'Segoe UI'
            run.font.size = Pt(10.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(71, 85, 105)
            continue

        # Horizontal Rule
        if line.strip() in ['---', '***', '___']:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            r = p.add_run("—" * 55)
            r.font.color.rgb = RGBColor(203, 213, 225)
            continue

        # Callouts (> [!WARNING], > [!NOTE], etc)
        if line.startswith('> '):
            callout_text = line[2:].strip()
            tbl = doc.add_table(rows=1, cols=1)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            c = tbl.cell(0, 0)
            set_cell_background(c, "FEF2F2" if "WARNING" in callout_text or "PINCH" in callout_text else "F0FDF4")
            set_cell_margins(c, top=100, bottom=100, left=150, right=150)
            cp = c.paragraphs[0]
            r = cp.add_run("⚠️ " + callout_text.replace("[!WARNING]", "").strip())
            r.font.name = 'Segoe UI'
            r.font.size = Pt(9.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(185, 28, 28) if "WARNING" in callout_text or "PINCH" in callout_text else RGBColor(21, 128, 61)
            doc.add_paragraph()
            continue

        # Bullet lists
        if line.strip().startswith('- ') or line.strip().startswith('* '):
            b_text = line.strip()[2:]
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(2)
            parse_inline_formatting(p, b_text)
            continue

        # Numbered lists
        match_num = re.match(r'^(\d+)\.\s+(.*)$', line.strip())
        if match_num:
            num_idx = match_num.group(1)
            item_text = match_num.group(2)
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_after = Pt(2)
            parse_inline_formatting(p, f"{num_idx}. {item_text}")
            continue

        # Regular Paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        parse_inline_formatting(p, line)

    # Save document
    doc.save(docx_path)
    print(f"Successfully generated executive docx: {docx_path}")

def parse_inline_formatting(paragraph, text):
    parts = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            r = paragraph.add_run(part[2:-2])
            r.bold = True
            r.font.color.rgb = RGBColor(15, 23, 42)
        elif part.startswith('*') and part.endswith('*'):
            r = paragraph.add_run(part[1:-1])
            r.italic = True
        elif part.startswith('`') and part.endswith('`'):
            r = paragraph.add_run(part[1:-1])
            r.font.name = 'Consolas'
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(15, 118, 110)
        else:
            paragraph.add_run(part)

if __name__ == '__main__':
    base_dir = r"d:\GIT-HUB\RVM-dash\docs\rvm_desktop_app_docs"
    md_file = os.path.join(base_dir, "RVM_Desktop_App_User_Manual_and_SOP.md")
    docx_file = os.path.join(base_dir, "RVM_Desktop_App_User_Manual_and_SOP.docx")
    
    markdown_to_docx(
        md_file,
        docx_file,
        "RVM MACHINE USER MANUAL & STANDARD OPERATING PROCEDURES",
        "Comprehensive Kiosk Citizen Manual, Screen-by-Screen Guides & Standard Operating Procedures (SOP)"
    )
