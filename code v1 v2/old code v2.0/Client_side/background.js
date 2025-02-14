// Function to download and update both the blacklist and whitelist
function fetchAndUpdateLists() {
    // Fetch and update the blacklist
    fetch('http://127.0.0.1:5000/getblacklist.json')
    .then(response => response.json())
    .then(data => {
        chrome.storage.local.set({blacklist: data});
    })
    .catch(error => {
        console.log("Problem fetching blacklist:", error.message);
    });

    // Fetch and update the whitelist
    fetch('http://127.0.0.1:5000/getwhitelist.json')
    .then(response => response.json())
    .then(data => {
        chrome.storage.local.set({whitelist: data});
    })
    .catch(error => {
        console.log("Problem fetching whitelist:", error.message);
    });
}

// Fetch and store the lists when the browser starts and upon extension installation
chrome.runtime.onStartup.addListener(fetchAndUpdateLists);
chrome.runtime.onInstalled.addListener(fetchAndUpdateLists);

async function analyzeDomain(url) {

    // Send a POST request to your Flask predict endpoint
    const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features: features }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const predictionResult = await response.json();

    // If the prediction is 'phishing', we consider the site suspicious
    const isSuspicious = predictionResult.prediction === 'phishing';

    return isSuspicious;
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.active) {
        const currentUrl = tab.url;

        // Check if the URL is valid
        if (currentUrl && currentUrl.startsWith("http")) {
            chrome.storage.local.get(['blacklist', 'whitelist'], function(data) {
                let blacklist = data.blacklist || [];
                let whitelist = data.whitelist || [];

                // Check against the whitelist
                if (whitelist.some(whitelistedUrl => currentUrl.startsWith(whitelistedUrl))) {
                    // Optionally, display a Chrome notification for whitelisted sites
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'images/safe.png',
                        title: 'Safe Site',
                        message: 'You are visiting a whitelisted site!'
                    });
                    return; // URL is safe, exit early
                }

                if (blacklist.includes(currentUrl)) {
                    // Display a Chrome notification for blacklisted sites
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'images/warning.png',
                        title: 'Warning!',
                        message: 'You are visiting a blacklisted site!'
                    });
                    return;  // Exit early
                }
                
                // If not blacklisted and the URL is valid, extract features
                fetch('http://localhost:5000/extract_features', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({url: currentUrl}),
                })
                .then(response => response.json())
                .then(data => {
                    // Now call analyzeDomain with the extracted features to check if the site is suspicious
                    analyzeDomain(data).then(isSuspicious => {
                        if (isSuspicious) {
                            // Display a Chrome notification for suspicious sites
                            chrome.notifications.create({
                                type: 'basic',
                                iconUrl: 'images/warning.png',
                                title: 'Caution!',
                                message: 'This site seems suspicious!'
                            });
                        }
                    }).catch(error => {
                        // Handle errors if analyzeDomain fails
                        console.error("Error analyzing domain:", error);
                    });
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
            });
        }
    }
});

