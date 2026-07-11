import React from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';

const LoadingOverlay = ({ active, message = 'Analyzing microscope image...' }) => {
  if (!active) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'rgba(11, 15, 25, 0.85)' 
            : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        border: '1px solid',
        borderColor: (theme) => 
          theme.palette.mode === 'dark' 
            ? 'rgba(56, 189, 248, 0.1)' 
            : 'rgba(2, 132, 199, 0.1)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'transparent',
          textAlign: 'center',
        }}
      >
        <Box sx={{ position: 'relative', mb: 3 }}>
          <CircularProgress
            size={80}
            thickness={2.5}
            sx={{
              color: 'primary.main',
            }}
          />
          <ScienceIcon
            sx={{
              position: 'absolute',
              top: 'calc(50% - 16px)',
              left: 'calc(50% - 16px)',
              fontSize: 32,
              color: 'primary.main',
              animation: 'pulse-glow 2s infinite ease-in-out',
              '@keyframes pulse-glow': {
                '0%, 100%': { transform: 'scale(1)', opacity: 0.7 },
                '50%': { transform: 'scale(1.2)', opacity: 1 },
              }
            }}
          />
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 1,
            letterSpacing: '0.5px',
            color: 'text.primary',
          }}
        >
          {message}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.5px',
          }}
        >
          API STATUS: ACTIVE // INFERENCE IN PROGRESS
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoadingOverlay;
