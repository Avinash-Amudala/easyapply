
const sendToken = (token) => {
    chrome.runtime.sendMessage(
        { action: 'setToken', token: token },
        (response) => {
            console.log('Token synced to extension:', response);
        }
    );
};

// Check for token on load
const token = localStorage.getItem('token');
if (token) {
    sendToken(token);
}

// Listen for token changes in localStorage
window.addEventListener('storage', (event) => {
    if (event.key === 'token') {
        sendToken(event.newValue);
    }
});