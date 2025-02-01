chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractJobDetails') {
        try {
            const jobTitle = document.querySelector('h1[data-test-job-title]')?.textContent.trim() ||
                document.querySelector('.t-24.t-bold.inline')?.textContent.trim() || 'No Title Found';

            let companyName = 'No Company Found';
            const companySelectors = [
                '.jobs-unified-top-card__company-name a',
                '.job-details-jobs-unified-top-card__company-name a',
                '.jobs-company-name',
                '[data-tracking-control-name="public_jobs_topcard-org-name"]'
            ];

            for (const selector of companySelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    companyName = element.textContent.trim();
                    break;
                }
            }

            if (companyName === 'No Company Found') {
                const container = document.querySelector('.jobs-unified-top-card__company-name') ||
                    document.querySelector('.job-details-jobs-unified-top-card__company-name');
                companyName = container?.textContent?.trim() || 'No Company Found';
            }

            companyName = companyName.replace(/\s+/g, ' ').replace(/[\u00AD]/g, '');

            const jobLink = window.location.href;

            const jobDescriptionElement = document.querySelector('.jobs-box__html-content') ||
                document.querySelector('.show-more-less-html__markup');
            const jobDescription = jobDescriptionElement?.textContent.trim() || 'No Description Found';

            sendResponse({
                title: jobTitle,
                company: companyName,
                link: jobLink,
                description: jobDescription,
            });
        } catch (error) {
            console.error('Error extracting job details:', error);
            sendResponse({
                error: 'Failed to extract job details. Ensure you are on a valid job posting page.',
            });
        }
    }
});
