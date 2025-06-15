const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const client = new SSMClient({ region: "ap-southeast-2" }); // Correct client initialization

async function getParameter(parameterName) {
    try {
        const command = new GetParameterCommand({ Name: parameterName });
        const response = await client.send(command); // Use 'client' instead of 'ssmClient'
        return response.Parameter.Value;
    } catch (error) {
        throw new Error(`Failed to retrieve parameter: ${error.message}`);
    }
}

module.exports = { getParameter };