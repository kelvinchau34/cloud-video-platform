const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fileUpload = require('express-fileupload');
const DynamoDB = require("@aws-sdk/client-dynamodb");
const DynamoDBLib = require("@aws-sdk/lib-dynamodb");
const S3Presigner = require("@aws-sdk/s3-request-presigner");
const S3 = require("@aws-sdk/client-s3");
const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');


const uploadRouter = express.Router();

// Use express-fileupload middleware
uploadRouter.use(fileUpload({
    limits: { fileSize: 200 * 1024 * 1024 }, // Limit file size to 200MB
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached'
}));



// Initialize DynamoDB client
const dynamoDbClient = new DynamoDB.DynamoDBClient({ region: "ap-southeast-2" });
const dynamoDbdocClient = DynamoDBLib.DynamoDBDocumentClient.from(dynamoDbClient);


async function insertVideoMetadataToDynamoDB(uniqueId, originalName, s3Url, inputFormat, outputFormat, username) {
    const command = new DynamoDBLib.PutCommand({
        TableName: "n11396105",
        Item: {
            "qut-username": "n11396105@qut.edu.au",
            id: uniqueId,
            originalName: originalName,
            s3Url: s3Url,
            inputFormat: inputFormat,
            outputFormat: outputFormat,
            uploadDate: new Date().toISOString(), // Current timestamp in ISO format
            username: username,
        },
    });

    try {
        console.log("Inserting metadata into DynamoDB:", command.input);
        const response = await dynamoDbdocClient.send(command);
        console.log("Put command response:", response);
    } catch (err) {
        console.error("Error inserting metadata into DynamoDB:", err);
        throw new Error("Failed to insert video metadata to DynamoDB");
    }
}

uploadRouter.post('/', async (req, res) => {
    try {
        // Check if file is uploaded
        if (!req.files || !req.files.inputFile) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const inputFile = req.files.inputFile;
        const { username, outputFormat } = req.body;
        const uniqueId = uuidv4(); // Unique identifier for the file
        const inputFormat = path.extname(inputFile.name).substring(1);
        const fileName = uniqueId + "." + inputFormat;

        // Get the bucket name from AWS Secrets Manager
        const secret_name = 'transcoder-user-pool-secrets';
        const secret = await getSecretValue(secret_name);
        const bucketName = JSON.parse(secret).BUCKET_NAME; // Get the bucket name from the secret            

        // Set up S3 client
        const s3Client = new S3.S3Client({ region: 'ap-southeast-2' });

        const s3Key = `uploads/videos/${fileName}`;

        // Generate pre-signed URL for S3
        const uploadCommand = new S3.PutObjectCommand({
            Bucket: bucketName,             // Use the secret-stored bucket name
            Key: s3Key, // S3 file path
            ContentType: inputFile.mimetype,  // File type (e.g., video/mp4)
        });

        // Generate a pre-signed URL that expires in 5 minutes
        const presignedUrl = await S3Presigner.getSignedUrl(s3Client, uploadCommand, { expiresIn: 300 });

        // S3 URL
        const s3Url = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

        // Insert video metadata into DynamoDB
        console.log("Generated unique ID for the upload:", uniqueId);
        await insertVideoMetadataToDynamoDB(uniqueId, inputFile.name, s3Url, inputFormat, outputFormat, username);

        // Respond with the pre-signed URL and video metadata
        res.status(200).json({
            message: 'File metadata saved. Use this URL to upload the video directly to S3:',
            presignedUrl,
            fileName,
            inputFormat,
            outputFormat,
            fileType: inputFile.mimetype,
        });
    } catch (err) {
        console.error('Error processing request:', err);
        return res.status(500).json({ error: 'Unexpected error', details: err.message });
    }
});

uploadRouter.get('/download/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;

        // Get the bucket name from AWS Secrets Manager
        const secret_name = 'transcoder-user-pool-secrets';
        const secret = await getSecretValue(secret_name);
        const bucketName = JSON.parse(secret).BUCKET_NAME; // Get the bucket name from the secret            

        // Set up S3 client
        const s3Client = new S3Client({ region: 'ap-southeast-2' });

        // Generate pre-signed URL for S3 download
        const downloadCommand = new GetObjectCommand({
            Bucket: bucketName,             // Use the secret-stored bucket name
            Key: `uploads/videos/${fileName}`, // S3 file path
        });

        // Generate a pre-signed URL that expires in 5 minutes
        const downloadPresignedUrl = await S3Presigner.getSignedUrl(s3Client, downloadCommand, { expiresIn: 300 });

        // Respond with the pre-signed URL
        res.status(200).json({
            message: 'Use this URL to download the video from S3:',
            downloadPresignedUrl,
        });
    } catch (err) {
        console.error('Error processing request:', err);
        return res.status(500).json({ error: 'Unexpected error', details: err.message });
    }
});

module.exports = uploadRouter;