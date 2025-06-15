import React from 'react';
import { Container, Typography, Box, Table, TableHead, TableBody, TableCell, TableRow, Button } from '@mui/material';
import Layout from './Layout';
import './History.css';

const History = ({ user, videos }) => {
  // Filter videos by the logged-in user
  const userVideos = videos.filter((video) => video.owner === user);

  return (
    <Layout>
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box className="history-container" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" className="history-title">
            {user}'s Video History
          </Typography>
          {userVideos.length > 0 ? (
            <Table className="history-table">
              <TableHead>
                <TableRow>
                  <TableCell className="table-header">Video Name</TableCell>
                  <TableCell className="table-header">Status</TableCell>
                  <TableCell className="table-header">Upload Date</TableCell>
                  <TableCell className="table-header">Download Link</TableCell>
                  <TableCell className="table-header">Format</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userVideos.map((video) => (
                  <TableRow key={video.id} className="table-row">
                    <TableCell>{video.name}</TableCell>
                    <TableCell>{video.status}</TableCell>
                    <TableCell>{new Date(video.uploadDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        href={video.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="history-download-button"
                      >
                        Download
                      </Button>
                    </TableCell>
                    <TableCell>{video.format}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body1" className="no-videos-text">
              No videos found for {user}.
            </Typography>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default History;
