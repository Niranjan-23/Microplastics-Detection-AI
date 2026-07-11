import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  IconButton,
  useTheme,
  Alert,
  Tooltip,
  Snackbar,
  Button
} from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import UploadCard from '../components/UploadCard';
import ImagePreview from '../components/ImagePreview';
import StatisticsCard from '../components/StatisticsCard';
import DetectionTable from '../components/DetectionTable';
import { detectMicroplastics } from '../services/roboflowService';

const Dashboard = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();

  // App States
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inferenceResult, setInferenceResult] = useState(null);
  const [error, setError] = useState(null);

  // Hoisted Visual Interaction States
  const [hoveredPredictionId, setHoveredPredictionId] = useState(null);
  const [showDetections, setShowDetections] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const predictions = inferenceResult?.predictions || [];
  const summary = inferenceResult?.summary || null;

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Clear/Reset on Escape
      if (e.key === 'Escape') {
        handleReset();
      }
      // Run detection on Ctrl+Enter
      if (e.key === 'Enter' && e.ctrlKey && selectedImage && !isAnalyzing) {
        handleDetect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, isAnalyzing]);

  const handleImageSelected = (imageDetails) => {
    setSelectedImage(imageDetails);
    setInferenceResult(null);
    setError(null);
  };

  const handleDetect = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setInferenceResult(null);

    try {
      // Call Roboflow Service
      const result = await detectMicroplastics(selectedImage.rawBase64, {
        width: selectedImage.width,
        height: selectedImage.height,
        name: selectedImage.name,
        size: selectedImage.size
      });

      if (result.success) {
        setInferenceResult(result);
        setSnackbar({ open: true, message: `Analysis complete. Identified ${result.summary.totalDetected} microplastics.` });
      } else {
        setError({
          message: 'Analysis returned an invalid result layout.',
          type: 'INVALID_RESULT'
        });
      }
    } catch (err) {
      setError({
        message: err.message || 'An error occurred during spectroscopic analysis.',
        type: err.type || 'UNKNOWN'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setInferenceResult(null);
    setError(null);
  };

  const handleRowHover = (id) => {
    setHoveredPredictionId(id);
  };

  const handleRowLeave = () => {
    setHoveredPredictionId(null);
  };

  // 1. High-resolution canvas merger for downloading the result image
  const handleDownload = () => {
    if (!selectedImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = selectedImage.width;
    canvas.height = selectedImage.height;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      // Draw original uncompressed image
      ctx.drawImage(img, 0, 0);

      if (showDetections && predictions.length > 0) {
        predictions.forEach((pred) => {
          // Bounding box color based on class
          let boxColor = '#10B981'; // Emerald Default
          const lowerClass = pred.class.toLowerCase();
          if (lowerClass === 'fiber') boxColor = '#10B981';
          else if (lowerClass === 'fragment') boxColor = '#3B82F6';
          else if (lowerClass === 'pellet' || lowerClass === 'bead') boxColor = '#F59E0B';
          else if (lowerClass === 'film') boxColor = '#EC4899';

          // Coordinates are centered in Roboflow, convert to top-left
          const w = pred.width;
          const h = pred.height;
          const x = pred.x - pred.width / 2;
          const y = pred.y - pred.height / 2;

          // Draw box relative to original resolution
          const lineWidth = Math.max(3, Math.round(selectedImage.width / 400));
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = boxColor;

          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.stroke();

          // Label
          const fontSize = Math.max(12, Math.round(selectedImage.width / 80));
          ctx.font = `bold ${fontSize}px JetBrains Mono, sans-serif`;
          const text = `${pred.id}: ${pred.class} (${Math.round(pred.confidence * 100)}%)`;
          const textWidth = ctx.measureText(text).width;
          const padding = Math.max(4, Math.round(selectedImage.width / 250));

          // Draw label background
          ctx.fillStyle = boxColor;
          ctx.fillRect(x - lineWidth / 2, y - fontSize - padding * 2, textWidth + padding * 2, fontSize + padding * 2);

          // Draw text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x - lineWidth / 2 + padding, y - padding - 2);
        });
      }

      // Download trigger
      const link = document.createElement('a');
      link.download = `microplastic_analysis_${selectedImage.name || 'capture.png'}`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setSnackbar({ open: true, message: 'High-resolution analysis image downloaded successfully.' });
    };
    img.src = selectedImage.dataUrl;
  };

  // 2. Export detailed analysis report to clipboard
  const handleCopyReport = () => {
    if (!selectedImage) return;

    const reportDate = new Date().toLocaleString();
    let tableRows = '';
    predictions.forEach((p) => {
      tableRows += `| ${p.id} | ${p.class} | ${Math.round(p.confidence * 100)}% | X:${p.x} Y:${p.y} | W:${p.width} H:${p.height} |\n`;
    });

    const report = `==================================================
MICROPLASTIC OPTICAL SPECTROSCOPY REPORT
Generated: ${reportDate}
==================================================

SPECIMEN DETAILS:
- Filename: ${selectedImage.name}
- Image Dimensions: ${selectedImage.width} x ${selectedImage.height} px
- Verification Mode: ${inferenceResult?.mode === 'simulation' ? 'Laboratory Simulation' : 'Roboflow Serverless Workflows API'}

SUMMARY STATISTICS:
- Total Microplastics Detected: ${summary?.totalDetected || 0} particles
- Average Detection Confidence: ${summary ? Math.round(summary.averageConfidence * 100) : 0}%
- Computational Latency: ${summary?.processingTimeMs || 0} ms

DETAILED REGISTER:
| ID | Particle Morphology | Confidence | Coordinates (Center) | Bounding Dimensions |
|----|---------------------|------------|----------------------|---------------------|
${tableRows || '| —  | —                   | —          | —                    | —                   |\n'}
==================================================
REPORT END // MICROPLASTICS LAB MODULE v2.0.0
`;

    navigator.clipboard.writeText(report)
      .then(() => {
        setSnackbar({ open: true, message: 'Detailed Markdown analysis report copied to clipboard.' });
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Failed to copy report to clipboard.' });
      });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Floating Navbar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.25,
          px: 2.5,
          mb: 3,
          borderRadius: 0,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          boxShadow: (theme) => 
            theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.2)' 
              : '0 8px 32px rgba(148, 163, 184, 0.03)',
        }}
      >
        {/* Logo & Subtitle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 0,
              bgcolor: 'primary.main',
              color: '#0B1015',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
            }}
          >
            <BiotechIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'text.primary',
                lineHeight: 1.15
              }}
            >
              Microplastics Detection
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: '0.625rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontWeight: 600,
                display: 'block'
              }}
            >
              AI Spectroscopic Analysis
            </Typography>
          </Box>
        </Box>

        {/* Controls & Badges */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Status dot badge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.25,
              py: 0.4,
              borderRadius: 99,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: isAnalyzing ? 'warning.main' : 'primary.main',
                animation: 'pulse-glow 1.5s infinite ease-in-out'
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                color: 'text.secondary',
                fontSize: '0.65rem',
                letterSpacing: '0.02em'
              }}
            >
              {isAnalyzing ? 'ANALYZING' : 'READY'}
            </Typography>
          </Box>

          {/* Confidence Badge (if data available) */}
          {inferenceResult && (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 1.25,
                py: 0.4,
                borderRadius: 99,
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid',
                borderColor: 'rgba(16, 185, 129, 0.15)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: '0.65rem'
                }}
              >
                CONFIDENCE: {Math.round(inferenceResult.summary.averageConfidence * 100)}%
              </Typography>
            </Box>
          )}

          {/* Primary Detect Button (when image selected but not run) */}
          {selectedImage && !inferenceResult && (
            <Button
              variant="contained"
              size="small"
              onClick={handleDetect}
              disabled={isAnalyzing}
              sx={{
                py: 0.5,
                px: 2,
                borderRadius: 99,
                fontWeight: 600,
                fontSize: '0.75rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                }
              }}
            >
              Analyze Specimen
            </Button>
          )}

          {/* Settings/Theme Toggle */}
          <Tooltip title="Toggle Theme">
            <IconButton
              size="small"
              onClick={toggleDarkMode}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '50%',
                p: 0.6,
              }}
            >
              {darkMode ? <Brightness7Icon sx={{ fontSize: 15 }} color="warning" /> : <Brightness4Icon sx={{ fontSize: 15 }} color="primary" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Global Error Banner */}
      {error && (
        <Alert
          severity="error"
          variant="outlined"
          onClose={() => setError(null)}
          sx={{
            mb: 2.5,
            borderRadius: 1.5,
            fontWeight: 500,
            border: '1px solid',
            borderColor: 'error.light',
            background: 'rgba(239, 68, 68, 0.05)',
            color: 'error.main'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
            Spectroscopy Engine Alert: [{error.type}]
          </Typography>
          {error.message}
        </Alert>
      )}

      {/* Main 3-Column Layout (22% / 56% / 22%) */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2.5, width: '100%', mb: 2.5 }}>

        {/* Column 1: Upload Panel (22%) */}
        <Box sx={{ width: { xs: '100%', lg: '22%' }, display: 'flex', flexDirection: 'column' }}>
          <UploadCard 
            onImageSelected={handleImageSelected} 
            onDetect={handleDetect}
            selectedImage={selectedImage}
            isAnalyzing={isAnalyzing}
          />
        </Box>

        {/* Column 2: Image Preview Hero Panel (56%) */}
        <Box sx={{ width: { xs: '100%', lg: '56%' }, display: 'flex', flexDirection: 'column' }}>
          <ImagePreview 
            selectedImage={selectedImage}
            predictions={predictions}
            hoveredPredictionId={hoveredPredictionId}
            isAnalyzing={isAnalyzing}
            showDetections={showDetections}
            setShowDetections={setShowDetections}
            onDownload={handleDownload}
            onCopyReport={handleCopyReport}
            hasResult={!!inferenceResult}
            onReset={handleReset}
          />
        </Box>

        {/* Column 3: Analytics Panel (22%) */}
        <Box sx={{ width: { xs: '100%', lg: '22%' }, display: 'flex', flexDirection: 'column' }}>
          <StatisticsCard 
            predictions={predictions} 
            summary={summary} 
            selectedImage={selectedImage}
          />
        </Box>
      </Box>

      {/* Bottom Full-Width Table */}
      <Box sx={{ width: '100%' }}>
        <DetectionTable
          predictions={predictions}
          hoveredPredictionId={hoveredPredictionId}
          onRowHover={handleRowHover}
          onRowLeave={handleRowLeave}
        />
      </Box>

      {/* Snackbar for Copy and download outcomes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" sx={{ borderRadius: 1.5, boxShadow: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;
