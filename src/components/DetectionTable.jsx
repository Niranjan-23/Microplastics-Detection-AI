import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Box,
  TablePagination,
  TextField,
  InputAdornment
} from '@mui/material';
import GridOnIcon from '@mui/icons-material/GridOn';
import SearchIcon from '@mui/icons-material/Search';

const classColors = {
  fiber: '#10B981',
  fragment: '#3B82F6',
  pellet: '#F59E0B',
  bead: '#F59E0B',
  film: '#EC4899',
  items: '#06B6D4'
};

const getThemeColor = (className) => {
  return classColors[className.toLowerCase()] || '#94A3B8';
};

const DetectionTable = ({ predictions = [], hoveredPredictionId, onRowHover, onRowLeave }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [orderBy, setOrderBy] = useState('id');
  const [order, setOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sort logic
  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    let valA = a[orderBy];
    let valB = b[orderBy];

    // For ID, split to sort numerically
    if (orderBy === 'id' && typeof valA === 'string' && typeof valB === 'string') {
      const numA = parseInt(valA.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(valB.replace(/\D/g, ''), 10) || 0;
      return numB < numA ? -1 : numB > numA ? 1 : 0;
    }

    if (valB < valA) return -1;
    if (valB > valA) return 1;
    return 0;
  };

  // Search filtering
  const filteredPredictions = predictions.filter((p) => {
    const query = searchQuery.toLowerCase();
    return p.id.toLowerCase().includes(query) || p.class.toLowerCase().includes(query);
  });

  const sortedPredictions = stableSort(filteredPredictions, getComparator(order, orderBy));
  const paginatedPredictions = sortedPredictions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getConfidenceBadgeStyles = (conf) => {
    if (conf >= 0.90) {
      return {
        color: '#22C55E', // Green
        bgColor: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.15)',
        text: 'HIGH'
      };
    } else if (conf >= 0.75) {
      return {
        color: '#F59E0B', // Amber
        bgColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.15)',
        text: 'MEDIUM'
      };
    } else {
      return {
        color: '#EF4444', // Red
        bgColor: 'rgba(239, 68, 68, 0.08)',
        borderColor: 'rgba(239, 68, 68, 0.15)',
        text: 'LOW'
      };
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 0,
        border: '1px solid',
        borderColor: 'divider',
        background: 'background.paper',
        overflow: 'hidden',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.24)'
            : '0 8px 32px rgba(148, 163, 184, 0.04)',
      }}
    >
      {/* Table Header toolbar */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GridOnIcon color="primary" sx={{ fontSize: 18 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Specimen Particle Register {predictions.length > 0 && `(${predictions.length} particles)`}
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Filter by ID or category..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          disabled={predictions.length === 0}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }
          }}
          sx={{
            width: { xs: '100%', sm: 240 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
              fontSize: '0.75rem',
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0B0F14' : '#F8FAFC',
              '& fieldset': {
                borderColor: 'divider',
              },
            }
          }}
        />
      </Box>

      {predictions.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No particles registered. Load a specimen to populate register log.
          </Typography>
        </Box>
      ) : filteredPredictions.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No registered particles match filter criteria.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer className="dark-scrollbar" sx={{ width: '100%' }}>
            <Table size="small" aria-label="particle register logs">
              <TableHead>
                <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                  <TableCell sx={{ fontWeight: 600, py: 1.25, borderColor: 'divider' }}>
                    <TableSortLabel
                      active={orderBy === 'id'}
                      direction={orderBy === 'id' ? order : 'asc'}
                      onClick={() => handleRequestSort('id')}
                      sx={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}
                    >
                      ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.25, borderColor: 'divider', fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Morphology Category
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, py: 1.25, borderColor: 'divider' }}>
                    <TableSortLabel
                      active={orderBy === 'confidence'}
                      direction={orderBy === 'confidence' ? order : 'asc'}
                      onClick={() => handleRequestSort('confidence')}
                      sx={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}
                    >
                      Confidence
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 1.25, borderColor: 'divider', fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Center X
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 1.25, borderColor: 'divider', fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Center Y
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 1.25, borderColor: 'divider', fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Width
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, py: 1.25, borderColor: 'divider', fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                    Height
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPredictions.map((row) => {
                  const isHovered = row.id === hoveredPredictionId;
                  const themeColor = getThemeColor(row.class);
                  const badge = getConfidenceBadgeStyles(row.confidence);

                  return (
                    <TableRow
                      key={row.id}
                      onMouseEnter={() => onRowHover(row.id)}
                      onMouseLeave={onRowLeave}
                      sx={{
                        cursor: 'crosshair',
                        backgroundColor: isHovered
                          ? (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(16, 185, 129, 0.02)'
                          : 'transparent',
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'
                        }
                      }}
                    >
                      <TableCell sx={{ py: 1.25, borderColor: 'divider', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 600 }}>
                        {row.id}
                      </TableCell>

                      <TableCell sx={{ py: 1.25, borderColor: 'divider', fontSize: '0.75rem', fontWeight: 500 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: themeColor }} />
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'capitalize', fontWeight: 500 }}>
                            {row.class}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 1.25, borderColor: 'divider' }}>
                        <Box
                          className="confidence-pill"
                          sx={{
                            color: badge.color,
                            bgcolor: badge.bgColor,
                            border: '1px solid',
                            borderColor: badge.borderColor,
                          }}
                        >
                          <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: badge.color }} />
                          {Math.round(row.confidence * 100)}% ({badge.text})
                        </Box>
                      </TableCell>

                      <TableCell align="right" sx={{ py: 1.25, borderColor: 'divider', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {row.x.toFixed(1)} px
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.25, borderColor: 'divider', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {row.y.toFixed(1)} px
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.25, borderColor: 'divider', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {row.width.toFixed(1)} px
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.25, borderColor: 'divider', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                        {row.height.toFixed(1)} px
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredPredictions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              fontSize: '0.7rem',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.7rem',
                color: 'text.secondary'
              }
            }}
          />
        </>
      )}
    </Paper>
  );
};

export default DetectionTable;
