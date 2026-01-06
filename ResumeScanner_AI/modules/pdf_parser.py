# PDF parser using PyPDF2
try:
    import PyPDF2
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

def extract_text_from_pdf(pdf_path):
    """Extracts all text from a PDF file using PyPDF2."""
    if not HAS_PYPDF2:
        return "PyPDF2 not available"
    
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
        text = f"Error extracting PDF: {e}"
    
    return text