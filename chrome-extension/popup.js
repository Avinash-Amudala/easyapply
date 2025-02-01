document.addEventListener('DOMContentLoaded', async () => {
    const authSection = document.getElementById('authSection');
    const jobSection = document.getElementById('jobSection');
    const loginLink = document.getElementById('loginLink');
    const delegateButton = document.getElementById('delegateJob');

    const isAuthenticated = await checkUserAuthentication();
    if (isAuthenticated) {
        authSection.classList.add('hidden');
        jobSection.classList.remove('hidden');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'extractJobDetails' }, (response) => {
                    if (response && !response.error) {
                        document.getElementById('jobTitle').value = response.title || '';
                        document.getElementById('companyName').value = response.company || '';
                        document.getElementById('jobLink').value = response.link || '';
                        document.getElementById('jobDescription').value = response.description || '';
                    } else {
                        console.error('Error fetching job details:', response?.error);
                        alert(response?.error || 'Failed to fetch job details.');
                    }
                });
            }
        });

        delegateButton.addEventListener('click', async () => {
            const jobData = {
                title: document.getElementById('jobTitle').value,
                company: document.getElementById('companyName').value,
                link: document.getElementById('jobLink').value,
                description: document.getElementById('jobDescription').value,
            };

            try {
                const response = await fetch('http://localhost:5001/api/jobs/delegate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(jobData),
                });
                if (response.ok) {
                    alert('Job delegated successfully!');
                } else {
                    alert('Failed to delegate job.');
                }
            } catch (error) {
                console.error('Error delegating job:', error);
                alert('An error occurred. Please try again.');
            }
        });
    } else {
        authSection.classList.remove('hidden');
        jobSection.classList.add('hidden');
    }

    loginLink.addEventListener('click', () => {
        window.open('http://localhost:3000/login', '_blank');
    });
});

async function checkUserAuthentication() {
    try {
        const response = await fetch('http://localhost:5001/api/auth/status');
        if (!response.ok) {
            throw new Error('Authentication status fetch failed.');
        }
        const data = await response.json();
        return data.isAuthenticated && data.isSubscribed;
    } catch (error) {
        console.error('Error checking authentication:', error.message);
        return false;
    }
}
