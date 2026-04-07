import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  Api as ApiIcon,
  Flight as FlightIcon,
  Hotel as HotelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [providers, setProviders] = useState({
    amadeus: { enabled: false, apiKey: '', apiSecret: '', endpoint: '', rateLimit: 100, timeout: 10000 },
    skyscanner: { enabled: false, apiKey: '', apiSecret: '', endpoint: '', rateLimit: 100, timeout: 10000 },
    expedia: { enabled: false, apiKey: '', apiSecret: '', endpoint: '', rateLimit: 100, timeout: 10000 },
    booking: { enabled: false, apiKey: '', apiSecret: '', endpoint: '', rateLimit: 100, timeout: 10000 },
    hotels: { enabled: false, apiKey: '', apiSecret: '', endpoint: '', rateLimit: 100, timeout: 10000 },
    agoda: { enabled: false, apiKey: '', apiSecret: '', endpoint: '', rateLimit: 100, timeout: 10000 },
  });

  const [testResults, setTestResults] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/ota-providers');
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data.providers);
        setTestResults(data.data.testResults || {});
      }
    } catch (error) {
      setMessage({ type: 'error', text: '獲取設置失敗' });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (provider, field, value) => {
    setProviders(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/ota-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ providers })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: '設置保存成功' });
        setTestResults(data.data.testResults || {});
      } else {
        setMessage({ type: 'error', text: data.error?.message || '保存失敗' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存設置時發生錯誤' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider) => {
    try {
      const response = await fetch(`/api/admin/ota-providers/${provider}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: data.success,
          message: data.message,
          timestamp: new Date().toISOString()
        }
      }));

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: false,
          message: '測試連接失敗',
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const handleBulkTest = async () => {
    const results = {};
    
    for (const [provider, config] of Object.entries(providers)) {
      if (config.enabled) {
        try {
          const response = await fetch(`/api/admin/ota-providers/${provider}/test`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
          const data = await response.json();
          results[provider] = {
            success: data.success,
            message: data.message,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          results[provider] = {
            success: false,
            message: '測試連接失敗',
            timestamp: new Date().toISOString()
          };
        }
      }
    }
    
    setTestResults(results);
  };

  const getProviderIcon = (provider) => {
    const icons = {
      amadeus: <FlightIcon />,
      skyscanner: <FlightIcon />,
      expedia: <HotelIcon />,
      booking: <HotelIcon />,
      hotels: <HotelIcon />,
      agoda: <HotelIcon />
    };
    return icons[provider] || <ApiIcon />;
  };

  const getProviderName = (provider) => {
    const names = {
      amadeus: 'Amadeus (航班)',
      skyscanner: 'Skyscanner (航班)',
      expedia: 'Expedia (酒店)',
      booking: 'Booking.com (酒店)',
      hotels: 'Hotels.com (酒店)',
      agoda: 'Agoda (酒店)'
    };
    return names[provider] || provider;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            OTA API 設置管理
          </Typography>
        </Box>

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Provider Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  API 提供商配置
                </Typography>
                
                <Grid container spacing={3}>
                  {Object.entries(providers).map(([provider, config]) => (
                    <Grid item xs={12} md={6} key={provider}>
                      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          {getProviderIcon(provider)}
                          <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                            {getProviderName(provider)}
                          </Typography>
                          <Chip 
                            label={config.enabled ? '已啟用' : '已禁用'} 
                            color={config.enabled ? 'success' : 'default'}
                            size="small"
                            sx={{ ml: 'auto' }}
                          />
                        </Box>

                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.enabled}
                              onChange={(e) => handleProviderChange(provider, 'enabled', e.target.checked)}
                            />
                          }
                          label="啟用此提供商"
                        />

                        {config.enabled && (
                          <Box mt={2}>
                            <TextField
                              fullWidth
                              label="API Key"
                              type="password"
                              value={config.apiKey}
                              onChange={(e) => handleProviderChange(provider, 'apiKey', e.target.value)}
                              margin="normal"
                              size="small"
                            />
                            
                            <TextField
                              fullWidth
                              label="API Secret"
                              type="password"
                              value={config.apiSecret}
                              onChange={(e) => handleProviderChange(provider, 'apiSecret', e.target.value)}
                              margin="normal"
                              size="small"
                            />
                            
                            <TextField
                              fullWidth
                              label="API Endpoint"
                              value={config.endpoint}
                              onChange={(e) => handleProviderChange(provider, 'endpoint', e.target.value)}
                              margin="normal"
                              size="small"
                            />
                            
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label="Rate Limit (requests/min)"
                                  type="number"
                                  value={config.rateLimit}
                                  onChange={(e) => handleProviderChange(provider, 'rateLimit', parseInt(e.target.value))}
                                  margin="normal"
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <TextField
                                  fullWidth
                                  label="Timeout (ms)"
                                  type="number"
                                  value={config.timeout}
                                  onChange={(e) => handleProviderChange(provider, 'timeout', parseInt(e.target.value))}
                                  margin="normal"
                                  size="small"
                                />
                              </Grid>
                            </Grid>

                            <Box mt={2} display="flex" gap={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleTestConnection(provider)}
                                startIcon={testResults[provider]?.success ? <CheckCircleIcon color="success" /> : <WarningIcon />}
                              >
                                測試連接
                              </Button>
                              {testResults[provider] && (
                                <Typography variant="body2" color="text.secondary">
                                  {testResults[provider].message}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Connection Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  連接狀態
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.entries(testResults).map(([provider, result]) => (
                    <Grid item xs={12} sm={6} md={4} key={provider}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          border: result.success ? '2px solid #4CAF50' : '2px solid #f44336'
                        }}
                      >
                        <Box display="flex" alignItems="center" mb={1}>
                          {getProviderIcon(provider)}
                          <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                            {getProviderName(provider)}
                          </Typography>
                          {result.success ? 
                            <CheckCircleIcon color="success" sx={{ ml: 'auto' }} /> : 
                            <ErrorIcon color="error" sx={{ ml: 'auto' }} />
                          }
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {result.message}
                        </Typography>
                        {result.timestamp && (
                          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                            測試時間: {new Date(result.timestamp).toLocaleString('zh-TW')}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Box mt={3} textAlign="center">
                  <Button
                    variant="contained"
                    onClick={handleBulkTest}
                    startIcon={<ApiIcon />}
                    sx={{ mr: 2 }}
                  >
                    批量測試所有提供商
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* API Usage Statistics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  API 使用統計
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        1,234
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        今日API調用次數
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h4" color="success" fontWeight="bold">
                        98.5%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        成功率
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h4" color="warning" fontWeight="bold">
                        45
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        平均響應時間(ms)
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="h4" color="info" fontWeight="bold">
                        6
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        活躍提供商
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  快速操作
                </Typography>
                
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={20} /> : '保存設置'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => window.open('/api/docs', '_blank')}
                  >
                    API 文檔
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<FlightIcon />}
                    onClick={() => window.open('/search-demo', '_blank')}
                  >
                    搜索演示
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box mt={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            💡 提示：請確保所有API密鑰都是有效的，並定期測試連接狀態
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminSettings;