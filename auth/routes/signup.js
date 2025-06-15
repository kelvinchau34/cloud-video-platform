const Cognito = require("@aws-sdk/client-cognito-identity-provider");
const express = require('express');
const { getSecretValue } = require('../utils/secretsManager');

const signupRouter = express.Router();

// Initialize Cognito client
const client = new Cognito.CognitoIdentityProviderClient({ region: 'ap-southeast-2' });

signupRouter.post('/', async (req, res) => {
    const { username, password, email } = req.body;
    // Input validation
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const secret_name = 'transcoder-user-pool-secrets';
        const secrets = await getSecretValue(secret_name);
        const USER_POOL_ID = secrets.USER_POOL_ID;
        const CLIENT_ID = secrets.CLIENT_ID;

        // Create the signup command
        const signUpCommand = new Cognito.SignUpCommand({
            ClientId: CLIENT_ID,
            Username: username,
            Password: password,
            UserAttributes: [
                {
                    Name: 'email',
                    Value: email,
                },
            ],
        });

        await client.send(signUpCommand);

        // Respond with success message
        res.status(200).json({ message: 'User signed up successfully.' });
    } catch (error) {
        console.error('Error signing up user:', error);
        let errorMessage = 'Error signing up user';
        let statusCode = 500;

        // Handle specific Cognito errors
        if (error instanceof Cognito.UsernameExistsException) {
            errorMessage = 'Username already exists';
            statusCode = 400;
        } else if (error instanceof Cognito.InvalidPasswordException) {
            errorMessage = 'Invalid password';
            statusCode = 400;
        } else if (error instanceof Cognito.InvalidParameterException) {
            errorMessage = 'Invalid parameters provided: ' + error.message;
            statusCode = 400;
        }

        res.status(statusCode).json({ error: errorMessage });
    }
});

module.exports = signupRouter;