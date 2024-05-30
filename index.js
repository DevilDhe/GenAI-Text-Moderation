const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function scrapeTweets(hashtag, numTweets) {
    const browser = await puppeteer.launch({ headless: false }); // Launch browser in non-headless mode for debugging
    const page = await browser.newPage();

    // Navigate to the hashtag search page
    const url = `https://twitter.com/search?q=%23${hashtag}&src=typed_query&f=live`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    const tweets = [];
    let scrollAttempts = 0;

    // Scroll and scrape tweets
    while (tweets.length < numTweets && scrollAttempts < 30) {
        const newTweets = await page.evaluate(() => {
            const tweetElements = Array.from(document.querySelectorAll('article div[lang]'));
            return tweetElements.map(el => ({
                text: el.innerText.trim(), // Trim whitespace from text
                date: el.closest('article').querySelector('time') ? el.closest('article').querySelector('time').dateTime : null
            }));
        });

        tweets.push(...newTweets);

        if (tweets.length < numTweets) {
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
            scrollAttempts++;
        }
    }

    await browser.close();
    return tweets.slice(0, numTweets);
}

async function writeTweetsToText(tweets, filePath) {
    try {
        await fs.writeFile(filePath, ''); // Clear existing content or create a new file
        for (const tweet of tweets) {
            await fs.appendFile(filePath, tweet.text + '\n'); // Append each tweet's text to the file
        }
        console.log('Tweets have been written to text file');
    } catch (error) {
        console.error('Error writing to text file:', error);
    }
}

async function main() {
    const hashtag = 'news'; // Replace 'your_hashtag' with the desired hashtag
    const numTweets = 100; // Number of tweets to scrape
    const filePath = 'tweets.txt'; // Output text file path

    console.log(`Starting to scrape tweets with hashtag: #${hashtag}`);
    const tweets = await scrapeTweets(hashtag, numTweets);
    if (tweets.length > 0) {
        console.log(`Scraped ${tweets.length} tweets. Writing to text file...`);
        await writeTweetsToText(tweets, filePath);
    } else {
        console.log('No tweets found for the specified hashtag.');
    }
    console.log('Scraping and text file writing completed.');
}

main();
