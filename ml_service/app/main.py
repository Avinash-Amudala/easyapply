from dotenv import load_dotenv
load_dotenv()

import os
import logging
import asyncio
import re
from datetime import datetime, timedelta
import pytz
from typing import Optional, List, Dict
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import requests
from cachetools import TTLCache
import pickle
import time

# Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3002",
    "chrome-extension://kbkjjklbejbbheenhldadfbllnodkmeh"
]
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-CSRF-Token", "Authorization"],
)

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB
mongo_uri = os.getenv("MONGO_URI", "mongodb+srv://user:pass@cluster0.mongodb.net/alpins?retryWrites=true&w=majority")
mongo_client = MongoClient(mongo_uri)
db = mongo_client["alpins"]
linkedin_cache_collection = db.linkedin_jobs_cache

# API Credentials
ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "2f0765478amsh2400f8c2fdf0379p154522jsnab61552dd4e1")

# Sentence Transformer
sbert_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

# Models
class UserProfile(BaseModel):
    skills: List[str] = []
    experience_level: Optional[str] = "mid"
    needs_sponsorship: Optional[bool] = False
    preferred_locations: List[str] = []
    min_salary: Optional[float] = 0.0
    remote_preference: Optional[bool] = False
    desired_job_role: Optional[str] = ""

class Filters(BaseModel):
    location: Optional[str] = None
    experienceLevel: Optional[str] = None
    remoteOnly: Optional[bool] = False
    minSalary: Optional[float] = 0.0
    page: Optional[int] = 1
    per_page: Optional[int] = 20
    sort_by: Optional[str] = "posted_date"
    date_posted: Optional[str] = None

class RecommendationRequest(BaseModel):
    user_profile: UserProfile
    filters: Optional[Filters] = None

# Helper Functions
def determine_experience_level(description: str, title: str) -> str:
    text = (title + " " + description).lower()
    if any(keyword in text for keyword in ["senior", "lead", "principal", "staff", "expert", "architect", "5+ years", "6+ years", "7+ years"]):
        return "senior"
    elif any(keyword in text for keyword in ["junior", "entry-level", "intern", "trainee", "associate", "graduate", "0-2 years", "less than 2 years"]):
        return "entry"
    elif any(keyword in text for keyword in ["mid-level", "intermediate", "2-5 years", "3+ years"]):
        return "mid"
    matches = re.findall(r'(\d+)(?:[-+]\d+)?\s*years?', text)
    if matches:
        years = [int(match) for match in matches]
        max_years = max(years)
        if max_years >= 5:
            return "senior"
        elif max_years >= 2:
            return "mid"
        else:
            return "entry"
    return "mid"

def check_sponsorship(description: str) -> bool:
    description = description.lower()
    return any(keyword in description for keyword in ["sponsorship", "visa", "h1b", "work authorization provided"])

def extract_skills(description: str) -> List[str]:
    common_skills = ["python", "java", "javascript", "sql", "react", "aws", "docker", "kubernetes", "machine learning", "data analysis"]
    description = description.lower()
    return [skill for skill in common_skills if skill in description]

def is_us_location(location: str) -> bool:
    if not location:
        return False
    location = location.lower()
    if "united states" in location or "usa" in location or "u.s." in location:
        return True
    states = {
        "al": "alabama", "ak": "alaska", "az": "arizona", "ar": "arkansas", "ca": "california",
        "co": "colorado", "ct": "connecticut", "de": "delaware", "fl": "florida", "ga": "georgia",
        "hi": "hawaii", "id": "idaho", "il": "illinois", "in": "indiana", "ia": "iowa",
        "ks": "kansas", "ky": "kentucky", "la": "louisiana", "me": "maine", "md": "maryland",
        "ma": "massachusetts", "mi": "michigan", "mn": "minnesota", "ms": "mississippi",
        "mo": "missouri", "mt": "montana", "ne": "nebraska", "nv": "nevada", "nh": "new hampshire",
        "nj": "new jersey", "nm": "new mexico", "ny": "new york", "nc": "north carolina",
        "nd": "north dakota", "oh": "ohio", "ok": "oklahoma", "or": "oregon", "pa": "pennsylvania",
        "ri": "rhode island", "sc": "south carolina", "sd": "south dakota", "tn": "tennessee",
        "tx": "texas", "ut": "utah", "vt": "vermont", "va": "virginia", "wa": "washington",
        "wv": "west virginia", "wi": "wisconsin", "wy": "wyoming"
    }
    for abbr, full in states.items():
        if abbr in location or full in location:
            return True
    usa_cities = ["new york", "los angeles", "chicago", "houston", "phoenix", "philadelphia", "san antonio", "san diego", "dallas", "san jose"]
    if any(city in location for city in usa_cities):
        return True
    pattern = r'\b[a-zA-Z\s]+,\s*[a-zA-Z]{2}\b'
    if re.search(pattern, location) and not any(country in location for country in ["india", "vietnam", "italy"]):
        return True
    logger.debug(f"Location rejected as non-USA: {location}")
    return False

def parse_salary(salary_str: str) -> float:
    if not salary_str or "not listed" in salary_str.lower():
        return 0.0
    # Remove dollar signs, commas, and extra whitespace, then lowercase
    salary_str = salary_str.replace("$", "").replace(",", "").lower().strip()
    # Match patterns like "50000", "50k", "50000-60000", "50k-60k", "50 per hour" (assuming annual unless specified)
    match = re.search(r'(\d+\.?\d*)\s*(k)?\s*(?:-\s*(\d+\.?\d*)\s*(k)?)?(?:\s*(?:per\s*hour|hourly))?', salary_str)
    if match:
        low = float(match.group(1))
        if match.group(2):  # 'k' for thousands
            low *= 1000
        # Check if it's hourly and convert to annual (assuming 40 hours/week, 52 weeks/year)
        if "per hour" in salary_str or "hourly" in salary_str:
            low *= 40 * 52
        if match.group(3):  # Range present
            high = float(match.group(3))
            if match.group(4):  # 'k' for high end
                high *= 1000
            if "per hour" in salary_str or "hourly" in salary_str:
                high *= 40 * 52
            return (low + high) / 2
        return low
    return 0.0

def extract_salary_from_description(description: str) -> str:
    if not description:
        return ""
    # Match salary with or without keywords
    salary_patterns = (
        r'(?:salary|compensation|pay|earn)?\s*\$?'  # Optional keyword
        r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.?\d*k)'  # Low end: $50000, 50k
        r'(?:\s*[-–—]\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.?\d*k))?'  # Optional high end
        r'(?:\s*(per\s*(hour|year)|hourly|annually))?'  # Optional period
    )
    matches = re.findall(salary_patterns, description, re.IGNORECASE)
    if matches:
        match = matches[0]
        low = match[0]
        high = match[1] if match[1] else ""
        period = match[2] if match[2] else ""
        return f"{low}{' - ' + high if high else ''} {period}".strip()
    return ""

# Job Fetching Functions
async def fetch_jobs_from_adzuna(query: str, limit: int = 50):
    location = "United States"
    try:
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_APP_KEY,
            "what": query,
            "where": location,
            "results_per_page": min(limit, 50),
            "content-type": "application/json"
        }
        logger.info(f"Fetching Adzuna jobs: query={query}, location={location}, limit={limit}")
        response = requests.get("https://api.adzuna.com/v1/api/jobs/us/search/1", params=params)
        response.raise_for_status()
        jobs = response.json().get("results", [])
        processed_jobs = []
        for job in jobs[:limit]:
            description = job.get("description", "")
            title = job.get("title", "")
            posted_date_str = job.get("created", "")
            posted_date = (
                datetime.fromisoformat(posted_date_str.replace("Z", "+00:00"))
                if posted_date_str
                else datetime.now(pytz.utc)
            )
            salary = float(job.get("salary_max") or job.get("salary_min") or 0)
            job_location = job.get("location", {}).get("display_name", location)
            if not is_us_location(job_location):
                logger.debug(f"Filtered out non-USA Adzuna job: {title} at {job_location}")
                continue
            processed_job = {
                "title": title,
                "link": job.get("redirect_url", ""),
                "company": job.get("company", {}).get("display_name", "Unknown"),
                "posted_date": posted_date,
                "location": job_location,
                "skills": job.get("skill_tags", []) or extract_skills(description),
                "salary": salary,
                "is_remote": "remote" in (job.get("category", {}).get("label", "") + description).lower(),
                "sponsorship_available": check_sponsorship(description),
                "experience_level": determine_experience_level(description, title),
                "description": description,
                "source": "adzuna"
            }
            processed_jobs.append(processed_job)
        logger.info(f"Fetched {len(processed_jobs)} U.S. jobs from Adzuna")
        return processed_jobs
    except requests.exceptions.RequestException as e:
        logger.error(f"Adzuna API request failed: {e}")
        return []

async def fetch_jobs_from_linkedin(query: str, location: str, page: int = 1, per_page: int = 20, min_jobs: int = 100, retries: int = 3, backoff_factor: float = 4.0) -> tuple[List[Dict], int]:
    url = "https://linkedin-jobs-search.p.rapidapi.com/"
    headers = {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "linkedin-jobs-search.p.rapidapi.com",
        "Content-Type": "application/json"
    }
    all_jobs = []
    current_page = page
    max_pages = 50
    request_delay = 4.0

    cache_key = f"{query}_{location}_{page}"
    cached_jobs = linkedin_cache_collection.find_one({"cache_key": cache_key, "timestamp": {"$gt": datetime.now(pytz.utc) - timedelta(hours=1)}})
    if cached_jobs:
        logger.info(f"Using cached LinkedIn jobs for query={query}, page={page}")
        for job in cached_jobs["jobs"]:
            if isinstance(job["posted_date"], datetime) and job["posted_date"].tzinfo is None:
                job["posted_date"] = job["posted_date"].replace(tzinfo=pytz.utc)
        return cached_jobs["jobs"], cached_jobs["total"]

    try:
        start_time = time.time()
        while len(all_jobs) < min_jobs and current_page <= max_pages:
            elapsed_time = time.time() - start_time
            if elapsed_time > 50:  # Leave 10s buffer
                logger.warning(f"Approaching timeout after {elapsed_time:.1f}s, stopping fetch at {len(all_jobs)} jobs")
                break

            for attempt in range(retries):
                try:
                    payload = {
                        "search_terms": query,
                        "location": location if location else "United States",
                        "page": str(current_page),
                        "fetch_full_text": "yes"
                    }
                    logger.info(f"Fetching LinkedIn jobs: query={query}, location={location}, page={current_page}, attempt={attempt + 1}")
                    response = requests.post(url, json=payload, headers=headers, timeout=10)
                    response.raise_for_status()
                    jobs = response.json()

                    if not jobs:
                        logger.info(f"No more jobs on page {current_page}")
                        break

                    for job in jobs:
                        job_location = job.get("job_location", "United States")
                        if not is_us_location(job_location):
                            logger.debug(f"Filtered out non-USA LinkedIn job: {job.get('job_title', 'Unknown')} at {job_location}")
                            continue
                        description = job.get("job_description", job.get("description", "")) or ""
                        title = job.get("job_title", "")
                        posted_date_str = job.get("posted_date", "")
                        try:
                            posted_date = datetime.strptime(posted_date_str, "%Y-%m-%d").replace(tzinfo=pytz.utc)
                        except (ValueError, TypeError):
                            posted_date = datetime.now(pytz.utc)
                        salary_str = job.get("salary", "")
                        if not salary_str:  # If no salary field, try extracting from description
                            salary_str = extract_salary_from_description(description)
                        salary = parse_salary(salary_str)
                        processed_job = {
                            "title": title,
                            "link": job.get("linkedin_job_url_cleaned", job.get("job_url", "")),
                            "company": job.get("company_name", "Unknown"),
                            "posted_date": posted_date,
                            "location": job_location,
                            "skills": extract_skills(description),
                            "salary": salary,
                            "is_remote": "remote" in description.lower(),
                            "sponsorship_available": check_sponsorship(description),
                            "experience_level": determine_experience_level(description, title),
                            "description": description,
                            "source": "linkedin"
                        }
                        all_jobs.append(processed_job)

                    all_jobs.sort(key=lambda x: x["posted_date"], reverse=True)
                    logger.info(f"Sorted {len(all_jobs)} LinkedIn jobs by posted_date descending")

                    logger.info(f"Fetched {len(jobs)} jobs from LinkedIn page {current_page}, total collected: {len(all_jobs)}")
                    current_page += 1
                    time.sleep(request_delay)
                    break
                except requests.exceptions.HTTPError as e:
                    if response.status_code == 429:
                        wait_time = backoff_factor ** attempt
                        logger.warning(f"Rate limit hit (429). Retrying in {wait_time} seconds, attempt {attempt + 1}/{retries}")
                        time.sleep(wait_time)
                        if attempt == retries - 1:
                            logger.error(f"Max retries reached for LinkedIn API on page {current_page}")
                            break
                    else:
                        logger.error(f"LinkedIn API error: {e}")
                        raise
                except requests.exceptions.Timeout:
                    logger.warning(f"Request timeout on page {current_page}, attempt {attempt + 1}")
                    break
                except Exception as e:
                    logger.error(f"Unexpected error fetching LinkedIn jobs: {e}")
                    break

            if len(all_jobs) >= min_jobs:
                break

        if all_jobs:
            linkedin_cache_collection.update_one(
                {"cache_key": cache_key},
                {
                    "$set": {
                        "jobs": all_jobs[:min_jobs],
                        "total": len(all_jobs),
                        "timestamp": datetime.now(pytz.utc)
                    }
                },
                upsert=True
            )
            logger.info(f"Cached {len(all_jobs)} LinkedIn jobs for query={query}, page={page}")

        start = (page - 1) * per_page
        end = start + per_page
        paginated_jobs = all_jobs[start:end] if page > 1 else all_jobs[:min_jobs]
        return paginated_jobs, len(all_jobs)

    except Exception as e:
        logger.error(f"LinkedIn fetch failed: {str(e)}")
        return [], 0

# JobRecommender
class JobRecommender:
    def __init__(self):
        self.sbert_model = sbert_model
        self.lock = asyncio.Lock()
        self.embedding_cache = TTLCache(maxsize=1000, ttl=3600)
        self.job_embeddings = None
        self.jobs = None
        if os.path.exists('job_embeddings.pkl') and os.path.exists('jobs.pkl'):
            with open('job_embeddings.pkl', 'rb') as f:
                self.job_embeddings = pickle.load(f)
            with open('jobs.pkl', 'rb') as f:
                self.jobs = pickle.load(f)
                for job in self.jobs:
                    if isinstance(job["posted_date"], datetime) and job["posted_date"].tzinfo is None:
                        job["posted_date"] = job["posted_date"].replace(tzinfo=pytz.utc)

    async def recommend(self, user_profile: Dict, filters: Dict) -> tuple[List[Dict], int]:
        if not user_profile.get("skills") and not user_profile.get("desired_job_role"):
            raise HTTPException(status_code=400, detail="At least one skill or desired job role is required")

        query = user_profile.get("desired_job_role", "") or " ".join(user_profile.get("skills", [])[:5])
        location = filters.get("location", "United States")

        adzuna_jobs_task = fetch_jobs_from_adzuna(query, limit=50)
        linkedin_jobs_task = fetch_jobs_from_linkedin(query, location, page=filters.get("page", 1), per_page=filters.get("per_page", 20), min_jobs=100)

        adzuna_jobs, (linkedin_jobs, linkedin_total) = await asyncio.gather(
            adzuna_jobs_task,
            linkedin_jobs_task
        )
        all_jobs = linkedin_jobs + adzuna_jobs
        logger.info(f"Collected: {len(linkedin_jobs)} LinkedIn, {len(adzuna_jobs)} Adzuna jobs")

        for job in all_jobs:
            if isinstance(job["posted_date"], datetime) and job["posted_date"].tzinfo is None:
                job["posted_date"] = job["posted_date"].replace(tzinfo=pytz.utc)

        # Apply default 7-day filter if no date_posted specified
        date_posted = filters.get("date_posted")
        if not date_posted:
            seven_days_ago = datetime.now(pytz.utc) - timedelta(days=7)
            all_jobs = [job for job in all_jobs if job["posted_date"] >= seven_days_ago]
            logger.info(f"Applied default 7-day filter: {len(all_jobs)} jobs remain")
        elif date_posted:
            if date_posted == "24h":
                time_threshold = datetime.now(pytz.utc) - timedelta(hours=24)
            elif date_posted == "7d":
                time_threshold = datetime.now(pytz.utc) - timedelta(days=7)
            elif date_posted == "30d":
                time_threshold = datetime.now(pytz.utc) - timedelta(days=30)
            else:
                time_threshold = None
            if time_threshold:
                all_jobs = [job for job in all_jobs if job["posted_date"] >= time_threshold]
            logger.info(f"After date filter ({date_posted}): {len(all_jobs)} jobs remain")

        user_skills = ", ".join(user_profile.get("skills", [])) or "various skills"
        user_text = (
            f"A {user_profile.get('experience_level', 'mid')} level professional skilled in {user_skills}. "
            f"Seeking a {user_profile.get('desired_job_role', 'any')} position "
            f"{'preferring remote work' if user_profile.get('remote_preference', False) else ''} "
            f"{'requiring visa sponsorship' if user_profile.get('needs_sponsorship', False) else ''}."
        )

        if self.job_embeddings is not None and self.jobs is not None:
            all_jobs.extend(self.jobs)
            job_embeddings = self.job_embeddings.tolist()
        else:
            job_texts = [
                f"{job['title']} at {job['company']} requiring skills: {', '.join(job['skills'])}. "
                f"Experience level: {job['experience_level']}. "
                f"Located in {job['location']}, {'remote' if job['is_remote'] else 'on-site'}."
                for job in all_jobs
            ]
            job_embeddings = await asyncio.to_thread(self.sbert_model.encode, job_texts, show_progress_bar=False)

        user_embedding = await asyncio.to_thread(self.sbert_model.encode, user_text, show_progress_bar=False)
        scores = cosine_similarity([user_embedding], job_embeddings)[0]

        seen_links = set()
        seen_companies = {}
        processed_jobs = []
        user_skills_set = set(user_profile.get("skills", []))

        for idx, job in enumerate(all_jobs):
            if job["link"] in seen_links:
                continue
            seen_links.add(job["link"])

            score = float(scores[idx] * 100)
            job_skills_set = set(job["skills"])
            skill_match = float(len(user_skills_set & job_skills_set) / max(len(user_skills_set), 1) * 50)
            exp_match = 40 if job["experience_level"] == user_profile.get("experience_level", "mid") else 0
            location_match = 15 if any(loc.lower() in job["location"].lower() for loc in user_profile.get("preferred_locations", [])) else 0
            remote_match = 15 if user_profile.get("remote_preference", False) and job["is_remote"] else 0
            sponsorship_match = 15 if user_profile.get("needs_sponsorship", False) and job["sponsorship_available"] else 0
            source_boost = 20 if job["source"] == "linkedin" else 0
            recency_boost = 10 if (datetime.now(pytz.utc) - job["posted_date"]).days <= 3 else 0

            diversity_penalty = min(5 * (seen_companies.get(job["company"], 0)), 20)
            seen_companies[job["company"]] = seen_companies.get(job["company"], 0) + 1

            total_score = float(score + skill_match + exp_match + location_match + remote_match + sponsorship_match + source_boost + recency_boost - diversity_penalty)

            if total_score >= 60:
                processed_jobs.append({
                    **job,
                    "matchScore": total_score,
                    "skill_gaps": list(job_skills_set - user_skills_set),
                    "is_hot": total_score > 90 or (datetime.now(pytz.utc) - job["posted_date"]).total_seconds() / 3600 < 24
                })

        if filters.get("remoteOnly", False):
            processed_jobs = [j for j in processed_jobs if j["is_remote"]]
        if filters.get("minSalary", 0) > 0:
            processed_jobs = [j for j in processed_jobs if j["salary"] >= filters["minSalary"]]
        if filters.get("location"):
            processed_jobs = [j for j in processed_jobs if filters["location"].lower() in j["location"].lower()]
        if filters.get("experienceLevel"):
            processed_jobs = [j for j in processed_jobs if j["experience_level"] == filters["experienceLevel"]]

        sort_by = filters.get("sort_by", "posted_date")
        if sort_by == "posted_date":
            processed_jobs.sort(key=lambda x: x["posted_date"], reverse=True)
        else:
            processed_jobs.sort(key=lambda x: x["matchScore"], reverse=True)

        linkedin_jobs_list = [j for j in processed_jobs if j["source"] == "linkedin"]
        other_jobs = [j for j in processed_jobs if j["source"] != "linkedin"]
        per_page = filters.get("per_page", 20)
        linkedin_min = int(per_page * 0.7)
        final_jobs = linkedin_jobs_list[:linkedin_min] + other_jobs[:(per_page - linkedin_min)]
        total_jobs = linkedin_total + len(adzuna_jobs)

        page = filters.get("page", 1)
        start = (page - 1) * per_page
        end = min(start + per_page, len(final_jobs))
        paginated_jobs = final_jobs[start:end]

        logger.info(f"Returning {len(paginated_jobs)} recommendations (LinkedIn: {len([j for j in paginated_jobs if j['source'] == 'linkedin'])}), total: {total_jobs}")

        recommendations = [{
            "title": job["title"],
            "link": job["link"],
            "posted_date": job["posted_date"].isoformat(),
            "location": job["location"],
            "skills": job["skills"],
            "salary": float(job["salary"]),
            "is_remote": job["is_remote"],
            "experience_level": job["experience_level"],
            "matchScore": float(min(max(round(job["matchScore"], 1), 0), 100)),
            "company": job["company"],
            "description": job["description"],
            "source": job["source"],
            "skill_gaps": job["skill_gaps"],
            "is_hot": job["is_hot"]
        } for job in paginated_jobs]

        return recommendations, total_jobs

recommender = JobRecommender()

# API Endpoints
@app.post("/jobs/recommendations")
async def get_recommendations(request: RecommendationRequest):
    try:
        recommendations, total_jobs = await recommender.recommend(
            request.user_profile.dict(),
            request.filters.dict() if request.filters else {}
        )
        return {
            "recommendations": recommendations,
            "total": total_jobs,
            "page": request.filters.page if request.filters else 1,
            "per_page": request.filters.per_page if request.filters else 20
        }
    except Exception as e:
        logger.error(f"Recommendation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Processing error")

@app.get("/health")
async def health_check():
    try:
        mongo_status = mongo_client.admin.command('ping')['ok'] == 1.0
    except Exception as e:
        logger.error(f"MongoDB connection error: {str(e)}")
        mongo_status = False
    return {
        "status": "healthy" if mongo_status else "unhealthy",
        "mongo_connected": mongo_status
    }