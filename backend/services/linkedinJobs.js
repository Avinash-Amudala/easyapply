import axios from 'axios';

const LINKEDIN_API_KEY = process.env.REACT_APP_LINKEDIN_API_KEY;

export const fetchLiveJobs = async (keywords, location) => {
    try {
        const response = await axios.get(
            'https://api.linkedin.com/v2/job-search', {
                params: {
                    q: keywords,
                    location: location,
                    count: 50
                },
                headers: {
                    'Authorization': `Bearer ${LINKEDIN_API_KEY}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            }
        );
        return response.data.elements.map(job => ({
            id: job.id,
            title: job.title,
            company: job.companyName,
            location: job.location,
            description: job.description,
            link: job.applyUrl,
            postedDate: job.listDate,
            isRemote: job.remote
        }));
    } catch (error) {
        console.error('LinkedIn API Error:', error);
        return [];
    }
};