import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Server, RefreshCw, Download, Filter, Search, Eye, AlertCircle,
  CheckCircle, Clock, Database, Activity, TrendingUp, FileText,
  XCircle, Info, ExternalLink, Calendar, Zap
} from 'lucide-react';
import './Dashboard.css';

interface ExternalAPIConfig {
  id: string;
  name: string;
  apiType: string;
  endpoint: string;
  method: string;
  isActive: boolean;
}

interface APICallLog {
  id: string;
  configId: string;
  configName?: string;
  userId: string;
  endpoint: string;
  method: string;
  requestBody: any;
  responseBody: any;
  statusCode: number;
  duration: number;
  success: boolean;
  error?: string;
  createdAt: string;
}

interface LogStats {
  total: number;
  successful: number;
  failed: number;
  avgDuration: number;
  lastCallTime: string;
}

const API_URL = 'http://localhost:3001/api';

const ExternalServerLogs: React.FC = () => {
  const [configs, setConfigs] = useState<ExternalAPIConfig[]>([]);
  const [logs, setLogs] = useState<APICallLog[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [limit, setLimit] = useState(50);
  const [stats, setStats] = useState<LogStats>({
    total: 0,
    successful: 0,
    failed: 0,
    avgDuration: 0,
    lastCallTime: ''
  });
  const [selectedLog, setSelectedLog] = useState<APICallLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const token = localStorage.getItem('accessToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadConfigs();
    loadLogs();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs(true);
      }, 5000); // Refresh every 5 seconds
      setAutoRefreshInterval(interval);
    } else {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    }
    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [autoRefresh]);

  const loadConfigs = async () => {
    try {
      const response = await axios.get(`${API_URL}/external-api/configs`, { headers });
      setConfigs(response.data?.data || []);
    } catch (error: any) {
      console.error('Failed to load configs:', error?.message || error);
    }
  };

  const loadLogs = async (isAutoRefresh = false) => {
    if (!isAutoRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const params: any = { limit };
      if (selectedConfig) {
        params.configId = selectedConfig;
      }

      const response = await axios.get(`${API_URL}/external-api/logs`, {
        headers,
        params
      });

      const logsData = response.data?.data || [];
      
      // Enrich logs with config names
      const enrichedLogs = logsData.map((log: APICallLog) => {
        const config = configs.find(c => c.id === log.configId);
        return {
          ...log,
          configName: config?.name || 'Unknown Config'
        };
      });

      setLogs(enrichedLogs);
      calculateStats(enrichedLogs);
    } catch (error: any) {
      console.error('Failed to load logs:', error?.message || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (logsData: APICallLog[]) => {
    const successful = logsData.filter(log => log.success).length;
    const failed = logsData.length - successful;
    const avgDuration = logsData.length > 0
      ? logsData.reduce((acc, log) => acc + log.duration, 0) / logsData.length
      : 0;
    const lastCallTime = logsData.length > 0 ? logsData[0].createdAt : '';

    setStats({
      total: logsData.length,
      successful,
      failed,
      avgDuration,
      lastCallTime
    });
  };

  const handleRefresh = () => {
    loadLogs();
  };

  const handleConfigChange = (configId: string | null) => {
    setSelectedConfig(configId);
    setTimeout(() => loadLogs(), 100);
  };

  const viewLogDetails = (log: APICallLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `external-api-logs-${Date.now()}.json`);
    link.click();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (success: boolean) => {
    return success ? '#10b981' : '#ef4444';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.configName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'success' && log.success) ||
      (filterStatus === 'failed' && !log.success);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="view-container">
      <h1 className="view-title">External Server Logs</h1>

      {/* Stats Dashboard */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Activity className="w-8 h-8" style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Total API Calls</div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.successful}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Successful</div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <XCircle className="w-8 h-8" style={{ color: '#ef4444' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.failed}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Failed</div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock className="w-8 h-8" style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{formatDuration(stats.avgDuration)}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Avg Duration</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="content-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            {/* Config Filter */}
            <select
              value={selectedConfig || 'all'}
              onChange={(e) => handleConfigChange(e.target.value === 'all' ? null : e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                minWidth: 200
              }}
            >
              <option value="all">All Configurations</option>
              {configs.map(config => (
                <option key={config.id} value={config.id}>
                  {config.name} ({config.apiType})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="all">All Status</option>
              <option value="success">Success Only</option>
              <option value="failed">Failed Only</option>
            </select>

            {/* Limit */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setTimeout(() => loadLogs(), 100);
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value={10}>Last 10</option>
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
              <option value={500}>Last 500</option>
            </select>

            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search className="w-5 h-5" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search endpoint, method, config..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'btn-approve' : 'btn-secondary'}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title={autoRefresh ? 'Auto-refresh enabled (5s)' : 'Enable auto-refresh'}
            >
              <Zap className="w-4 h-4" />
              {autoRefresh ? 'Auto' : 'Manual'}
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {/* Export Button */}
            <button
              onClick={exportLogs}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {stats.lastCallTime && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar className="w-4 h-4" />
            Last call: {formatDate(stats.lastCallTime)}
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="content-card">
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              <RefreshCw className="w-8 h-8 animate-spin" style={{ margin: '0 auto 12px' }} />
              <div>Loading logs...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              <Database className="w-12 h-12" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No logs found</div>
              <div style={{ fontSize: 14 }}>
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'No API calls have been logged yet'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Config</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Method</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Endpoint</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Status Code</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Duration</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Time</th>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: index % 2 === 0 ? 'white' : '#fafafa'
                    }}
                  >
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: getStatusColor(log.success) }}>
                        {getStatusIcon(log.success)}
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{log.configName}</span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: log.method === 'GET' ? '#dbeafe' : log.method === 'POST' ? '#d1fae5' : log.method === 'PUT' ? '#fef3c7' : '#fee2e2',
                        color: log.method === 'GET' ? '#1e40af' : log.method === 'POST' ? '#065f46' : log.method === 'PUT' ? '#92400e' : '#991b1b'
                      }}>
                        {log.method}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontSize: 13, fontFamily: 'monospace', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.endpoint}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: log.statusCode < 400 ? '#10b981' : '#ef4444'
                      }}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{ fontSize: 12 }}>{formatDuration(log.duration)}</span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => viewLogDetails(log)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredLogs.length > 0 && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {showDetailsModal && selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 900,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText className="w-6 h-6" />
                Log Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  padding: '6px 12px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: 600
                }}
              >
                ×
              </button>
            </div>

            {/* Status Banner */}
            <div style={{
              padding: 16,
              borderRadius: 8,
              background: selectedLog.success ? '#f0fdf4' : '#fef2f2',
              border: `2px solid ${selectedLog.success ? '#86efac' : '#fca5a5'}`,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {getStatusIcon(selectedLog.success)}
                <span style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: selectedLog.success ? '#166534' : '#991b1b'
                }}>
                  {selectedLog.success ? 'Successful API Call' : 'Failed API Call'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: selectedLog.success ? '#166534' : '#991b1b', opacity: 0.8 }}>
                {formatDate(selectedLog.createdAt)}
              </div>
            </div>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Configuration</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedLog.configName}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Method</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedLog.method}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Status Code</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedLog.statusCode}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Duration</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDuration(selectedLog.duration)}</div>
              </div>
            </div>

            {/* Endpoint */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Endpoint</div>
              <div style={{
                padding: 12,
                background: '#f9fafb',
                borderRadius: 6,
                fontSize: 13,
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {selectedLog.endpoint}
              </div>
            </div>

            {/* Request Body */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Request Body</div>
              <div style={{
                padding: 12,
                background: '#f9fafb',
                borderRadius: 6,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedLog.requestBody, null, 2)}
                </pre>
              </div>
            </div>

            {/* Response Body */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Response Body</div>
              <div style={{
                padding: 12,
                background: '#f9fafb',
                borderRadius: 6,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(selectedLog.responseBody, null, 2)}
                </pre>
              </div>
            </div>

            {/* Error */}
            {selectedLog.error && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Error Message</div>
                <div style={{
                  padding: 12,
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: 6,
                  color: '#991b1b',
                  fontSize: 13
                }}>
                  {selectedLog.error}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowDetailsModal(false)}
              className="btn-primary"
              style={{ width: '100%', padding: '10px 16px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalServerLogs;
