import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont('NotoNastaliq', 'docs/user_manuals/fonts/NotoNastaliqUrdu-Regular.ttf'))

reshaper = arabic_reshaper.ArabicReshaper()

def u(text):
    return get_display(reshaper.reshape(text))

doc = SimpleDocTemplate("scratch/test_urdu.pdf", pagesize=A4)
styles = getSampleStyleSheet()

urdu_style = ParagraphStyle(
    'Urdu',
    fontName='NotoNastaliq',
    fontSize=13,
    leading=24,
    alignment=2 # Right aligned
)

story = [
    Paragraph(u("پیکو ڈراپ ریورس وینڈنگ مشین (RVM) کا تفصیلی ورک فلو"), urdu_style),
    Spacer(1, 10),
    Paragraph(u("یہ مشین پلاسٹک کی بوتل، میٹل کین اور کاغذ کے ڈبے خودکار طریقے سے الگ کرتی ہے۔"), urdu_style),
    Spacer(1, 10),
    Paragraph(u("پلاسٹک چیمبر: الٹراسونک سینسرز بوتل کا سائز (چھوٹی، درمیانی، بڑی) ناپتے ہیں۔"), urdu_style),
]

doc.build(story)
print("Test Urdu PDF built successfully!")
