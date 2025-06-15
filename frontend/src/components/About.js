import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import Layout from './Layout'; 
import './About.css'; 

const About = () => {
  return (
    <Layout>
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box className="about-container">
          <Typography variant="h4" component="h1" className="about-title">
            About Us
          </Typography>
          <Typography variant="body1" className="about-content">
            Welcome to the Video Transcoder App. Our mission is to provide a seamless and efficient way to transcode videos into other formats. 
            Whether you are a content creator, educator, or business professional, our app is designed to help you save time and improve productivity.
            <br /><br />
            Our team is dedicated to continuously improving the app and adding new features to meet the needs of our users. 
            Thank you for choosing our service, and we hope you have a great experience using our app.
          </Typography>
        </Box>
      </Container>
    </Layout>
  );
}

export default About;