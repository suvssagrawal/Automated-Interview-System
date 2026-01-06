# interview_system_embeddings.py

import pandas as pd
import random
from sentence_transformers import SentenceTransformer, util

# -----------------------------
# Step 1: Load CSV files
# -----------------------------

# Categories to include in the interview (automatic from categories.csv)
categories_df = pd.read_csv("categories.csv")  # Column: Category
chosen_categories = categories_df['Category'].tolist()
print(f"Categories selected for this interview: {chosen_categories}")

# Load questions dataset
questions_df = pd.read_csv("questions.csv")  # Columns: Question Number, Question, Answer1-4, Category, Difficulty

# -----------------------------
# Step 2: Pick questions
# -----------------------------

questions_per_category = 1
interview_questions = pd.DataFrame()

for cat in chosen_categories:
    cat_questions = questions_df[questions_df['Category'] == cat]
    # Pick min(questions_per_category, available questions)
    num_to_pick = min(questions_per_category, len(cat_questions))
    selected = cat_questions.sample(num_to_pick, random_state=42)
    interview_questions = pd.concat([interview_questions, selected])

# Shuffle questions
interview_questions = interview_questions.sample(frac=1, random_state=42).reset_index(drop=True)
print(f"Total questions selected: {len(interview_questions)}")

# -----------------------------
# Step 3: Load sentence embedding model
# -----------------------------

print("\nLoading sentence-transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')  # lightweight, fast
print("Model loaded successfully!\n")

# -----------------------------
# Step 4: Define NLP scoring function
# -----------------------------

def score_answer(user_answer, ref_answers):
    """
    Compares user_answer with 4 reference answers using sentence embeddings.
    Returns 1, 0.5, or 0 marks based on similarity thresholds.
    """
    # Get embeddings
    embeddings = model.encode(ref_answers + [user_answer])
    user_emb = embeddings[-1]
    ref_embs = embeddings[:-1]
    
    # Compute cosine similarity
    sim_scores = [util.cos_sim(user_emb, ref_emb)[0][0].item() for ref_emb in ref_embs]
    max_sim = max(sim_scores)
    
    # Scoring thresholds
    # if max_sim >= 0.8:
    #     return 1
    # elif max_sim >= 0.6:
    #     return 0.5
    # else:
    #     return 0
    return max_sim

# -----------------------------
# Step 5: Conduct interview
# -----------------------------

total_score = 0

print("\n--- Humanless Interview Started ---\n")

for idx, row in interview_questions.iterrows():
    print(f"Q{idx+1}: {row['Question']}")
    user_ans = input("Your Answer: ")
    ref_answers = [row['Answer1'], row['Answer2'], row['Answer3'], row['Answer4']]
    
    score = score_answer(user_ans, ref_answers)
    print(f"Score for this question: {score}\n")
    total_score += score

# -----------------------------
# Step 6: Compute final score
# -----------------------------

final_score = round((total_score / len(interview_questions)) * 10, 2)
print(f"\n--- Interview Completed ---")
print(f"Your Final Score: {final_score} / 10")
