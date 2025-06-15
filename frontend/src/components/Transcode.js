import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, LinearProgress } from '@mui/material';
import Layout from './Layout';
import './Transcode.css';

function Transcode({ user }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [status, setStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [uploadedFileId, setUploadedFileId] = useState('');
    const [format, setFormat] = useState('mp4');
    const [transcription, setTranscription] = useState('');
    const [backendAddress, setBackendAddress] = useState('');

    useEffect(() => {
        const fetchBackendAddress = async () => {
            try {
                const response = await axios.get('http://n11396105.cab432.com:3001/backend-address');
                setBackendAddress(response.data.backendAddress);
            } catch (error) {
                console.error('Error fetching backend address:', error);
            }
        };

        fetchBackendAddress();
    }, []);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setStatus('');
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setStatus('Please select a file.');
            return;
        }

        try {
            setStatus('Uploading file...');

            const formData = new FormData();
            formData.append('inputFile', selectedFile);
            formData.append('username', user.username);

            const { data } = await axios.post(`${backendAddress}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            const { presignedUrl, fileName, fileType } = data;

            console.log('Received pre-signed URL:', presignedUrl);

            console.log('Uploading file to S3...');
            const uploadResponse = await axios.put(presignedUrl, selectedFile, {
                headers: {
                    'Content-Type': fileType,
                },
            });

            console.log('Upload response:', uploadResponse);

            const uniqueId = fileName.split('.')[0];
            setUploadedFileId(uniqueId);

            setDownloadUrl(`${backendAddress}/upload/download/${fileName}`);
            setStatus('File uploaded successfully.');
        } catch (error) {
            console.error('Error uploading file:', error);
            const errorMsg = error.response?.data?.error || error.message;
            setStatus(`Upload Error: ${errorMsg}`);
        }
    };

    const handleTranscode = async () => {
        if (!uploadedFileId) {
            setStatus('Please upload a file first.');
            return;
        }
        const transcodingData = {
            fileId: uploadedFileId,
            outputFormat: format
        };

        try {
            setStatus('Transcoding...');
            console.log('Transcoding data:', transcodingData);
            const response = await axios.post(`${backendAddress}/process/${uploadedFileId}`, transcodingData);
            setStatus('Transcoding started. Waiting for progress updates...');
            // Update the status based on the backend response

            if (response.status === 200) {
                const downloadUrl = response.data.downloadUrl; // Assuming your backend returns this
                setStatus('Transcoding completed successfully!'); // Update status
                setDownloadUrl(downloadUrl);
                // You can also display the download link here
                console.log('Download URL:', downloadUrl);
            } else {
                setStatus('Transcoding failed. Please try again.');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
            setStatus(`Transcoding Error: ${errorMsg}`);
        }
    };


    const handleTranscribe = async () => {
        if (!uploadedFileId) {
            setStatus('Please upload a file first.');
            return;
        }

        try {
            setStatus('Transcribing...');
            const { data } = await axios.post(`${backendAddress}/process/transcribe`, { fileId: uploadedFileId });
            setTranscription(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
            setStatus('Transcription completed.');
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            setStatus(`Transcription Error: ${errorMsg}`);
        }
    };

    const handleFormatChange = (event) => {
        setFormat(event.target.value);
    };

    return (
        <Layout>
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Box className="transcode-container" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" className="transcode-title">
                        Video Playground
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        1. Choose Input File<br />
                        2. Upload File<br />
                        3. Select Output Format<br />
                        4. Transcode/ Transcribe Video
                    </Typography>
                    <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <input
                            accept="video/*"
                            id="upload-file"
                            type="file"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="upload-file">
                            <Button variant="contained" component="span" className="transcode-button">
                                Choose File
                            </Button>
                        </label>
                        {selectedFile && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Selected file: {selectedFile.name}
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2 }}
                            onClick={handleUpload}
                            disabled={!selectedFile}
                            className="transcode-button"
                        >
                            Upload File
                        </Button>

                        <Box sx={{ mt: 2, width: '100%' }}>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                Output Format:
                            </Typography>
                            <FormControl fullWidth>
                                <InputLabel id="format-label">Format</InputLabel>
                                <Select
                                    labelId="format-label"
                                    value={format}
                                    onChange={handleFormatChange}
                                    label="Format"
                                    className="transcode-input"
                                >
                                    {/* Output format options */}
                                    {['mp4', 'avi', 'mov', 'mkv', 'flv', 'webm', 'ogg', 'mp3', 'wav', 'm4v', '3gp', '3g2', 'f4v', 'mxf', 'opus', 'ts', 'vob', 'webp'].map((formatOption) => (
                                        <MenuItem key={formatOption} value={formatOption}>{formatOption.toUpperCase()}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                color="secondary"
                                sx={{ mt: 2 }}
                                onClick={handleTranscode}
                                disabled={!uploadedFileId}
                                className="transcode-button"
                            >
                                Transcode Video
                            </Button>
                        </Box>
                    </Box>

                    {status && (
                        <Typography
                            variant="body1"
                            sx={{ color: status.includes('Error') ? 'error.main' : 'white' }}
                            className="transcode-status"
                        >
                            {status}
                        </Typography>
                    )}
                    {progress > 0 && (
                        <Box sx={{ width: '100%', mt: 2 }}>
                            <LinearProgress variant="determinate" value={progress} />
                            <Typography variant="body2">{progress}%</Typography>
                        </Box>
                    )}
                    {transcription && (
                        <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}>
                            <Typography variant="h6">Transcription:</Typography>
                            <Typography variant="body2">{transcription}</Typography>
                        </Box>
                    )}
                    {downloadUrl && (
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3 }}
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transcode-button"
                        >
                            Download Transcoded Video
                        </Button>
                    )}
                </Box>
            </Container>
        </Layout>
    );
}

export default Transcode;