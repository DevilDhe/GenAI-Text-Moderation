import('node-fetch').then(async module => {
    const fetch = module.default;
    const fs = require('fs').promises;

    const token = 'sk-347aba049dbd4f8c99ada86f6b622b14';

    async function fetchModerationResults(textContent) {
        const options = {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text_content: textContent })
        };

        try {
            const response = await fetch('https://api.worqhat.com/api/ai/moderation', options);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching moderation results:', error);
            return null;
        }
    }

    // Read the first line from the text file
    fs.readFile('tweets.txt', 'utf-8')
        .then(async (data) => {
            const firstLine = data.trim().split('\n')[0];
            if (firstLine) {
                const moderationResults = await fetchModerationResults(firstLine);
                if (moderationResults) {
                    fs.writeFile('moderation_results.json', JSON.stringify(moderationResults, null, 2))
                        .then(() => {
                            console.log('Moderation results saved to moderation_results.json');
                        })
                        .catch(error => {
                            console.error('Error saving moderation results to file:', error);
                        });
                } else {
                    console.log('Failed to fetch moderation results.');
                }
            } else {
                console.log('No text found in the file.');
            }
        })
        .catch(error => {
            console.error('Error reading file:', error);
        });
}).catch(error => {
    console.error('Error importing module:', error);
});
