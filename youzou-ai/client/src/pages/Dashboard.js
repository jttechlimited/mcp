import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  AutoAwesome as AutoIcon,
  Payment as PaymentIcon,
  SupportAgent as SupportIcon,
  TrendingUp as TrendingIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  // Mock data for demonstration
  const stats = {
    totalUsers: 1234,
    activeUsers: 856,
    totalSearches: 5678,
    activeAutoCheckers: 234,
    totalRevenue: 45678,
    pendingTickets: 12,
  };

  const recentSearches = [
    { id: 1, user: '張先生', route: 'HKG → NRT', date: '2024-03-29', status: 'completed' },
    { id: 2, user: '李女士', route: 'TPE → ICN', date: '2024-03-28', status: 'completed' },
    { id: 3, user: '王先生', route: 'HKG → BKK', date: '2024-03-27', status: 'processing' },
  ];

  const systemHealth = {
    apiStatus: 'operational',
    databaseStatus: 'operational',
    redisStatus: 'operational',
    uptime: '99.9%',
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}>
        控制台概覽
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2196F3, #64b5f6)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="h6">
                    總用戶數
                  </Typography>
                  <Typography color="white" variant="h3">
                    {stats.totalUsers.toLocaleString()}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #9C27B0, #ba68c8)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="h6">
                    活躍用戶
                  </Typography>
                  <Typography color="white" variant="h3">
                    {stats.activeUsers.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4CAF50, #81c784)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="h6">
                    總搜索次數
                  </Typography>
                  <Typography color="white" variant="h3">
                    {stats.totalSearches.toLocaleString()}
                  </Typography>
                </Box>
                <SearchIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="h6">
                    自動檢查
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.activeAutoCheckers}
                  </Typography>
                </Box>
                <AutoIcon sx={{ fontSize: 35, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="h6">
                    總收入 (HKD)
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    ${stats.totalRevenue.toLocaleString()}
                  </Typography>
                </Box>
                <PaymentIcon sx={{ fontSize: 35, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="h6">
                    待處理工單
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingTickets}
                  </Typography>
                </Box>
                <SupportIcon sx={{ fontSize: 35, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="h6">
                    系統正常運行時間
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {systemHealth.uptime}
                  </Typography>
                </Box>
                <Box sx={{ color: 'success.main' }}>
                  <svg width="35" height="35" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Recent Searches */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                最近搜索記錄
              </Typography>
              <List>
                {recentSearches.map((search) => (
                  <ListItem key={search.id} divider>
                    <ListItemIcon>
                      {search.route.includes('→') ? <FlightIcon /> : <HotelIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1">{search.user}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {search.route}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">{search.date}</Typography>
                          <Chip
                            label={search.status === 'completed' ? '已完成' : '處理中'}
                            size="small"
                            color={search.status === 'completed' ? 'success' : 'warning'}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                系統狀態
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  API 服務
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4CAF50',
                    },
                  }}
                />
                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                  正常運行
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  數據庫連接
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4CAF50',
                    },
                  }}
                />
                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                  正常運行
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Redis 緩存
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4CAF50',
                    },
                  }}
                />
                <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}>
                  正常運行
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;