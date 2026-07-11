import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  IconButton,
  Stack,
  Divider,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import ClearIcon from '@mui/icons-material/Clear';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const UploadCard = ({ onImageSelected, onDetect, selectedImage, isAnalyzing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Unsupported format. Only PNG, JPG, and JPEG images are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size allowed is 20 MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const base64DataUrl = event.target.result;

      const img = new Image();
      img.onload = () => {
        onImageSelected({
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          dataUrl: base64DataUrl,
          rawBase64: base64DataUrl.split(',')[1],
        });
      };
      img.src = base64DataUrl;
    };

    reader.onerror = () => {
      setError('Failed to read the image file.');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (!isAnalyzing) {
      fileInputRef.current.click();
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        background: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'text.secondary',
            textTransform: 'uppercase',
          }}
        >
          Specimen Source
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0.25, borderRadius: 1.5 }}>
            {error}
          </Alert>
        )}

        {/* Premium Drag & Drop Area */}
        <Box
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              triggerFileInput();
            }
          }}
          tabIndex={isAnalyzing ? -1 : 0}
          role="button"
          aria-label="Upload specimen image"
          sx={{
            position: 'relative',
            border: '1.5px dashed',
            borderColor: (theme) =>
              dragActive
                ? 'primary.main'
                : theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            borderRadius: 0,
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            overflow: 'hidden',
            background: (theme) =>
              dragActive
                ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.02)')
                : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)'),
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: isAnalyzing ? 'none' : 'primary.main',
              background: (theme) =>
                isAnalyzing ? 'none' : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'),
              transform: isAnalyzing ? 'none' : 'scale(0.995)',
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png, .jpg, .jpeg"
            style={{ display: 'none' }}
            onChange={handleChange}
            disabled={isAnalyzing}
          />

          {!selectedImage ? (
            <Stack spacing={1.5} sx={{ alignItems: 'center', p: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '50%',
                  background: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" fontWeight={500} color="text.primary">
                  Drag and drop image, or <span style={{ color: '#10B981', fontWeight: 600 }}>browse</span>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: '0.7rem' }}>
                  Supports PNG, JPG, JPEG up to 20MB
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <Box
                component="img"
                src={selectedImage.dataUrl}
                alt="Uploaded Specimen"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.3)',
                  opacity: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1,
                  }
                }}
              >
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                  Click to replace image
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={clearSelection}
                disabled={isAnalyzing}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(18, 24, 33, 0.75)',
                  backdropFilter: 'blur(4px)',
                  color: 'text.primary',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                  }
                }}
              >
                <ClearIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          )}
        </Box>

        {selectedImage && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  display: 'block',
                  mb: 1
                }}
              >
                Image Metadata
              </Typography>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="caption" fontWeight={500} sx={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedImage.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Resolution</Typography>
                  <Typography variant="caption" fontWeight={500} sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedImage.width} × {selectedImage.height} px
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">File Size</Typography>
                  <Typography variant="caption" fontWeight={500} sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatFileSize(selectedImage.size)}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={onDetect}
              disabled={isAnalyzing}
              sx={{
                py: 1.25,
                borderRadius: 0,
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                }
              }}
            >
              Analyze Image
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadCard;
