/**
 * Enterprise Database Testing UI Component
 * Provides interface for database seeding, snapshots, and query execution
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Input, Textarea, Select } from './Input';
import { Tabs, TabPanel } from './Tabs';
import { Badge } from './Badge';
import { Modal, ModalFooter } from './Modal';
import { useToast } from './Toast';

interface DatabaseConnection {
  id: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'oracle';
  database: string;
  host: string;
  port: number;
  user: string;
  password: string;
}

interface Snapshot {
  name: string;
  timestamp: Date;
  database: string;
  tableCount: number;
}

export const DatabaseTesting: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('connection');
  const [connections, setConnections] = React.useState<DatabaseConnection[]>([]);
  const [activeConnection, setActiveConnection] = React.useState<string | null>(null);
  const [snapshots, setSnapshots] = React.useState<Snapshot[]>([]);
  const [showConnectionModal, setShowConnectionModal] = React.useState(false);
  const { showToast } = useToast();

  // Connection state
  const [dbType, setDbType] = React.useState<string>('postgresql');
  const [host, setHost] = React.useState('localhost');
  const [port, setPort] = React.useState('5432');
  const [database, setDatabase] = React.useState('');
  const [user, setUser] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Query state
  const [query, setQuery] = React.useState('');
  const [queryResult, setQueryResult] = React.useState<any>(null);
  const [isExecuting, setIsExecuting] = React.useState(false);

  // Seed state
  const [seedTable, setSeedTable] = React.useState('');
  const [seedData, setSeedData] = React.useState('[]');
  const [truncateFirst, setTruncateFirst] = React.useState(false);

  // Snapshot state
  const [snapshotName, setSnapshotName] = React.useState('');
  const [includeData, setIncludeData] = React.useState(true);

  const tabs = [
    { id: 'connection', label: 'Connection', icon: '🔌' },
    { id: 'query', label: 'Query', icon: '📝' },
    { id: 'seed', label: 'Seed Data', icon: '🌱' },
    { id: 'snapshot', label: 'Snapshots', icon: '📸' },
  ];

  const handleConnect = async () => {
    try {
      const connectionId = `conn_${Date.now()}`;
      const config = {
        type: dbType,
        host,
        port: parseInt(port),
        database,
        user,
        password,
      };

      const response = await fetch('/api/database/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, config }),
      });

      if (!response.ok) throw new Error('Connection failed');

      const result = await response.json();

      setConnections(prev => [...prev, { id: connectionId, ...config }]);
      setActiveConnection(connectionId);
      setShowConnectionModal(false);

      showToast({
        type: 'success',
        message: 'Connected successfully',
        description: `Connected to ${database}`,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Connection failed',
        description: error.message,
      });
    }
  };

  const handleExecuteQuery = async () => {
    if (!activeConnection) {
      showToast({ type: 'warning', message: 'Please connect to a database first' });
      return;
    }

    setIsExecuting(true);
    try {
      const response = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: activeConnection, query }),
      });

      if (!response.ok) throw new Error('Query execution failed');

      const result = await response.json();
      setQueryResult(result);

      showToast({
        type: 'success',
        message: 'Query executed successfully',
        description: `${result.result.rowCount} rows affected`,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Query execution failed',
        description: error.message,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSeedData = async () => {
    if (!activeConnection) {
      showToast({ type: 'warning', message: 'Please connect to a database first' });
      return;
    }

    try {
      const data = JSON.parse(seedData);
      
      const response = await fetch('/api/database/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: activeConnection,
          source: 'inline',
          data: { [seedTable]: data },
          options: { truncateFirst },
        }),
      });

      if (!response.ok) throw new Error('Seeding failed');

      const result = await response.json();

      showToast({
        type: 'success',
        message: 'Data seeded successfully',
        description: `${result.results[0].insertedCount} rows inserted`,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Seeding failed',
        description: error.message,
      });
    }
  };

  const handleCreateSnapshot = async () => {
    if (!activeConnection) {
      showToast({ type: 'warning', message: 'Please connect to a database first' });
      return;
    }

    try {
      const response = await fetch('/api/database/snapshot/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: activeConnection,
          snapshotName,
          options: { includeData },
        }),
      });

      if (!response.ok) throw new Error('Snapshot creation failed');

      const result = await response.json();
      await loadSnapshots();

      showToast({
        type: 'success',
        message: 'Snapshot created successfully',
        description: `${result.tableCount} tables captured`,
      });

      setSnapshotName('');
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Snapshot creation failed',
        description: error.message,
      });
    }
  };

  const handleRestoreSnapshot = async (name: string) => {
    if (!activeConnection) return;

    try {
      const response = await fetch('/api/database/snapshot/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: activeConnection,
          snapshotName: name,
          options: { truncateFirst: true },
        }),
      });

      if (!response.ok) throw new Error('Snapshot restoration failed');

      showToast({
        type: 'success',
        message: 'Snapshot restored successfully',
        description: `Database restored from ${name}`,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Snapshot restoration failed',
        description: error.message,
      });
    }
  };

  const loadSnapshots = async () => {
    if (!activeConnection) return;

    try {
      const response = await fetch(`/api/database/snapshot/list?connectionId=${activeConnection}`);
      if (!response.ok) throw new Error('Failed to load snapshots');

      const result = await response.json();
      setSnapshots(result.snapshots);
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    }
  };

  React.useEffect(() => {
    if (activeConnection && activeTab === 'snapshot') {
      loadSnapshots();
    }
  }, [activeConnection, activeTab]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Database Testing</h1>
        <Button onClick={() => setShowConnectionModal(true)} leftIcon={<span>➕</span>}>
          New Connection
        </Button>
      </div>

      {/* Active Connection Status */}
      {activeConnection && (
        <Card variant="elevated" padding="sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="success" dot pulse>Connected</Badge>
              <span className="text-sm font-medium">
                {connections.find(c => c.id === activeConnection)?.database}
              </span>
              <Badge variant="primary">
                {connections.find(c => c.id === activeConnection)?.type}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Connection Tab */}
      <TabPanel activeTab={activeTab} tabId="connection">
        <Card>
          <CardHeader>
            <CardTitle>Database Connections</CardTitle>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                <p>No active connections</p>
                <p className="text-sm mt-2">Click "New Connection" to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {connections.map(conn => (
                  <Card
                    key={conn.id}
                    variant={activeConnection === conn.id ? 'outlined' : 'default'}
                    padding="sm"
                    clickable
                    onClick={() => setActiveConnection(conn.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{conn.database}</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {conn.host}:{conn.port}
                        </div>
                      </div>
                      <Badge variant="primary">{conn.type}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Query Tab */}
      <TabPanel activeTab={activeTab} tabId="query">
        <Card>
          <CardHeader>
            <CardTitle>Execute SQL Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                label="SQL Query"
                value={query}
                onChange={e => setQuery(e.target.value)}
                rows={8}
                placeholder="SELECT * FROM users WHERE id = 1"
                isFullWidth
              />

              <Button
                onClick={handleExecuteQuery}
                isLoading={isExecuting}
                disabled={!query || !activeConnection}
                isFullWidth
              >
                Execute Query
              </Button>

              {queryResult && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Result:</h4>
                  <pre className="bg-[var(--color-surface)] p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(queryResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Seed Tab */}
      <TabPanel activeTab={activeTab} tabId="seed">
        <Card>
          <CardHeader>
            <CardTitle>Seed Test Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Table Name"
                value={seedTable}
                onChange={e => setSeedTable(e.target.value)}
                placeholder="users"
                isFullWidth
              />

              <Textarea
                label="Data (JSON Array)"
                value={seedData}
                onChange={e => setSeedData(e.target.value)}
                rows={10}
                placeholder='[{"name": "John", "email": "john@example.com"}]'
                isFullWidth
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="truncate"
                  checked={truncateFirst}
                  onChange={e => setTruncateFirst(e.target.checked)}
                />
                <label htmlFor="truncate" className="text-sm">Truncate table first</label>
              </div>

              <Button
                onClick={handleSeedData}
                disabled={!seedTable || !activeConnection}
                isFullWidth
              >
                Seed Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Snapshot Tab */}
      <TabPanel activeTab={activeTab} tabId="snapshot">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Snapshot Name"
                  value={snapshotName}
                  onChange={e => setSnapshotName(e.target.value)}
                  placeholder="before_test_1"
                  isFullWidth
                />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeData"
                    checked={includeData}
                    onChange={e => setIncludeData(e.target.checked)}
                  />
                  <label htmlFor="includeData" className="text-sm">Include table data</label>
                </div>

                <Button
                  onClick={handleCreateSnapshot}
                  disabled={!snapshotName || !activeConnection}
                  isFullWidth
                >
                  Create Snapshot
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
              {snapshots.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <p>No snapshots available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshots.map(snapshot => (
                    <Card key={snapshot.name} variant="outlined" padding="sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{snapshot.name}</div>
                          <div className="text-sm text-[var(--color-text-secondary)]">
                            {new Date(snapshot.timestamp).toLocaleString()} • {snapshot.tableCount} tables
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRestoreSnapshot(snapshot.name)}
                        >
                          Restore
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Connection Modal */}
      <Modal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        title="New Database Connection"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Database Type"
            value={dbType}
            onChange={e => setDbType(e.target.value)}
            options={[
              { value: 'postgresql', label: 'PostgreSQL' },
              { value: 'mysql', label: 'MySQL' },
              { value: 'mongodb', label: 'MongoDB' },
              { value: 'oracle', label: 'Oracle' },
            ]}
            isFullWidth
          />

          <Input label="Host" value={host} onChange={e => setHost(e.target.value)} isFullWidth />
          <Input label="Port" value={port} onChange={e => setPort(e.target.value)} isFullWidth />
          <Input label="Database" value={database} onChange={e => setDatabase(e.target.value)} isFullWidth />
          <Input label="User" value={user} onChange={e => setUser(e.target.value)} isFullWidth />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} isFullWidth />
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowConnectionModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleConnect}>
            Connect
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
