import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';
import Layout from './Layout';
import './Login.css';

function Login({ user, setUser }) {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // State for success message
  const [backendAddress, setBackendAddress] = useState('');
  const [isSignup, setIsSignup] = useState(false); // State to toggle between login and signup
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBackendAddress = async () => {
      try {
        const response = await axios.get('http://n11396105.cab432.com:3001/backend-address');
        setBackendAddress(response.data.backendAddress);
      } catch (error) {
        console.error('Error fetching backend address:', error);
        setError('Error fetching backend address');
      }
    };

    fetchBackendAddress();
  }, []);

  // Password validation function
  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSymbols &&
      password.length >= 8
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log("Sending login request for:", username);
      const response = await axios.post(`${backendAddress}/login`,
        { username, password },
        { withCredentials: true }
      );

      console.log("Full login response:", response);
      if (response.data.success) {
        console.log("Setting user state with username:", response.data.username);
        setUser({
          username: response.data.username
        });
      } else {
        setError('Login failed, please try again.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.error || 'Invalid credentials';
      setError(errorMessage);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols.');
      return;
    }

    try {
      const response = await axios.post(`${backendAddress}/signup`, {
        username,
        password,
        email,
      });

      if (response.status === 200) {
        setIsSignup(false); // Switch to login view if needed
      }
    } catch (error) {
      console.error('Signup failed:', error);
      const errorMessage = error.response?.data?.error || 'Error signing up';
      setError(errorMessage);
    }
  };


  const handleLogout = async () => {
    try {
      const logoutUrl = `${backendAddress}/login/logout`;
      console.log("Sending logout request to:", logoutUrl);
      const response = await axios.post(logoutUrl, { username: user.username }, { withCredentials: true });
      console.log(response.data.message); // Log the response message
      setUser(null);
      console.log('User logged out, navigating to home page');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Layout>
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box className="login-container">
          {error && <Alert severity="error" className="login-alert">{error}</Alert>}
          {success && <Alert severity="success" className="signup-alert">{success}</Alert>}
          {user ? (
            <Box textAlign="center">
              <Typography variant="h6" className="login-welcome">
                Welcome, {user.username}!
              </Typography>
              <Button onClick={handleLogout} variant="contained" className="logout-button">
                Logout
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h4" component="h1" className="login-title">
                {isSignup ? 'Sign Up' : 'Login'}
              </Typography>
              <Box component="form" onSubmit={isSignup ? handleSignup : handleSubmit} sx={{ width: '100%' }}>
                <TextField
                  label="Username"
                  variant="outlined"
                  fullWidth
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                />
                <TextField
                  label="Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
                {isSignup && (
                  <TextField
                    label="Email"
                    variant="outlined"
                    fullWidth
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                  />
                )}
                <Button type="submit" variant="contained" fullWidth className="login-button">
                  {isSignup ? 'Sign Up' : 'Log In'}
                </Button>
              </Box>
              <Button onClick={() => setIsSignup(!isSignup)} variant="text" fullWidth className="toggle-button">
                {isSignup ? 'Already have an account? Log In' : 'Create an account'}
              </Button>
            </>
          )}
        </Box>
      </Container>
    </Layout>
  );
}

export default Login;