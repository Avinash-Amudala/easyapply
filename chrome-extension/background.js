chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getToken') {
        chrome.storage.local.get(['token'], (result) => {
            sendResponse({ token: result.token || null });
        });
        return true;
    }

    if (request.action === 'setToken') {
        chrome.storage.local.set({ token: request.token }, () => {
            sendResponse({ message: "Token saved successfully" });
        });
        return true;
    }
});