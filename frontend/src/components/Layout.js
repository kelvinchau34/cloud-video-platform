import React from 'react';
import { AppBar, Toolbar, Typography, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-navy text-white">
      {/* Navbar */}
      <AppBar position="sticky" className="appbar" sx={{ boxShadow: 'none' }}>
        <Toolbar className="flex justify-between items-center">
          <Typography variant="h4" component="div" className="text-white">
            Transcoder
          </Typography>
          <Tabs value={false} textColor="inherit" indicatorColor="secondary">
            <Tab label="Home" onClick={() => navigate('/')} className="tab-label" />
            <Tab label="About" onClick={() => navigate('/about')} className="tab-label" />
            <Tab label="Video Transcode" onClick={() => navigate('/video-transcode')} className="tab-label" />
            <Tab label="Login" onClick={handleLoginRedirect} className="tab-label" />
          </Tabs>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;