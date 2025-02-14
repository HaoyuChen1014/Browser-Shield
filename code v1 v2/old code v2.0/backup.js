
function analyzeDomain(domain) {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(domain);
            const suspiciousBrandNames = ["googlee", "facebok", "twiter"];  // Add more as needed

            // Check HTTPS
            const hasNoHTTPS = url.protocol !== "https:";
            console.log("hasNoHTTPS:", hasNoHTTPS);

            // Check number of dots in domain
            const tooManyDots = url.hostname.split('.').length > 3;
            console.log("tooManyDots:", tooManyDots);

            // Check funky brand names
            const isFunkyBrand = suspiciousBrandNames.some(brand => url.hostname.includes(brand));
            console.log("isFunkyBrand:", isFunkyBrand);

            // Check odd country codes
            const oddCountryCodes = ['.cc', '.tk', '.support']; // Add more as needed
            const hasOddCountryCode = oddCountryCodes.some(cc => url.hostname.endsWith(cc));
            console.log("hasOddCountryCode:", hasOddCountryCode);

            // Check for shortened URLs
            const shortenedDomains = ['bit.ly', 'goo.gl', 't.co'];
            const isShortened = shortenedDomains.some(sd => url.hostname.includes(sd));
            console.log("isShortened:", isShortened);

            // Check for typos
            const hasTypos = url.hostname.includes('facebok') || url.hostname.includes('gogle');
            console.log("hasTypos:", hasTypos);

            // Combine all checks
            const isSuspicious = hasNoHTTPS || tooManyDots || isFunkyBrand || hasOddCountryCode || isShortened || hasTypos;

            resolve(isSuspicious);
        } catch (error) {
            // Handle invalid URLs or other errors
            reject(error);
        }
    });
}
