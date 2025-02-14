function fetchDomainAge(domain) {
    return fetch('http://127.0.0.1:5000/getDomainAge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'domain': domain
        })
    })
    .then(response => response.json())
    .then(data => data.domainAge)
    .catch(error => {
        console.error("Error fetching domain age:", error);
        return null;
    });
}

function analyzeDomain(domain) {
    return new Promise(async (resolve, reject) => {
        try {
            const url = new URL(domain);
            const suspiciousBrandNames = ["googlee", "facebok", "twiter"];

            // Fetching domain age
            const domainAge = await fetchDomainAge(domain);
            const isNewDomain = domainAge !== null && domainAge < 0.25; // Check if domain is less than 3 months old
            console.log("isNewDomain:", isNewDomain);
            // Check HTTPS
            const hasNoHTTPS = url.protocol !== "https:";
            console.log("hasNoHTTPS:", hasNoHTTPS);

            // Check funky brand names
            const isFunkyBrand = suspiciousBrandNames.some(brand => url.hostname.includes(brand));
            console.log("isFunkyBrand:", isFunkyBrand);

            // Check odd country codes
            const oddCountryCodes = ['.cc', '.service', '.support']; // Add more as needed
            const hasOddCountryCode = oddCountryCodes.some(cc => url.hostname.endsWith(cc));
            console.log("hasOddCountryCode:", hasOddCountryCode);

            // Check for shortened URLs
            const shortenedDomains = ['bit.ly', 'goo.gl', 't.co'];
            const isShortened = shortenedDomains.some(sd => url.hostname.includes(sd));
            console.log("isShortened:", isShortened);

            // Check for typos
            const hasTypos = url.hostname.includes('facebok') || url.hostname.includes('gogle');
            console.log("hasTypos:", hasTypos);

            // Check or long domain name
            const isLongDomain = url.hostname.length > 50;  // adjust the threshold as needed
            console.log("isLongDomain:", isLongDomain);

            // Number of Subdomains:
            const subdomains = url.hostname.split('.');
            const tooManySubdomains = subdomains.length > 4;  // adjust the threshold as needed
            console.log("tooManySubdomains:", tooManySubdomains);

            // Combine all checks
            const isSuspicious = hasNoHTTPS || isFunkyBrand || hasOddCountryCode || isShortened || hasTypos || isNewDomain || isLongDomain || tooManySubdomains;

            resolve(isSuspicious);
        } catch (error) {
            console.error("Error analyzing domain:", error);
            reject(error);
        }
    });
}