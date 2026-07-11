import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Stack, 
  Divider, 
  Alert,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ImagePreview from './ImagePreview';
import SummaryCards from './SummaryCards';
import StatisticsCard from './StatisticsCard';
import DetectionTable from './DetectionTable';

import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LayersIcon from '@mui/icons-material/Layers';
import ScienceIcon from '@mui/icons-material/Science';

const DetectionResult = ({ 
  selectedImage, 
  inferenceResult, 
  isAnalyzing, 
  onReset 
}) => {
  const [hoveredPredictionId, setHoveredPredictionId] = useState(null);
  const [showDetections, setShowDetections] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const predictions = inferenceResult?.predictions || [];
  const summary = inferenceResult?.summary || {};

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
          let boxColor = '#0284c7'; // Sky Blue
          if (pred.class.toLowerCase() === 'fiber') boxColor = '#0d9488'; // Teal
          else if (pred.class.toLowerCase() === 'pellet') boxColor = '#f59e0b'; // Amber
          else if (pred.class.toLowerCase() === 'film') boxColor = '#a855f7'; // Purple

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
          ctx.fillRect(x - lineWidth/2, y - fontSize - padding*2, textWidth + padding*2, fontSize + padding*2);

          // Draw text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x - lineWidth/2 + padding, y - padding - 2);
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
    if (!inferenceResult) return;

    const reportDate = new Date().toLocaleString();
    let tableRows = '';
    predictions.forEach((p) => {
      tableRows += `| ${p.id} | ${p.class} | ${Math.round(p.confidence * 100)}% | X:${p.x} Y:${p.y} | W:${p.width} H:${p.height} |\n`;
    });

    const report = `==================================================
MICROPLASTIC INFRARED/OPTICAL DETECTION REPORT
Generated: ${reportDate}
==================================================

SPECIMEN DETAILS:
- Filename: ${selectedImage.name}
- Image Dimensions: ${selectedImage.width} x ${selectedImage.height} px
- Verification Mode: ${inferenceResult.mode === 'simulation' ? 'Laboratory Simulation' : 'Roboflow Workflow API'}

SUMMARY STATISTICS:
- Total Microplastics Detected: ${summary.totalDetected} particles
- Average Detection Confidence: ${Math.round(summary.averageConfidence * 100)}%
- Highest Particle Confidence: ${Math.round(summary.highestConfidence * 100)}%
- Lowest Particle Confidence: ${Math.round(summary.lowestConfidence * 100)}%
- Computational Latency: ${summary.processingTimeMs} ms

DETAILED REGISTER:
| ID | Particle Morphology | Confidence | Coordinates (Center) | Bounding Dimensions |
|----|---------------------|------------|----------------------|---------------------|
${tableRows || '| —  | —                   | —          | —                    | —                   |\n'}
==================================================
REPORT END // MICROPLASTICS LAB MODULE v1.0.0
`;

    navigator.clipboard.writeText(report)
      .then(() => {
        setSnackbar({ open: true, message: 'Detailed Markdown laboratory report copied to clipboard.' });
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Failed to copy report to clipboard.' });
      });
  };

  if (!inferenceResult && !isAnalyzing) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.2)' : '#ffffff',
          boxShadow: (theme) => 
            theme.palette.mode === 'dark' 
              ? '0 4px 20px rgba(0, 0, 0, 0.2)' 
              : '0 4px 20px rgba(148, 163, 184, 0.05)',
          p: 6,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            borderRadius: '50%', 
            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(2, 132, 199, 0.05)' : 'rgba(2, 132, 199, 0.03)',
            color: 'text.secondary',
            mb: 3,
            border: '1px dashed',
            borderColor: 'divider',
            animation: 'pulse-glow 3s infinite ease-in-out',
            '@keyframes pulse-glow': {
              '0%, 100%': { transform: 'scale(1)', opacity: 0.6 },
              '50%': { transform: 'scale(1.05)', opacity: 1 },
            }
          }}
        >
          <LayersIcon sx={{ fontSize: 60, opacity: 0.6 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          Inference Engine Idle
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 350, mb: 3 }}>
          Upload a high-resolution microscope specimen on the left panel and click "Run Microplastics Inference" to begin analysis.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      {/* Top Header Row: Status, Compact Metrics & Actions */}
      {inferenceResult && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            px: 2,
            py: 1,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            background: (theme) => 
              theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.15)' : '#ffffff',
          }}
        >
          {/* Status & Compact Metrics */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse-glow 1.5s infinite ease-in-out' }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontFamily: 'JetBrains Mono, monospace', 
                  fontWeight: 700,
                  color: 'primary.main',
                  mr: 1
                }}
              >
                API ACTIVE
              </Typography>
            </Box>
            
            {/* Slim Metrics Bar */}
            <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'text.secondary' }}>
              COUNT: <span style={{ color: '#10b981', fontWeight: 700 }}>{summary.totalDetected}</span>
              {' • '}
              CONFIDENCE: <span style={{ color: '#10b981', fontWeight: 700 }}>{summary.averageConfidence > 0 ? `${Math.round(summary.averageConfidence * 100)}%` : '—'}</span>
              {' • '}
              RESOL: <span style={{ color: 'inherit', fontWeight: 600 }}>{summary.resolution}</span>
              {' • '}
              SPEED: <span style={{ color: 'inherit', fontWeight: 600 }}>{summary.processingTimeMs}ms</span>
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', lg: 'auto' }, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={handleCopyReport}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', py: 0.5 }}
            >
              Report
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={handleDownload}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', py: 0.5 }}
            >
              Image
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              startIcon={<RestartAltIcon fontSize="small" />}
              onClick={onReset}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', py: 0.5 }}
            >
              Reset
            </Button>
          </Stack>
        </Box>
      )}

      {/* Main Results Layout */}
      {inferenceResult && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
          {/* Row 1: ImagePreview (Full Width, Compact height) */}
          <Box sx={{ width: '100%' }}>
            <ImagePreview 
              selectedImage={selectedImage}
              predictions={predictions}
              hoveredPredictionId={hoveredPredictionId}
              isAnalyzing={isAnalyzing}
              showDetections={showDetections}
              setShowDetections={setShowDetections}
            />
          </Box>

          {/* Row 2: Stats (40% width) & Table (60% width) side-by-side */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, width: '100%', alignItems: 'stretch' }}>
            <Box sx={{ width: { xs: '100%', lg: '40%' }, display: 'flex' }}>
              <StatisticsCard predictions={predictions} summary={summary} />
            </Box>
            <Box sx={{ width: { xs: '100%', lg: '60%' }, display: 'flex', flexGrow: 1 }}>
              <DetectionTable 
                predictions={predictions}
                hoveredPredictionId={hoveredPredictionId}
                onRowHover={handleRowHover}
                onRowLeave={handleRowLeave}
              />
            </Box>
          </Box>
        </Box>
      )}

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
    </Box>
  );
};

export default DetectionResult;
