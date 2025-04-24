const getExtensionToken = () => {
    return new Promise(resolve => {
        chrome.storage.local.get(['token'], result => resolve(result.token || null));
    });
};

const refreshToken = async () => {
    try {
        const token = await getExtensionToken();
        const response = await fetch('http://localhost:3002/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Extension-Request': 'true',
            },
            credentials: 'include',
        });

        if (!response.ok) throw new Error('Refresh failed');
        const data = await response.json();
        if (!data.token) throw new Error('No token in response');

        await chrome.storage.local.set({ token: data.token });
        return data.token;
    } catch (error) {
        console.error('Token refresh failed:', error);
        chrome.storage.local.remove(['token']);
        return null;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const authSection = document.getElementById('authSection');
    const subscribeSection = document.getElementById('subscribeSection');
    const jobSection = document.getElementById('jobSection');
    const loginLink = document.getElementById('loginLink');
    const subscribeLink = document.getElementById('subscribeLink');
    const delegateButton = document.getElementById('delegateJob');
    const recommendButton = document.getElementById('recommendJobs');

    const getCSRFToken = async () => {
        try {
            const token = await getExtensionToken();
            const response = await fetch('http://localhost:3002/api/csrf-token', {
                credentials: 'include',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            return (await response.json()).csrfToken;
        } catch (error) {
            console.error('CSRF Token Error:', error);
            throw error;
        }
    };

    const checkAuthStatus = async () => {
        try {
            const token = await getExtensionToken();
            if (!token) return { isAuthenticated: false };
            const response = await fetch('http://localhost:3002/api/auth/session', {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Auth check failed');
            return { ...(await response.json()), isAuthenticated: true };
        } catch (error) {
            console.error('Auth check failed:', error);
            chrome.storage.local.remove(['token']);
            return { isAuthenticated: false };
        }
    };

    const getValidToken = async () => {
        let token = await getExtensionToken();
        if (token) {
            try {
                const decoded = jwt_decode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    console.log('Token expired, refreshing...');
                    token = await refreshToken();
                }
            } catch (error) {
                console.error('Error decoding token:', error);
                token = await refreshToken();
            }
        }
        if (!token) {
            console.log('No token available, redirecting to login');
            chrome.tabs.create({ url: 'http://localhost:3000/login' });
            throw new Error('No valid token');
        }
        return token;
    };

    const delegateJob = async () => {
        try {
            const csrfToken = await getCSRFToken();
            const token = await getValidToken();
            const jobData = {
                title: document.getElementById('jobTitle').value.trim(),
                company: document.getElementById('companyName').value.trim(),
                link: document.getElementById('jobLink').value.trim(),
                description: document.getElementById('jobDescription').value.trim(),
            };

            if (Object.values(jobData).some(v => !v)) {
                alert('⚠️ Please fill in all job details before delegating.');
                return;
            }

            const response = await fetch('http://localhost:3002/api/jobs/delegate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(jobData),
                credentials: 'include',
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Delegation failed');
            alert('✅ Job delegated successfully!');
            window.close();
        } catch (error) {
            console.error('Delegation error:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const handleRecommendations = async () => {
        try {
            const token = await getValidToken();
            const response = await fetch('http://localhost:3002/api/jobs/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    user_profile: {
                        skills: ["javascript", "react"], // Fetch from user profile ideally
                        experience_level: "mid",
                        needs_sponsorship: false
                    },
                    filters: { page: 1, per_page: 10 }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Recommendation failed');
            }

            const data = await response.json();
            const recommendedJobs = data.recommendations || [];
            if (!recommendedJobs.length) {
                alert('No matching jobs found');
                return;
            }

            jobSection.innerHTML = '<h3>Recommended Jobs</h3>';
            recommendedJobs.forEach(job => {
                const jobCard = document.createElement('div');
                jobCard.className = 'job-card';
                jobCard.innerHTML = `
                    <strong>${job.title}</strong>
                    <div class="company">${job.company}</div>
                    ${job.matchScore ? `<div class="match">Match: ${job.matchScore}%</div>` : ''}
                    <a href="${job.link}" target="_blank" class="apply-btn">View Job</a>
                `;
                jobSection.appendChild(jobCard);
            });
        } catch (error) {
            console.error('Recommendation error:', error);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const initializeUI = async () => {
        const authData = await checkAuthStatus();
        if (authData.isAuthenticated) {
            authSection.classList.add('hidden');
            if (!authData.user.subscriptionStatus && authData.user.credits <= 0) {
                subscribeSection.classList.remove('hidden');
            } else {
                jobSection.classList.remove('hidden');
                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'extractJobDetails' }, response => {
                        if (response && !response.error) {
                            document.getElementById('jobTitle').value = response.title || '';
                            document.getElementById('companyName').value = response.company || '';
                            document.getElementById('jobLink').value = response.link || '';
                            document.getElementById('jobDescription').value = response.description || '';
                        }
                    });
                });
            }
        }
    };

    await initializeUI();

    loginLink.addEventListener('click', e => {
        e.preventDefault();
        chrome.tabs.create({ url: 'http://localhost:3000/login' });
    });

    subscribeLink.addEventListener('click', e => {
        e.preventDefault();
        chrome.tabs.create({ url: 'http://localhost:3000/subscription' });
    });

    delegateButton.addEventListener('click', delegateJob);
    recommendButton.addEventListener('click', handleRecommendations);
});