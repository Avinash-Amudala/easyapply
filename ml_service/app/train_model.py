import pickle
from sentence_transformers import SentenceTransformer
from main import fetch_jobs_from_adzuna, fetch_jobs_from_linkedin, is_us_location
import asyncio
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def train_model():
    model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
    queries = ["software engineer", "data scientist", "product manager", "devops engineer", "python programmer"]
    all_jobs = []

    for query in queries:
        adzuna_jobs_task = fetch_jobs_from_adzuna(query, limit=50)
        linkedin_jobs_task = fetch_jobs_from_linkedin(query, "United States", page=1, per_page=20, min_jobs=150)  # Increased for better training

        adzuna_jobs, (linkedin_jobs, linkedin_total) = await asyncio.gather(
            adzuna_jobs_task,
            linkedin_jobs_task
        )
        all_jobs.extend(adzuna_jobs + linkedin_jobs)
        logger.info(f"Collected for '{query}': {len(linkedin_jobs)} LinkedIn, {len(adzuna_jobs)} Adzuna")

    all_jobs = [job for job in all_jobs if is_us_location(job["location"])]
    logger.info(f"Collected {len(all_jobs)} U.S. jobs for training")

    job_texts = [
        f"{job['title']} at {job['company']} requiring skills: {', '.join(job['skills'])}. "
        f"Experience level: {job['experience_level']}. "
        f"Located in {job['location']}, {'remote' if job['is_remote'] else 'on-site'}."
        for job in all_jobs
    ]
    job_embeddings = model.encode(job_texts, show_progress_bar=True)

    with open('job_embeddings.pkl', 'wb') as f:
        pickle.dump(job_embeddings, f)
    with open('jobs.pkl', 'wb') as f:
        pickle.dump(all_jobs, f)
    logger.info("Model training completed and saved.")

if __name__ == "__main__":
    asyncio.run(train_model())