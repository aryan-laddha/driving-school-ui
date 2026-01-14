// src/pages/NotFound.jsx
import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Container>
      <Box 
        sx={{ 
          mt: 10, 
          textAlign: 'center', 
          p: 5, 
          boxShadow: 3, 
          borderRadius: 2 
        }}
      >
        <Typography variant="h1" color="error">
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
}