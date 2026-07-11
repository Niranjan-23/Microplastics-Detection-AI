import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Tooltip,
  IconButton,
  Stack,
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import BiotechIcon from '@mui/icons-material/Biotech';

const ImagePreview = ({
  selectedImage,
  predictions = [],
  hoveredPredictionId = null,
  isAnalyzing = false,
  showDetections = true,
  setShowDetections = () => { },
  onDownload = () => { },
  onCopyReport = () => { },
  hasResult = false,
  onReset = () => { }
}) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationProgress, setAnimationProgress] = useState(1);

  // Trigger bounding boxes opening/scaling animation when predictions update
  useEffect(() => {
    if (predictions.length > 0) {
      let start = null;
      const duration = 200; // 200ms spring animation
      let animationFrameId;

      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        setAnimationProgress(progress);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrameId);
    } else {
      setAnimationProgress(1);
    }
  }, [predictions]);

  // Update canvas sizing to map perfectly over the loaded HTML img tag
  const updateCanvasDimensions = () => {
    if (imageRef.current && canvasRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
      setDimensions({ width: rect.width, height: rect.height });
    }
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions();
    });

    if (imageRef.current) {
      resizeObserver.observe(imageRef.current);
    }

    return () => {
      if (imageRef.current) {
        resizeObserver.unobserve(imageRef.current);
      }
    };
  }, [imageLoaded, predictions]);

  // Render detections onto overlays
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !selectedImage || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showDetections || predictions.length === 0) return;

    const scaleX = canvas.width / selectedImage.width;
    const scaleY = canvas.height / selectedImage.height;

    predictions.forEach((pred) => {
      const isHovered = pred.id === hoveredPredictionId;

      // Animate box growth on initial render
      const animatedW = pred.width * scaleX * animationProgress;
      const animatedH = pred.height * scaleY * animationProgress;
      const x = (pred.x - (pred.width * animationProgress) / 2) * scaleX;
      const y = (pred.y - (pred.height * animationProgress) / 2) * scaleY;

      // Color scheme based on microplastic class
      let boxColor = 'rgba(16, 185, 129, 0.85)'; // Emerald Default
      let fillColor = 'rgba(16, 185, 129, 0.05)';
      const lowerClass = pred.class.toLowerCase();

      if (lowerClass === 'fiber') {
        boxColor = 'rgba(16, 185, 129, 0.85)'; // Emerald
        fillColor = 'rgba(16, 185, 129, 0.05)';
      } else if (lowerClass === 'fragment') {
        boxColor = 'rgba(59, 130, 246, 0.85)'; // Blue
        fillColor = 'rgba(59, 130, 246, 0.05)';
      } else if (lowerClass === 'pellet' || lowerClass === 'bead') {
        boxColor = 'rgba(245, 158, 11, 0.85)'; // Amber
        fillColor = 'rgba(245, 158, 11, 0.05)';
      } else if (lowerClass === 'film') {
        boxColor = 'rgba(236, 72, 153, 0.85)'; // Pink
        fillColor = 'rgba(236, 72, 153, 0.05)';
      }

      if (isHovered) {
        boxColor = 'rgba(239, 68, 68, 1)'; // Red Highlight on Hover
        fillColor = 'rgba(239, 68, 68, 0.2)';
      }

      // Draw bounding box
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.strokeStyle = boxColor;
      ctx.fillStyle = fillColor;

      ctx.beginPath();
      ctx.roundRect(x, y, animatedW, animatedH, 4);
      ctx.fill();
      ctx.stroke();

      // Bounding box labels
      if (showLabels && (showDetections || isHovered)) {
        ctx.font = '600 9px JetBrains Mono, monospace';
        const labelText = `${pred.id}: ${pred.class} (${Math.round(pred.confidence * 100)}%)`;
        const textWidth = ctx.measureText(labelText).width;

        ctx.fillStyle = boxColor;
        const labelY = y - 4 > 10 ? y - 4 : y + 10;

        ctx.beginPath();
        ctx.roundRect(x, labelY - 9, textWidth + 6, 12, 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, x + 3, labelY);
      }
    });
  }, [predictions, hoveredPredictionId, selectedImage, imageLoaded, showDetections, showLabels, animationProgress]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setTimeout(updateCanvasDimensions, 50);
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.25, 0.75));

  // Compute average confidence
  const averageConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    : 0;

  return (
    <Card
      elevation={0}
      ref={containerRef}
      className={`scanner-container ${isAnalyzing ? 'scanning-active' : ''}`}
      sx={{
        position: 'relative',
        borderRadius: 0,
        height: 380,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#121821',
        overflow: 'hidden',
      }}
    >
      {/* Visual Scanning Laser & overlay under inference */}
      {isAnalyzing && <Box className="scanner-line" />}

      {isAnalyzing ? (
        <Stack spacing={2} sx={{ alignItems: 'center', zIndex: 10 }}>
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress size={48} thickness={2} sx={{ color: 'primary.main' }} />
            <BiotechIcon sx={{ position: 'absolute', fontSize: 22, color: 'primary.main', animation: 'pulse-glow 1.5s infinite ease-in-out' }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Analyzing Microscopic Specimen...
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>
              ROBOFLOW SPECTROSCOPY CORE ACTIVE
            </Typography>
          </Box>
        </Stack>
      ) : selectedImage ? (
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxWidth: '90%',
            maxHeight: '90%',
            transform: `scale(${zoomScale})`,
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Box
            component="img"
            ref={imageRef}
            src={selectedImage.dataUrl}
            onLoad={handleImageLoad}
            alt="Microscope Inference Hero"
            sx={{
              maxWidth: '100%',
              maxHeight: 330,
              display: 'block',
              objectFit: 'contain',
              borderRadius: 1,
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        </Box>
      ) : (
        <Stack spacing={2} sx={{ alignItems: 'center', color: 'text.secondary', p: 4, zIndex: 1 }}>
          <PhotoLibraryIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.25 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              Microscope Stage Empty
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              Please select a specimen capture on the left panel to trigger AI analysis
            </Typography>
          </Box>
        </Stack>
      )}

      {/* Floating Info Chips (Bottom-Left) */}
      {selectedImage && !isAnalyzing && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 30,
            pointerEvents: 'none'
          }}
        >
          {predictions.length > 0 ? (
            <>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 99, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', fontFamily: 'JetBrains Mono, monospace' }}>
                  {predictions.length} PARTICLES
                </Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 99, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', fontFamily: 'JetBrains Mono, monospace' }}>
                  {Math.round(averageConfidence * 100)}% MEAN CONF
                </Typography>
              </Box>
            </>
          ) : (
            <Box sx={{ px: 1.5, py: 0.5, borderRadius: 99, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'JetBrains Mono, monospace' }}>
                AWAITING ANALYSIS
              </Typography>
            </Box>
          )}
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: 99, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontFamily: 'JetBrains Mono, monospace' }}>
              {selectedImage.width}×{selectedImage.height} PX
            </Typography>
          </Box>
        </Stack>
      )}

      {/* Floating Control Badges (Top-Right) */}
      {selectedImage && !isAnalyzing && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 30,
            background: 'rgba(18, 24, 33, 0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 0,
            p: 0.4
          }}
        >
          <Tooltip title={showDetections ? "Hide Bounding Boxes" : "Show Bounding Boxes"}>
            <IconButton
              size="small"
              onClick={() => setShowDetections(!showDetections)}
              color={showDetections ? "primary" : "default"}
              sx={{ p: 0.5, borderRadius: 1 }}
            >
              {showDetections ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title={showLabels ? "Hide Particle Labels" : "Show Particle Labels"}>
            <IconButton
              size="small"
              onClick={() => setShowLabels(!showLabels)}
              color={showLabels ? "primary" : "default"}
              disabled={!showDetections}
              sx={{ p: 0.5, borderRadius: 1 }}
            >
              {showLabels ? <CenterFocusStrongIcon fontSize="small" /> : <CenterFocusWeakIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Box sx={{ width: 1, bgcolor: 'rgba(255, 255, 255, 0.08)', mx: 0.5, my: 0.25 }} />

          <Tooltip title="Zoom In">
            <IconButton size="small" onClick={handleZoomIn} sx={{ p: 0.5, borderRadius: 1 }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton size="small" onClick={handleZoomOut} sx={{ p: 0.5, borderRadius: 1 }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      {/* Floating Action Overlay (Bottom-Right) */}
      {hasResult && !isAnalyzing && (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 30,
            background: 'rgba(18, 24, 33, 0.65)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 0,
            p: 0.4
          }}
        >
          <Tooltip title="Copy Report Clipboard">
            <IconButton size="small" onClick={onCopyReport} sx={{ p: 0.5, borderRadius: 1, color: 'primary.main' }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download Annotated Image">
            <IconButton size="small" onClick={onDownload} sx={{ p: 0.5, borderRadius: 1, color: 'primary.main' }}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear Analysis / Reset">
            <IconButton size="small" onClick={onReset} sx={{ p: 0.5, borderRadius: 1, color: 'error.main' }}>
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Card>
  );
};

export default ImagePreview;
