# ml_service/app/test_scrapper.py
import asyncio
from main import JobRecommender

async def test_scraper():
    recommender = JobRecommender()
    user_profile = {"skills": ["python"]}
    filters = {"location": "United States", "timeFrame": "7d"}
    await recommender.fetch_jobs(user_profile, filters)
    print("Scraping test completed!")

if __name__ == "__main__":
    asyncio.run(test_scraper())