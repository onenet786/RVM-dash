"""Render every *.html guide in this folder to PDF with Microsoft Edge (headless).
Usage:  py docs/user-guides/build_guides.py   (run from repo root or from this folder)
"""
import os, subprocess, sys, glob, time

HERE = os.path.dirname(os.path.abspath(__file__))
EDGE = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"]
browser = next((p for p in EDGE if os.path.exists(p)), None)
if not browser:
    sys.exit("No Edge/Chrome found")

targets = sys.argv[1:] or sorted(glob.glob(os.path.join(HERE, "*.html")))
for html in targets:
    html = os.path.abspath(html)
    pdf = os.path.splitext(html)[0] + ".pdf"
    url = "file:///" + html.replace("\\", "/")
    cmd = [browser, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
           "--run-all-compositor-stages-before-draw", "--virtual-time-budget=20000",
           f"--print-to-pdf={pdf}", url]
    t = time.time()
    subprocess.run(cmd, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ok = os.path.exists(pdf) and os.path.getsize(pdf) > 1000
    print(f"{'OK ' if ok else 'FAIL'} {os.path.basename(pdf)} ({os.path.getsize(pdf) if ok else 0} bytes, {time.time()-t:.1f}s)")
