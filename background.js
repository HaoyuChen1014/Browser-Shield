let currentStatus = { status: 'unknown' };  // This holds the last known status

// Function to handle messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'request_status') {
        sendResponse(currentStatus);
    }
    // Note: You might need to return true from the event listener if you wish to send a response asynchronously.
    return true; 
});

// Function to send URL to the server for checks and update badge text
function checkURLWithServer(url) {
    fetch('http://127.0.0.1:5000/check_url', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Server responded with a status: ' + response.status);
        }
    })
    .then(data => {
        if (data && data.status) {
            currentStatus = { status: data.status };  // Update the current status
            chrome.runtime.sendMessage({ url: url, status: data.status }); // Optionally send to popup

            // Update the badge text based on the status
            chrome.browserAction.setBadgeText({
                text: data.status === 'safe' ? 'Safe' : 'Phish'
            });
            chrome.browserAction.setBadgeBackgroundColor({
                color: data.status === 'safe' ? '#00C851' : '#ff4444'
            });
            
        } else {
            throw new Error('Unexpected server response');
        }
    })
    .catch(error => {
        console.error('Error checking URL:', error);
        currentStatus = { status: 'error' };  // Update the status to error
        chrome.browserAction.setBadgeText({ text: 'Err' });
        chrome.browserAction.setBadgeBackgroundColor({ color: '#ffbb33' });
    });
}

// Listen for the alarm to trigger the blacklist update (No longer needed for updating, but kept if needed for future use)
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === "updateBlacklist") {
        console.log("Blacklist check initiated.");
    }
});

// On each navigation, check the URL with the server
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        // Ignore requests from the extension itself
        if (details.url.startsWith('chrome-extension://')) {
            console.log('Ignoring internal extension URL:', details.url);
            return; // Skip checking internal extension URLs
        }
        if (details.type === "main_frame") { // Only check the main frame
            checkURLWithServer(details.url);
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);

// Ensures the badge is reset when the extension is reloaded or installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.browserAction.setBadgeText({ text: '' }); // Clear any previous badge text
});
