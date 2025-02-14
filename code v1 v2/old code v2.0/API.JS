function getDomainAge(domain) {
    const apiKey = 'at_c4NP0WsdiHmO0KM2I9NTD8TF17btw'; // Replace with your actual API key
    return fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${domain}&outputFormat=JSON`)
        .then(response => response.json())
        .then(data => {
            if (data && data.WhoisRecord && data.WhoisRecord.createdDate) {
                const createdDate = new Date(data.WhoisRecord.createdDate);
                const currentDate = new Date();
                const domainAge = (currentDate - createdDate) / (1000 * 3600 * 24 * 365); // In years
                return domainAge;
            }
            return null;
        })
        .catch(error => {
            console.log("Error fetching domain age:", error.message);
            return null;
        });
}