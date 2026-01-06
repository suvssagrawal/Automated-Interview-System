import os
import csv
import re
from modules.pdf_parser import extract_text_from_pdf

def extract_text_from_docx(docx_path):
    try:
        import docx
    except Exception:
        return ''
    doc = docx.Document(docx_path)
    return "\n".join([para.text for para in doc.paragraphs])

def read_allcategories(path):
    """Read categories from CSV file"""
    cats = []
    if not os.path.exists(path):
        return cats
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)
        if not rows:
            return cats
        start = 0
        if rows[0] and any('category' in c.lower() for c in rows[0] if c):
            start = 1
        for r in rows[start:]:
            for cell in r:
                if cell and cell.strip():
                    cats.append(cell.strip())
                    break
    return cats

def extract_keywords_from_category(category):
    """Extract main keywords from category name"""
    # Remove text in parentheses and split into keywords
    clean_category = re.sub(r'\([^)]*\)', '', category)
    
    # Split by common separators and get individual words
    keywords = []
    
    # Split by common separators
    parts = re.split(r'[/&,]|\band\b', clean_category)
    for part in parts:
        # Extract individual words (3+ letters)
        words = re.findall(r'\b[a-zA-Z]{3,}\b', part)
        keywords.extend(words)
    
    # Remove duplicates and common words
    common_words = {'the', 'and', 'for', 'with', 'using', 'via'}
    keywords = [kw.lower() for kw in keywords if kw.lower() not in common_words]
    
    return list(set(keywords))  # Remove duplicates

def scan_single_resume(resume_path, allcats):
    """Scan ONLY ONE specific resume file"""
    ext = os.path.splitext(resume_path)[1].lower()
    if ext == '.pdf':
        text = extract_text_from_pdf(resume_path)
    elif ext == '.docx':
        text = extract_text_from_docx(resume_path)
    elif ext == '.txt':
        with open(resume_path, encoding='utf-8', errors='ignore') as f:
            text = f.read()
    else:
        text = ''
    
    if not text:
        print(f"ERROR: No text extracted from {resume_path}")
        return []
    
    text_lower = text.lower()
    found_categories = []
    
    print(f"Scanning: {os.path.basename(resume_path)}")
    print(f"Text length: {len(text)} characters")
    
    # For each category, check if its keywords appear in resume
    for category in allcats:
        keywords = extract_keywords_from_category(category)
        
        # Check if enough keywords from this category appear in resume
        matching_keywords = 0
        for keyword in keywords:
            if keyword in text_lower:
                matching_keywords += 1
                #print(f"  Matched: '{keyword}' → '{category}'")
        
        # If at least 1 keyword matches, consider it a match
        if matching_keywords >= 1:
            found_categories.append(category)
    
    print(f"Found {len(found_categories)} categories: {found_categories}")
    return found_categories

def main(specific_resume=None):
    """Main function - can scan all resumes or just one specific resume"""
    base_dir = os.path.dirname(__file__)
    resumes_dir = os.path.join(base_dir, 'resumes')
    allcats_path = os.path.join(base_dir, 'allcategories.csv')
    output_csv = os.path.join(base_dir, 'categories_output.csv')

    # Load categories
    allcats = read_allcategories(allcats_path)
    if not allcats:
        print('No categories loaded from', allcats_path)
        return
    
    print(f"Loaded {len(allcats)} categories from allcategories.csv")
    
    # If specific resume provided, scan only that one
    if specific_resume:
        if os.path.exists(specific_resume):
            matched_categories = scan_single_resume(specific_resume, allcats)
        else:
            print(f"ERROR: Resume file not found: {specific_resume}")
            matched_categories = []
    else:
        # Scan all resumes in folder (old behavior)
        matched_categories = []
        if os.path.isdir(resumes_dir):
            for filename in os.listdir(resumes_dir):
                filepath = os.path.join(resumes_dir, filename)
                if not os.path.isfile(filepath):
                    continue
                if not filename.lower().endswith(('.pdf', '.docx', '.txt')):
                    continue
                
                matched = scan_single_resume(filepath, allcats)
                for category in matched:
                    if category not in matched_categories:
                        matched_categories.append(category)

    # Write output
    with open(output_csv, 'w', newline='', encoding='utf-8') as out:
        writer = csv.writer(out)
        writer.writerow(['Category'])
        for category in matched_categories:
            writer.writerow([category])

    print(f'Wrote {len(matched_categories)} matched categories to {output_csv}')
    return matched_categories

if __name__ == '__main__':
    # Check if a specific file was provided as argument
    import sys
    if len(sys.argv) > 1:
        # Scan only the specific file provided
        specific_file = sys.argv[1]
        print(f"Scanning specific file: {specific_file}")
        main(specific_resume=specific_file)
    else:
        # Scan all resumes (old behavior for backward compatibility)
        print("Scanning all resumes in folder")
        main()