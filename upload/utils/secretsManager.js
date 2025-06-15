const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Set up Secrets Manager client
const secretsManagerClient = new SecretsManagerClient({
    region: "ap-southeast-2",
});


async function getSecretValue(secretName) {
    try {
        const response = await secretsManagerClient.send(
            new GetSecretValueCommand({
                SecretId: secretName,
                VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
            })
        );
        return JSON.parse(response.SecretString);
    } catch (error) {
        throw new Error(`Failed to retrieve secret: ${error.message}`);
    }
}

module.exports = { getSecretValue };