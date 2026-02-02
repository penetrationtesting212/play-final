import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle, XCircle, AlertTriangle, Play, Save, Download, Upload, 
  Plus, Edit2, Trash2, Filter, Search, Copy, Eye, EyeOff, Settings,
  RefreshCw, FileText, Shield, Target, Database
} from 'lucide-react';
import './Dashboard.css';

interface ValidationRule {
  id: string;
  fieldName: string;
  fieldType: string;
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string;
    errorMessage?: string;
  };
}

interface TestDataItem {
  id: string;
  suiteId: string;
  name: string;
  environment: string;
  type: string;
  data: Record<string, any>;
  validationResults?: ValidationResult[];
}

interface ValidationResult {
  fieldName: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  value: any;
}

interface TestSuite {
  id: string;
  name: string;
  description?: string;
}

const API_URL = 'http://localhost:3001/api';

const TestDataValidation: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [testData, setTestData] = useState<TestDataItem[]>([]);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedTestData, setSelectedTestData] = useState<TestDataItem | null>(null);
  const [validationInProgress, setValidationInProgress] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnv, setFilterEnv] = useState('all');
  const [filterValidation, setFilterValidation] = useState('all'); // all, valid, invalid, not-validated
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [ruleForm, setRuleForm] = useState<ValidationRule>({
    id: '',
    fieldName: '',
    fieldType: 'text',
    rules: {}
  });

  const token = localStorage.getItem('accessToken');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load test suites
      const suitesRes = await axios.get(`${API_URL}/testdata/suites`, { headers });
      const suites = (suitesRes.data?.data || []).map((s: any) => ({ 
        id: s.id, 
        name: s.name, 
        description: s.description || '' 
      }));
      setTestSuites(suites);
      if (!selectedSuite && suites.length > 0) setSelectedSuite(suites[0]);

      // Load test data
      const dataRes = await axios.get(`${API_URL}/testdata/data`, { headers });
      const list = (dataRes.data?.data || []).map((d: any) => ({
        id: d.id,
        suiteId: d.suiteId,
        name: d.name,
        environment: d.environment,
        type: d.type,
        data: typeof d.data === 'string' ? JSON.parse(d.data) : d.data,
        validationResults: d.validationResults || []
      }));
      setTestData(list);

      // Load validation rules from localStorage (in production, use backend)
      const savedRules = localStorage.getItem('validationRules');
      if (savedRules) {
        setValidationRules(JSON.parse(savedRules));
      } else {
        // Initialize with default rules
        setValidationRules(getDefaultValidationRules());
      }
    } catch (error: any) {
      console.error('Failed to load test data:', error?.message || error);
    }
  };

  const getDefaultValidationRules = (): ValidationRule[] => {
    return [
      {
        id: '1',
        fieldName: 'email',
        fieldType: 'email',
        rules: {
          required: true,
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          errorMessage: 'Invalid email format'
        }
      },
      {
        id: '2',
        fieldName: 'password',
        fieldType: 'password',
        rules: {
          required: true,
          minLength: 8,
          maxLength: 128,
          pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
          errorMessage: 'Password must contain uppercase, lowercase, number, and special character'
        }
      },
      {
        id: '3',
        fieldName: 'username',
        fieldType: 'text',
        rules: {
          required: true,
          minLength: 3,
          maxLength: 30,
          pattern: '^[a-zA-Z0-9_-]+$',
          errorMessage: 'Username can only contain letters, numbers, underscores, and hyphens'
        }
      },
      {
        id: '4',
        fieldName: 'phone',
        fieldType: 'tel',
        rules: {
          pattern: '^[0-9]{10}$',
          errorMessage: 'Phone must be 10 digits'
        }
      },
      {
        id: '5',
        fieldName: 'age',
        fieldType: 'number',
        rules: {
          min: 0,
          max: 150,
          errorMessage: 'Age must be between 0 and 150'
        }
      }
    ];
  };

  const validateField = (fieldName: string, value: any, rule: ValidationRule): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required validation
    if (rule.rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.rules.required) {
      return { fieldName, isValid: true, errors, warnings, value };
    }

    // Min length validation
    if (rule.rules.minLength !== undefined && String(value).length < rule.rules.minLength) {
      errors.push(`${fieldName} must be at least ${rule.rules.minLength} characters`);
    }

    // Max length validation
    if (rule.rules.maxLength !== undefined && String(value).length > rule.rules.maxLength) {
      errors.push(`${fieldName} must be at most ${rule.rules.maxLength} characters`);
    }

    // Min value validation
    if (rule.rules.min !== undefined && Number(value) < rule.rules.min) {
      errors.push(`${fieldName} must be at least ${rule.rules.min}`);
    }

    // Max value validation
    if (rule.rules.max !== undefined && Number(value) > rule.rules.max) {
      errors.push(`${fieldName} must be at most ${rule.rules.max}`);
    }

    // Pattern validation
    if (rule.rules.pattern && value) {
      try {
        const regex = new RegExp(rule.rules.pattern);
        if (!regex.test(String(value))) {
          errors.push(rule.rules.errorMessage || `${fieldName} format is invalid`);
        }
      } catch (e) {
        warnings.push(`Invalid regex pattern for ${fieldName}`);
      }
    }

    // Custom validator (eval - use with caution in production)
    if (rule.rules.customValidator) {
      try {
        // eslint-disable-next-line no-eval
        const isValid = eval(rule.rules.customValidator.replace('{{value}}', JSON.stringify(value)));
        if (!isValid) {
          errors.push(rule.rules.errorMessage || `${fieldName} failed custom validation`);
        }
      } catch (e) {
        warnings.push(`Custom validator error for ${fieldName}`);
      }
    }

    return {
      fieldName,
      isValid: errors.length === 0,
      errors,
      warnings,
      value
    };
  };

  const validateTestData = (testDataItem: TestDataItem): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const dataFields = Object.keys(testDataItem.data);

    for (const fieldName of dataFields) {
      const fieldValue = testDataItem.data[fieldName];
      
      // Find matching rule (exact match or contains)
      const matchingRule = validationRules.find(rule => 
        fieldName.toLowerCase() === rule.fieldName.toLowerCase() ||
        fieldName.toLowerCase().includes(rule.fieldName.toLowerCase())
      );

      if (matchingRule) {
        const result = validateField(fieldName, fieldValue, matchingRule);
        results.push(result);
      } else {
        // No rule found - mark as not validated
        results.push({
          fieldName,
          isValid: true,
          errors: [],
          warnings: ['No validation rule defined'],
          value: fieldValue
        });
      }
    }

    return results;
  };

  const handleValidateAll = async () => {
    setValidationInProgress(true);
    try {
      const updatedTestData = testData.map(item => {
        const validationResults = validateTestData(item);
        return { ...item, validationResults };
      });
      setTestData(updatedTestData);
      alert('Validation complete! Check individual test data for results.');
    } catch (error) {
      alert('Validation failed: ' + (error as Error).message);
    } finally {
      setValidationInProgress(false);
    }
  };

  const handleValidateSingle = (item: TestDataItem) => {
    const validationResults = validateTestData(item);
    setSelectedTestData({ ...item, validationResults });
    setShowValidationModal(true);
  };

  const openRuleModal = (rule: ValidationRule | null = null) => {
    if (rule) {
      setRuleForm(rule);
    } else {
      setRuleForm({
        id: Date.now().toString(),
        fieldName: '',
        fieldType: 'text',
        rules: {}
      });
    }
    setShowRuleModal(true);
  };

  const handleSaveRule = () => {
    const updated = ruleForm.id && validationRules.find(r => r.id === ruleForm.id)
      ? validationRules.map(r => r.id === ruleForm.id ? ruleForm : r)
      : [...validationRules, ruleForm];
    
    setValidationRules(updated);
    localStorage.setItem('validationRules', JSON.stringify(updated));
    setShowRuleModal(false);
    alert('Validation rule saved!');
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Delete this validation rule?')) {
      const updated = validationRules.filter(r => r.id !== id);
      setValidationRules(updated);
      localStorage.setItem('validationRules', JSON.stringify(updated));
    }
  };

  const exportRules = () => {
    const dataStr = JSON.stringify(validationRules, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', `validation-rules-${Date.now()}.json`);
    link.click();
  };

  const importRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setValidationRules(imported);
          localStorage.setItem('validationRules', JSON.stringify(imported));
          alert('Validation rules imported successfully!');
        } catch (error) {
          alert('Error importing rules. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const getValidationStatus = (item: TestDataItem): 'valid' | 'invalid' | 'not-validated' | 'warnings' => {
    if (!item.validationResults || item.validationResults.length === 0) {
      return 'not-validated';
    }

    const hasErrors = item.validationResults.some(r => !r.isValid);
    const hasWarnings = item.validationResults.some(r => r.warnings.length > 0);

    if (hasErrors) return 'invalid';
    if (hasWarnings) return 'warnings';
    return 'valid';
  };

  const filteredData = testData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEnv = filterEnv === 'all' || item.environment === filterEnv;
    const matchesSuite = !selectedSuite || item.suiteId === selectedSuite.id;
    
    let matchesValidation = true;
    if (filterValidation !== 'all') {
      const status = getValidationStatus(item);
      matchesValidation = status === filterValidation;
    }

    return matchesSearch && matchesEnv && matchesSuite && matchesValidation;
  });

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="view-container">
      <h1 className="view-title">Test Data Validation</h1>

      {/* Stats Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Database className="w-8 h-8" style={{ color: '#3b82f6' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{testData.length}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Total Test Data</div>
            </div>
          </div>
        </div>
        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#10b981' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {testData.filter(item => getValidationStatus(item) === 'valid').length}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Valid</div>
            </div>
          </div>
        </div>
        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <XCircle className="w-8 h-8" style={{ color: '#ef4444' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {testData.filter(item => getValidationStatus(item) === 'invalid').length}
              </div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Invalid</div>
            </div>
          </div>
        </div>
        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield className="w-8 h-8" style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{validationRules.length}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>Validation Rules</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="content-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => openRuleModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus className="w-5 h-5" />
              Add Rule
            </button>
            <button onClick={handleValidateAll} className="btn-approve" disabled={validationInProgress} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {validationInProgress ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Validate All
            </button>
            <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Upload className="w-4 h-4" />
              Import Rules
              <input type="file" accept=".json" onChange={importRules} style={{ display: 'none' }} />
            </label>
            <button onClick={exportRules} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download className="w-4 h-4" />
              Export Rules
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={filterValidation}
              onChange={(e) => setFilterValidation(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid Only</option>
              <option value="invalid">Invalid Only</option>
              <option value="not-validated">Not Validated</option>
              <option value="warnings">With Warnings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Validation Rules Section */}
      <div className="content-card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Validation Rules ({validationRules.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {validationRules.map(rule => (
            <div key={rule.id} style={{ padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1f2937' }}>{rule.fieldName}</div>
                  <span className="language-badge" style={{ background: '#3b82f6', fontSize: 11 }}>{rule.fieldType}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openRuleModal(rule)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteRule(rule.id)} className="btn-reject" style={{ padding: '4px 8px' }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                {rule.rules.required && <div>• Required</div>}
                {rule.rules.minLength && <div>• Min length: {rule.rules.minLength}</div>}
                {rule.rules.maxLength && <div>• Max length: {rule.rules.maxLength}</div>}
                {rule.rules.min !== undefined && <div>• Min value: {rule.rules.min}</div>}
                {rule.rules.max !== undefined && <div>• Max value: {rule.rules.max}</div>}
                {rule.rules.pattern && <div>• Pattern: {rule.rules.pattern.substring(0, 30)}...</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Data with Validation Results */}
      <div className="stats-grid">
        {filteredData.map(item => {
          const status = getValidationStatus(item);
          const statusColors = {
            valid: '#10b981',
            invalid: '#ef4444',
            warnings: '#f59e0b',
            'not-validated': '#6b7280'
          };
          const statusIcons = {
            valid: <CheckCircle className="w-5 h-5" />,
            invalid: <XCircle className="w-5 h-5" />,
            warnings: <AlertTriangle className="w-5 h-5" />,
            'not-validated': <Target className="w-5 h-5" />
          };

          return (
            <div key={item.id} className="content-card" style={{ border: `2px solid ${statusColors[status]}` }}>
              <div className="card-header">
                <div>
                  <h3>{item.name}</h3>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span className="language-badge" style={{ background: '#9333ea' }}>{item.environment}</span>
                    <span className="language-badge" style={{ background: '#3b82f6' }}>{item.type}</span>
                    <span className="language-badge" style={{ background: statusColors[status], display: 'flex', alignItems: 'center', gap: 4 }}>
                      {statusIcons[status]}
                      {status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Preview */}
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
                <pre style={{ fontSize: 13, color: '#1f2937' }}>
                  {Object.entries(item.data).map(([key, value]) => {
                    const fieldResult = item.validationResults?.find(r => r.fieldName === key);
                    const fieldColor = fieldResult?.isValid === false ? '#ef4444' : fieldResult?.warnings.length ? '#f59e0b' : '#6b21a8';
                    
                    return (
                      <div key={key} style={{ marginBottom: 4 }}>
                        <span style={{ color: fieldColor, fontWeight: 600 }}>{key}:</span>{' '}
                        {key.toLowerCase().includes('password') ? (
                          <span>
                            {showPasswords[item.id] ? String(value) : '••••••••'}
                            <button onClick={() => togglePasswordVisibility(item.id)} className="btn-secondary" style={{ marginLeft: 8, padding: '2px 6px' }}>
                              {showPasswords[item.id] ? <EyeOff className="w-3 h-3 inline" /> : <Eye className="w-3 h-3 inline" />}
                            </button>
                          </span>
                        ) : (
                          String(value)
                        )}
                        {fieldResult && !fieldResult.isValid && (
                          <XCircle className="w-3 h-3 inline ml-1" style={{ color: '#ef4444' }} />
                        )}
                        {fieldResult && fieldResult.warnings.length > 0 && (
                          <AlertTriangle className="w-3 h-3 inline ml-1" style={{ color: '#f59e0b' }} />
                        )}
                      </div>
                    );
                  })}
                </pre>
              </div>

              {/* Validation Summary */}
              {item.validationResults && item.validationResults.length > 0 && (
                <div style={{ fontSize: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Validation Summary:</div>
                  {item.validationResults.filter(r => !r.isValid).map((result, idx) => (
                    <div key={idx} style={{ color: '#ef4444', marginBottom: 2 }}>
                      • {result.errors.join(', ')}
                    </div>
                  ))}
                  {item.validationResults.filter(r => r.warnings.length > 0).map((result, idx) => (
                    <div key={idx} style={{ color: '#f59e0b', marginBottom: 2 }}>
                      ⚠ {result.warnings.join(', ')}
                    </div>
                  ))}
                </div>
              )}

              <div className="run-actions">
                <button onClick={() => handleValidateSingle(item)} className="btn-primary" title="Validate">
                  <Shield className="w-4 h-4" />
                </button>
                <button onClick={() => handleValidateSingle(item)} className="btn-secondary" title="View Details">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="empty-state">
          <p className="benefit-text">No test data found matching filters.</p>
        </div>
      )}

      {/* Validation Rule Modal */}
      {showRuleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{ruleForm.id && validationRules.find(r => r.id === ruleForm.id) ? 'Edit' : 'Create'} Validation Rule</h2>
              <button className="modal-close" onClick={() => setShowRuleModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="settings-grid" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label>Field Name</label>
                  <input
                    type="text"
                    value={ruleForm.fieldName}
                    onChange={(e) => setRuleForm({ ...ruleForm, fieldName: e.target.value })}
                    className="form-input"
                    placeholder="e.g., email, username"
                  />
                </div>
                <div className="form-group">
                  <label>Field Type</label>
                  <select
                    value={ruleForm.fieldType}
                    onChange={(e) => setRuleForm({ ...ruleForm, fieldType: e.target.value })}
                    className="form-select"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="password">Password</option>
                    <option value="number">Number</option>
                    <option value="tel">Phone</option>
                    <option value="url">URL</option>
                    <option value="date">Date</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={ruleForm.rules.required || false}
                    onChange={(e) => setRuleForm({ ...ruleForm, rules: { ...ruleForm.rules, required: e.target.checked } })}
                  />
                  Required
                </label>
              </div>

              <div className="settings-grid" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label>Min Length</label>
                  <input
                    type="number"
                    value={ruleForm.rules.minLength || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, rules: { ...ruleForm.rules, minLength: e.target.value ? parseInt(e.target.value) : undefined } })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Max Length</label>
                  <input
                    type="number"
                    value={ruleForm.rules.maxLength || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, rules: { ...ruleForm.rules, maxLength: e.target.value ? parseInt(e.target.value) : undefined } })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Min Value</label>
                  <input
                    type="number"
                    value={ruleForm.rules.min || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, rules: { ...ruleForm.rules, min: e.target.value ? parseInt(e.target.value) : undefined } })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Max Value</label>
                  <input
                    type="number"
                    value={ruleForm.rules.max || ''}
                    onChange={(e) => setRuleForm({ ...ruleForm, rules: { ...ruleForm.rules, max: e.target.value ? parseInt(e.target.value) : undefined } })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pattern (Regex)</label>
                <input
                  type="text"
                  value={ruleForm.rules.pattern || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, rules: { ...ruleForm.rules, pattern: e.target.value } })}
                  className="form-input"
                  placeholder="^[a-zA-Z0-9]+$"
                />
              </div>

              <div className="form-group">
                <label>Custom Validator (JavaScript)</label>
                <textarea
                  value={ruleForm.rules.customValidator || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, rules: { ...ruleForm.rules, customValidator: e.target.value } })}
                  className="form-textarea"
                  rows={3}
                  placeholder="{{value}}.length > 5 && {{value}}.includes('@')"
                />
              </div>

              <div className="form-group">
                <label>Error Message</label>
                <input
                  type="text"
                  value={ruleForm.rules.errorMessage || ''}
                  onChange={(e) => setRuleForm({ ...ruleForm, rules: { ...ruleForm.rules, errorMessage: e.target.value } })}
                  className="form-input"
                  placeholder="Custom error message"
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setShowRuleModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleSaveRule} className="btn-primary" style={{ flex: 1 }}>
                  Save Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Details Modal */}
      {showValidationModal && selectedTestData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>Validation Details: {selectedTestData.name}</h2>
              <button className="modal-close" onClick={() => setShowValidationModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedTestData.validationResults && selectedTestData.validationResults.length > 0 ? (
                <div>
                  {selectedTestData.validationResults.map((result, idx) => (
                    <div key={idx} style={{ marginBottom: 16, padding: 12, background: result.isValid ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1px solid ${result.isValid ? '#86efac' : '#fca5a5'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {result.isValid ? <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} /> : <XCircle className="w-5 h-5" style={{ color: '#ef4444' }} />}
                        <span style={{ fontWeight: 600, color: result.isValid ? '#166534' : '#991b1b' }}>{result.fieldName}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#4b5563' }}>
                        <strong>Value:</strong> {String(result.value)}
                      </div>
                      {result.errors.length > 0 && (
                        <div style={{ marginTop: 8, color: '#ef4444' }}>
                          <strong>Errors:</strong>
                          <ul style={{ marginLeft: 20, marginTop: 4 }}>
                            {result.errors.map((error, i) => <li key={i}>{error}</li>)}
                          </ul>
                        </div>
                      )}
                      {result.warnings.length > 0 && (
                        <div style={{ marginTop: 8, color: '#f59e0b' }}>
                          <strong>Warnings:</strong>
                          <ul style={{ marginLeft: 20, marginTop: 4 }}>
                            {result.warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No validation results available. Click "Validate" to run validation.</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setShowValidationModal(false)} className="btn-secondary" style={{ flex: 1 }}>Close</button>
                <button onClick={() => { handleValidateSingle(selectedTestData); }} className="btn-primary" style={{ flex: 1 }}>
                  Re-validate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDataValidation;
