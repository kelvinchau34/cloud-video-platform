const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const DynamoDB = require("@aws-sdk/client-dynamodb");
const DynamoDBLib = require("@aws-sdk/lib-dynamodb");
const S3Presigner = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const {
    SecretsManagerClient,
    GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

const processRouter = express.Router();

// Set up AWS clients
const secret_name = "transcoder-user-pool-secrets";
const secretsManagerClient = new SecretsManagerClient({ region: "ap-southeast-2" });
const dynamoDbClient = new DynamoDB.DynamoDBClient({ region: "ap-southeast-2" });
const dynamoDbdocClient = DynamoDBLib.DynamoDBDocumentClient.from(dynamoDbClient);
const s3Client = new S3Client({ region: 'ap-southeast-2' });

// Function to retrieve video metadata from DynamoDB
async function getVideoMetadata(uniqueId) {
    const command = new DynamoDBLib.GetCommand({
        TableName: "VideoMetadata",
        Key: {
            "username": "default", // Assuming a default username, adjust as necessary
            "id": uniqueId
        }
    });

    console.log(`DynamoDB GetCommand: ${JSON.stringify(command)}`);

    try {
        const response = await dynamoDbdocClient.send(command);
        console.log(`DynamoDB response: ${JSON.stringify(response)}`);

        if (!response.Item) {
            throw new Error('Item not found in DynamoDB');
        }

        return response.Item;
    } catch (error) {
        console.error(`Error retrieving metadata: ${error.message}`);
        throw error;
    }
}

// Function to transcode video and upload to S3
async function transcodeVideo(inputFilePath, outputFilePath, outputFormat) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputFilePath)
            .toFormat(outputFormat)
            .on('end', () => {
                console.log('Transcoding finished successfully');
                resolve();
            })
            .on('error', (error) => {
                console.error(`Error during transcoding: ${error.message}`);
                reject(error);
            })
            .save(outputFilePath);
    });
}

// Route to process video
processRouter.post('/:uniqueId', async (req, res) => {
    const { uniqueId } = req.params;
    const { outputFormat } = req.body;

    console.log(`Received request to process video with uniqueId: ${uniqueId} and outputFormat: ${outputFormat}`);

    const tempDir = 'temp';
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir); // Create temp directory if it doesn't exist
    }

    const tempInputFilePath = `temp/${uniqueId}.input.tmp`; // Temporary input file path
    const tempOutputFilePath = `temp/${uniqueId}.output.${outputFormat}`; // Temporary output file path

    try {
        const videoMetadata = await getVideoMetadata(uniqueId);
        const { s3Url, inputFormat } = videoMetadata;
        const bucketName = s3Url.split('/')[2].split('.')[0];
        const inputKey = `uploads/videos/${uniqueId}.${inputFormat}`;
        const outputKey = `processed/videos/${uniqueId}.${outputFormat}`;

        // Set up S3 client
        const s3Client = new S3Client({ region: 'ap-southeast-2' });

        // Get signed URL for the input video
        const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: inputKey });
        const inputUrl = await S3Presigner.getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

        // Dynamically import node-fetch
        const fetch = (await import('node-fetch')).default;

        // Download the video file to a temporary location
        const response = await fetch(inputUrl);
        if (!response.ok) {
            throw new Error('Failed to download video file');
        }
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(tempInputFilePath, Buffer.from(buffer)); // Write buffer to temporary file

        // Transcode the video
        await transcodeVideo(tempInputFilePath, tempOutputFilePath, outputFormat);



        // Upload the transcoded video to S3
        const fileStream = fs.createReadStream(tempOutputFilePath);
        try {
            console.log(`Uploading to S3: Bucket=${bucketName}, Key=${outputKey}`);
            await s3Client.send(new PutObjectCommand({
                Bucket: bucketName,
                Key: outputKey,
                Body: fileStream,
                ContentType: `video/${outputFormat}` // Adjust the content type based on the output format
            }));
            console.log('Upload to S3 finished successfully');
        } catch (uploadError) {
            console.error('Error uploading to S3:', uploadError);
            throw uploadError;
        }

        // Generate a signed URL for the processed video

        const getProcessedCommand = new GetObjectCommand({ Bucket: bucketName, Key: outputKey });
        const downloadUrl = await S3Presigner.getSignedUrl(s3Client, getProcessedCommand, { expiresIn: 3600 });
        console.log('SignedUrl:', downloadUrl)

        // Remove the temporary files
        fs.unlinkSync(tempInputFilePath);
        fs.unlinkSync(tempOutputFilePath);

        res.status(200).json({
            message: 'Video processed successfully',
            downloadUrl,
        });
    } catch (error) {
        console.error('Error processing video:', error);
        // Ensure the temporary files are deleted in case of an error
        if (fs.existsSync(tempInputFilePath)) {
            fs.unlinkSync(tempInputFilePath);
        }
        if (fs.existsSync(tempOutputFilePath)) {
            fs.unlinkSync(tempOutputFilePath);
        }
        res.status(500).json({ error: 'Error processing video', details: error.message });
    }
});

// Endpoint to transcribe audio
processRouter.post('/transcribe', async (req, res) => {
    const { fileId } = req.body;

    if (!fileId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const videoMetadata = await getVideoMetadata(fileId);
        const { s3Url, inputFormat } = videoMetadata;
        const bucketName = s3Url.split('/')[2].split('.')[0];
        const inputKey = `uploads/videos/${fileId}.${inputFormat}`;

        // Set up S3 client
        const s3Client = new S3.S3Client({ region: 'ap-southeast-2' });

        // Get signed URL for the input audio file
        const getCommand = new S3.GetObjectCommand({ Bucket: bucketName, Key: inputKey });
        const inputUrl = await S3Presigner.getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

        // Dynamically import node-fetch
        const fetch = (await import('node-fetch')).default;

        // Fetch audio file from S3
        const response = await fetch(inputUrl);
        const data = await response.arrayBuffer();

        // Transcribe using external API
        const transcriptionResponse = await fetch(
            "https://api-inference.huggingface.co/models/facebook/wav2vec2-base-960h",
            {
                headers: {
                    Authorization: "Bearer YOUR_HUGGINGFACE_API_KEY",
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: data,
            }
        );

        if (!transcriptionResponse.ok) {
            throw new Error('Transcription failed');
        }

        const result = await transcriptionResponse.json();
        res.json(result);
    } catch (error) {
        console.error('Error during transcription:', error);
        res.status(500).json({ error: 'Error during transcription', details: error.message });
    }
});

module.exports = processRouter;