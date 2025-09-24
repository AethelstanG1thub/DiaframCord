const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const port = 3000;

// IMPORTANT: This is a simplified example. For a real application,
// you should use a library like 'dotenv' to load these from a .env file.
const CLIENT_ID = process.env.CLIENT_ID || '1420439275320643625';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'UaBcdYu3Gri1jIyQvH2g7TTnFU7Jt1Hq';
const REDIRECT_URI = 'http://localhost:3000/callback';

// Serve the static HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// The OAuth2 callback endpoint
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('No authorization code provided.');
    }

    try {
        // Step 1: Exchange the temporary code for an access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.status(500).send(`Error during token exchange: ${tokenData.error_description}`);
        }

        const accessToken = tokenData.access_token;
        
        // Step 2: Use the access token to fetch user data
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenData.token_type} ${accessToken}`,
            },
        });

        const userData = await userResponse.json();

        // Redirect back to the main page with user data as a query parameter
        res.redirect(`/?username=${encodeURIComponent(userData.username)}&avatar=${userData.id}/${userData.avatar}.png`);
        
    } catch (error) {
        console.error('OAuth2 error:', error);
        res.status(500).send('An error occurred during authentication.');
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
