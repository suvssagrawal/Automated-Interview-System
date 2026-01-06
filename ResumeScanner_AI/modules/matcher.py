import csv
from typing import List, Dict

def load_jobs(csv_path: str) -> List[Dict]:
    jobs = []
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            row['skills'] = [s.strip() for s in row['skills'].split(',')]
            jobs.append(row)
    return jobs

def match_skills(candidate_skills: List[str], job_skills: List[str]) -> float:
    if not job_skills:
        return 0.0
    matched = set(candidate_skills) & set(job_skills)
    return len(matched) / len(job_skills)

def rank_jobs(candidate_skills: List[str], jobs: List[Dict], top_n: int = 5) -> List[Dict]:
    scored = []
    for job in jobs:
        score = match_skills(candidate_skills, job['skills'])
        scored.append({**job, 'score': score})
    scored.sort(key=lambda x: x['score'], reverse=True)
    return scored[:top_n]
