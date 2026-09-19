import os
import subprocess

edge_bin = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_bin):
    edge_bin = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

html_path = os.path.abspath("scratch/test_render.html")
pdf_path = os.path.abspath("scratch/test_render.pdf")
user_data_dir = os.path.abspath("scratch/browser_profile")

cmd = [
    edge_bin,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-software-rasterizer",
    f"--user-data-dir={user_data_dir}",
    "--run-all-compositor-stages-before-draw",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    f"file:///{html_path.replace(os.sep, '/')}"
]

print("Executing:", cmd)
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
print("PDF exists:", os.path.exists(pdf_path))
if os.path.exists(pdf_path):
    print("PDF size bytes:", os.path.getsize(pdf_path))
else:
    print("Stderr:", res.stderr)
