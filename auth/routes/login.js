const express = require('express');
const router = express.Router();
const jwt = require("aws-jwt-verify");
const Cognito = require("@aws-sdk/client-cognito-identity-provider");

const { getSecretValue } = require('../utils/secretsManager');
const { getParameter } = require('../utils/parameterStore');

let clientId;
let userPoolId;
let idVerifier;

const client = new Cognito.CognitoIdentityProviderClient({ region: 'ap-southeast-2' });

async function initialise() {
    try {
        // Retrieve secrets from AWS Secrets Manager
        const secret_name = 'transcoder-user-pool-secrets';
        const secrets = await getSecretValue(secret_name);
        userPoolId = secrets.USER_POOL_ID;
        clientId = secrets.CLIENT_ID;

        idVerifier = jwt.CognitoJwtVerifier.create({
            userPoolId: userPoolId,
            tokenUse: "id",
            clientId: clientId,
        })

        console.log("Cognito initialized successfully");

    } catch (error) {
        console.error('Error initialising:', error);
        throw error;
    }
}

// Call the initialise function
initialise().catch(err => console.error("Initialisation failed:", err));


// Handle login requests
router.post('/', async (req, res) => {
    const { username, password } = req.body;
    console.log("Received login request for:", username);

    try {
        const command = new Cognito.InitiateAuthCommand({
            AuthFlow: Cognito.AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
            ClientId: clientId,
        });

        const cognitoResponse = await client.send(command);
        console.log("Cognito Response:", cognitoResponse);

        if (cognitoResponse.AuthenticationResult) {
            const idToken = cognitoResponse.AuthenticationResult.IdToken;

            // Verify the ID token
            const IdTokenVerifyResult = await idVerifier.verify(idToken, { tokenUse: "id", clientId });
            console.log("IdTokenVerifyResult:", IdTokenVerifyResult);

            // Extract the username from the verified ID token
            const verifiedUsername = IdTokenVerifyResult['cognito:username'];

            // Set the ID token in the cookie
            res.cookie('idToken', idToken, {
                httpOnly: true,
                secure: true,  // Secure flag for production
                maxAge: 3600000, // 1 hour
                sameSite: 'strict'
            });

            res.json({
                success: true,
                message: 'Logged in successfully',
                idToken,
                accessToken: cognitoResponse.AuthenticationResult.AccessToken,
                refreshToken: cognitoResponse.AuthenticationResult.RefreshToken,
                username: verifiedUsername,
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }


    } catch (error) {
        if (error.name === 'UserNotConfirmedException') {
            // Handle unconfirmed user case
            res.status(400).json({ error: 'User is not confirmed. Please check your email for the confirmation link.' });
        } else if (error.name === 'NotAuthorizedException') {
            res.status(401).json({ error: 'Invalid credentials' });
        } else {
            console.error('Error logging in user:', error);
            res.status(500).json({ error: 'Error logging in user', details: error.message });
        }
    }
});



// Handle logout requests
router.post('/logout', async (req, res) => {
    const { username } = req.body;

    // Clear the ID token from the cookie
    res.clearCookie('idToken');

    res.json({ message: `User ${username} logged out successfully` });
});

// Export the router
module.exports = router;
