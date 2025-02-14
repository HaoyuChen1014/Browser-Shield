document.addEventListener('DOMContentLoaded', function () {
    const statusElement = document.getElementById('status');
    const captchaElement = document.getElementById('captcha');
    const captchaInput = document.getElementById('captcha-input');
    const reportButton = document.getElementById('report-url');
    const urlInput = document.getElementById('url-input');


    chrome.runtime.sendMessage({ action: 'request_status' }, function(response) {
        const statusIcon = document.getElementById('status-icon'); // Get the status icon element
        const statusElement = document.getElementById('status');

        if (response.status === 'safe') {
            statusElement.textContent = "This site appears to be safe.";
            statusElement.style.color = "green";
            statusIcon.src = "/icons/safe.png"; // Set the icon for safe
            statusIcon.hidden = false; // Show the icon
        } else if (response.status === 'not_safe') {
            statusElement.textContent = "This site is not safe, phishing website risk detected!";
            statusElement.style.color = "red";
            statusIcon.src = "/icons/warning.png"; // Set the icon for not safe
            statusIcon.hidden = false; // Show the icon
        } else {
            statusElement.textContent = "Status unknown.";
            statusElement.style.color = "grey";
            statusIcon.hidden = true; // Hide the icon
        }
    });
    // Function to generate a random CAPTCHA
    function generateCaptcha() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Store the generated CAPTCHA
    let currentCaptcha = generateCaptcha();
    captchaElement.textContent = currentCaptcha;

    // Function to check if the user is blocked
    function checkIfBlocked() {
        chrome.storage.local.get(['blocked', 'unblockTime'], function(result) {
            if (result.blocked && new Date().getTime() < result.unblockTime) {
                const remainingBlockTime = (result.unblockTime - new Date().getTime()) / 1000 / 60;
                alert(`You have been blocked for failed CAPTCHA attempts. Try again in ${remainingBlockTime.toFixed(2)} minutes.`);
                reportButton.disabled = true;  // Disable the report button
            }
        });
    }

    // Initially check if the user is already blocked
    checkIfBlocked();

    reportButton.addEventListener('click', function() {
        const userInputCaptcha = captchaInput.value;
        const suspiciousUrl = urlInput.value;
        
        // Check if user is blocked again in case the block has expired since last check
        checkIfBlocked();

        if (userInputCaptcha === currentCaptcha && suspiciousUrl) {
            // Proceed with URL reporting to the server side
            fetch('http://127.0.0.1:5000/report_suspicious_url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: suspiciousUrl, captcha: currentCaptcha, user_captcha_input: userInputCaptcha })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok.');
            })
            .then(data => {
                console.log('Success:', data);
                // Provide feedback to the user
                statusElement.textContent = "URL reported successfully.";
                statusElement.style.color = "blue";
            })
            .catch(error => {
                console.error('Error:', error);
                // Provide feedback to the user
                statusElement.textContent = "Error reporting URL.";
                statusElement.style.color = "red";
            });

            // Reset CAPTCHA for the next report
            currentCaptcha = generateCaptcha();
            captchaElement.textContent = currentCaptcha;
            captchaInput.value = '';
            urlInput.value = '';

        } else {
            // Incorrect CAPTCHA or URL not provided
            chrome.storage.local.get('failedAttempts', function(result) {
                let failedAttempts = result.failedAttempts || 0;
                failedAttempts++;
                
                if (failedAttempts >= 3) {
                    // Block the user for a day
                    const unblockTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                    chrome.storage.local.set({ blocked: true, unblockTime: unblockTime, failedAttempts: 0 });
                    alert('You have been blocked for 24 hours due to repeated failed CAPTCHA attempts.');
                    reportButton.disabled = true;  // Disable the report button
                } else {
                    // Update the failed attempts
                    chrome.storage.local.set({ failedAttempts: failedAttempts });
                    alert('Incorrect CAPTCHA, please try again.');
                }

                // Refresh CAPTCHA
                currentCaptcha = generateCaptcha();
                captchaElement.textContent = currentCaptcha;
                captchaInput.value = '';
            });
        }
    });

    // Fetch the current site status when popup loads
    chrome.runtime.sendMessage({ action: 'request_status' }, function(response) {
        const statusIcon = document.getElementById('status-icon'); // Get the status icon element
        const statusElement = document.getElementById('status');

        if (response.status === 'safe') {
            statusElement.textContent = "This site appears to be safe.";
            statusElement.style.color = "green";
            statusIcon.src = "icons/safe.png"; // Set the icon for safe
            statusIcon.hidden = false; // Show the icon
        } else if (response.status === 'not_safe') {
            statusElement.textContent = "This site is not safe, phishing website risk detected!";
            statusElement.style.color = "red";
            statusIcon.src = "icons/warning.png"; // Set the icon for not safe
            statusIcon.hidden = false; // Show the icon
        } else {
            statusElement.textContent = "Status unknown.";
            statusElement.style.color = "grey";
            statusIcon.hidden = true; // Hide the icon
        }
    });
    
});
