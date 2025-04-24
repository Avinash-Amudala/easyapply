// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getToken') {
        chrome.storage.local.get(['token'], (result) => {
            sendResponse({ token: result.token });
        });
        return true;
    }

    if (request.action === 'extractJobDetails') {
        const jobDetails = extractJobDetails();
        sendResponse(jobDetails);
    }
});

// Function to extract job details from LinkedIn DOM
function extractJobDetails() {
    // Extract job title
    const jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent.trim() ||
        document.querySelector('.jobs-unified-top-card__job-title')?.textContent.trim() ||
        document.querySelector('h1[data-test-job-title]')?.textContent.trim() ||
        'No Title Found';

    // Extract company name
    let companyName = 'No Company Found';
    const companySelectors = [
        '.job-details-jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name span',
        '.job-details-jobs-unified-top-card__company-name span',
        '.jobs-company-name',
        '[data-tracking-control-name="public_jobs_topcard-org-name"]',
        '.jobs-unified-top-card__company-name',
        '.job-details-jobs-unified-top-card__company-name'
    ];

    for (const selector of companySelectors) {
        const element = document.querySelector(selector);
        if (element) {
            companyName = element.textContent.trim();
            break;
        }
    }

    // Extract job link
    const jobLink = window.location.href;

    // Extract job description
    const jobDescriptionElement = document.querySelector('.jobs-description__content') ||
        document.querySelector('.jobs-box__html-content') ||
        document.querySelector('.show-more-less-html__markup') ||
        document.querySelector('.jobs-description-content__text');
    const jobDescription = jobDescriptionElement?.textContent.trim() || 'No Description Found';

    // Extract location
    const locationElement = document.querySelector('.job-details-jobs-unified-top-card__primary-description-without-tagline') ||
        document.querySelector('.jobs-unified-top-card__primary-description') ||
        document.querySelector('.jobs-unified-top-card__bullet');
    const location = locationElement?.textContent.trim() || 'Location not specified';

    // Return extracted details
    return {
        title: jobTitle,
        company: companyName,
        link: jobLink,
        description: jobDescription,
        location: location
    };
}