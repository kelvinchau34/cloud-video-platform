import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout'; 
import './Home.css'; 

const Home = () => {
  const navigate = useNavigate();

  const handleTranscodeNow = () => {
    navigate('/video-transcode');
  };

  return (
    <Layout>
      {/* Hero Section */}
      <Container maxWidth="md" className="py-12">
        <Box className="hero-box p-8">
          <Typography variant="h10" component="h1" className="hero-title mb-6">
            Welcome <br />
            To <br />
            Transcoder
          </Typography>
          {/* Transcode Now Button */}
          <Box className="text-left">
            <Button 
              variant="contained" 
              size="large"
              onClick={handleTranscodeNow}
              className="transcode-button"
              sx={{ color: 'white' }} 
            >
              Transcode Now
            </Button>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
}

export default Home;