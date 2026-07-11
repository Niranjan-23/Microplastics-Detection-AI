import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import ScienceIcon from '@mui/icons-material/Science';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import TimerIcon from '@mui/icons-material/Timer';

const SummaryCards = ({ summary }) => {
  const {
    totalDetected = 0,
    averageConfidence = 0,
    resolution = '—',
    processingTimeMs = 0
  } = summary || {};

  const cards = [
    {
      title: 'Total Microplastics',
      value: totalDetected,
      icon: <ScienceIcon sx={{ fontSize: 28 }} />,
      color: '#0284c7', // Sky Blue
      bgGlow: 'rgba(2, 132, 199, 0.06)',
      unit: 'Particles'
    },
    {
      title: 'Average Confidence',
      value: totalDetected > 0 ? `${Math.round(averageConfidence * 100)}%` : '—',
      icon: <AnalyticsIcon sx={{ fontSize: 28 }} />,
      color: '#0d9488', // Teal
      bgGlow: 'rgba(13, 148, 136, 0.06)',
      unit: 'Certainty'
    },
    {
      title: 'Image Resolution',
      value: resolution,
      icon: <AspectRatioIcon sx={{ fontSize: 28 }} />,
      color: '#8b5cf6', // Violet
      bgGlow: 'rgba(139, 92, 246, 0.06)',
      unit: 'Original Pixels'
    },
    {
      title: 'Processing Time',
      value: processingTimeMs > 0 ? `${processingTimeMs} ms` : '—',
      icon: <TimerIcon sx={{ fontSize: 28 }} />,
      color: '#f59e0b', // Amber
      bgGlow: 'rgba(245, 158, 11, 0.06)',
      unit: 'Latency'
    }
  ];

  return (
    <Grid container spacing={2} sx={{ width: '100%' }}>
      {cards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) => 
                theme.palette.mode === 'dark' 
                  ? 'rgba(30, 41, 59, 0.4)' 
                  : '#ffffff',
              boxShadow: (theme) => 
                theme.palette.mode === 'dark' 
                  ? `0 4px 15px rgba(0, 0, 0, 0.3), inset 0 0 12px ${card.bgGlow}`
                  : `0 4px 15px rgba(148, 163, 184, 0.05), inset 0 0 12px ${card.bgGlow}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: (theme) => 
                  theme.palette.mode === 'dark' 
                    ? `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 4px ${card.color}`
                    : `0 8px 24px rgba(148, 163, 184, 0.15), 0 0 4px ${card.color}`,
              }
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      display: 'block',
                      mb: 1
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      fontFamily: card.title.includes('Resolution') || card.title.includes('Time') 
                        ? 'JetBrains Mono, monospace' 
                        : 'inherit'
                    }}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {card.unit}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 2.5,
                    color: card.color,
                    background: card.bgGlow,
                    border: '1px solid',
                    borderColor: (theme) => 
                      theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  {card.icon}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;
