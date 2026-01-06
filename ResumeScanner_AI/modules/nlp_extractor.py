import os
import csv

def extract_skills(text, categories_path='allcategories.csv'):
    """Simple skill extraction - only exact matches from allcategories.csv"""
    # Read categories from CSV
    categories = []
    if os.path.exists(categories_path):
        with open(categories_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if row and row[0].strip() and 'category' not in row[0].lower():
                    categories.append(row[0].strip())
    
    # Simple exact matching
    text_lower = text.lower()
    found_skills = []
    
    for category in categories:
        category_lower = category.lower()
        if category_lower in text_lower:
            found_skills.append(category)
    
    return found_skills