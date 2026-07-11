import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Divider, useTheme, Stack } from '@mui/material';

const StatisticsCard = ({ predictions = [], summary = null, selectedImage = null }) => {
  const theme = useTheme();
  const totalDetected = predictions.length;
  
  // Animated Count-Up Hook for headline
  const [animatedCount, setAnimatedCount] = useState(0);

  useEffect(() => {
    if (totalDetected === 0) {
      setAnimatedCount(0);
      return;
    }

    let startTimestamp = null;
    const duration = 300; // 300ms count-up
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedCount(Math.floor(easeProgress * totalDetected));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setAnimatedCount(totalDetected);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [totalDetected]);

  // Confidence calculations
  const averageConfidence = totalDetected > 0
    ? predictions.reduce((sum, p) => sum + p.confidence, 0) / totalDetected
    : 0;

  const highestConfidence = totalDetected > 0
    ? Math.max(...predictions.map(p => p.confidence))
    : 0;

  const lowestConfidence = totalDetected > 0
    ? Math.min(...predictions.map(p => p.confidence))
    : 0;

  const toPercent = (val) => `${Math.round(val * 100)}%`;

  // Confidence distribution histogram bins (e.g. 80-85, 85-90, 90-95, 95-100)
  const bins = {
    '95–100%': 0,
    '90–95%': 0,
    '85–90%': 0,
    '80–85%': 0,
    '< 80%': 0
  };

  predictions.forEach((p) => {
    const confPercent = p.confidence * 100;
    if (confPercent >= 95) bins['95–100%']++;
    else if (confPercent >= 90) bins['90–95%']++;
    else if (confPercent >= 85) bins['85–90%']++;
    else if (confPercent >= 80) bins['80–85%']++;
    else bins['< 80%']++;
  });

  const maxBinCount = Math.max(...Object.values(bins), 1);

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
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
        
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 700, 
            letterSpacing: '0.05em',
            color: 'text.secondary',
            textTransform: 'uppercase',
          }}
        >
          Analytics & metrics
        </Typography>

        {totalDetected > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Primary KPI Card: Large Particles Count */}
            <Box>
              <Typography 
                variant="h2" 
                fontWeight={800} 
                sx={{ 
                  fontFamily: 'Inter, sans-serif', 
                  color: 'primary.main',
                  lineHeight: 0.9,
                  fontSize: '3.25rem', // 52px
                }}
              >
                {animatedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                Particles detected
              </Typography>
            </Box>

            {/* Secondary KPIs stacked list */}
            <Stack spacing={1.25} sx={{ mt: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Average confidence</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ color: 'text.primary', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                  {toPercent(averageConfidence)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Highest confidence</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ color: 'success.main', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                  {toPercent(highestConfidence)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Lowest confidence</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ color: 'warning.main', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                  {toPercent(lowestConfidence)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
              Waiting for analysis...
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 0.25 }} />

        {/* Confidence distribution histogram */}
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 700, 
            letterSpacing: '0.05em',
            color: 'text.secondary',
            textTransform: 'uppercase',
          }}
        >
          Confidence distribution
        </Typography>

        {totalDetected > 0 ? (
          <Stack spacing={1} sx={{ py: 0.5 }}>
            {Object.entries(bins).map(([binLabel, count]) => {
              const percentage = (count / maxBinCount) * 100;
              return (
                <Box key={binLabel} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="caption" sx={{ width: 50, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'text.secondary' }}>
                    {binLabel}
                  </Typography>
                  <Box sx={{ flex: 1, height: 6, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 99, overflow: 'hidden' }}>
                    <Box 
                      sx={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        bgcolor: 'primary.main', 
                        borderRadius: 99,
                        background: 'linear-gradient(90deg, #10B981 0%, #06B6D4 100%)',
                        transition: 'width 0.3s ease'
                      }} 
                    />
                  </Box>
                  <Typography variant="caption" sx={{ width: 15, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', fontWeight: 600, textAlign: 'right' }}>
                    {count}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
              No distribution data
            </Typography>
          </Box>
        )}

        {/* Inference Metadata */}
        {selectedImage && totalDetected > 0 && (
          <>
            <Divider sx={{ my: 0.25 }} />
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 700, 
                letterSpacing: '0.05em',
                color: 'text.secondary',
                textTransform: 'uppercase',
              }}
            >
              Inference metadata
            </Typography>
            <Stack spacing={0.75}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Model</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}>roboflow-workflow-v3</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Latency</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}>
                  {summary ? `${summary.processingTimeMs} ms` : '—'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Resolution</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem' }}>
                  {selectedImage.width} × {selectedImage.height} px
                </Typography>
              </Box>
            </Stack>
          </>
        )}

      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
