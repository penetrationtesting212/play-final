import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Info, CheckCircle, AlertCircle, HelpCircle, Zap, Code } from 'lucide-react';
import './NamingConventionInput.css';

interface NamingConventionSuggestion {
  name: string;
  featureArea: string;
  testType: string;
  specificAction: string;
  environment?: string;
  description: string;
  category?: string;
}

interface NamingConventionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showValidation?: boolean;
  showTemplates?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

const NamingConventionInputEnhanced: React.FC<NamingConventionInputProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Enter script name...',
  label = 'Script Name',
  showValidation = true,
  showTemplates = true
}) => {
  const [suggestions, setSuggestions] = useState<NamingConventionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [], suggestions: [] });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<{ title: string; description: string } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Enhanced naming conventions with categories
  const namingConventions: NamingConventionSuggestion[] = [
    // Authentication Tests
    {
      name: 'login_ui_positive_validCredentials_LoginSuccess',
      featureArea: 'login',
      testType: 'ui',
      specificAction: 'validCredentials',
      description: 'Positive login test with valid credentials - verifies successful authentication',
      category: 'Authentication'
    },
    {
      name: 'login_ui_negative_invalidPassword_LoginFailure',
      featureArea: 'login',
      testType: 'ui',
      specificAction: 'invalidPassword',
      description: 'Negative login test with invalid password - verifies error handling',
      category: 'Authentication'
    },
    {
      name: 'login_security_bruteForce_AccountLockout',
      featureArea: 'login',
      testType: 'security',
      specificAction: 'bruteForce',
      description: 'Security test for brute force protection and account lockout',
      category: 'Authentication'
    },
    // Search & Navigation
    {
      name: 'search_function_positive_validQuery_ResultsFound',
      featureArea: 'search',
      testType: 'function',
      specificAction: 'validQuery',
      description: 'Search with valid query - verifies correct results are returned',
      category: 'Search'
    },
    {
      name: 'search_function_negative_invalidInput_SearchFailure',
      featureArea: 'search',
      testType: 'function',
      specificAction: 'invalidInput',
      description: 'Negative search test with invalid input - verifies error handling',
      category: 'Search'
    },
    {
      name: 'search_performance_largeDataset_ResponseTime',
      featureArea: 'search',
      testType: 'performance',
      specificAction: 'largeDataset',
      description: 'Performance test for search with large dataset',
      category: 'Search'
    },
    // E-commerce: Cart
    {
      name: 'cart_e2e_addItemsAndViewCart_Chrome',
      featureArea: 'cart',
      testType: 'e2e',
      specificAction: 'addItemsAndViewCart',
      environment: 'Chrome',
      description: 'End-to-end cart test in Chrome browser - add items and view cart',
      category: 'E-commerce'
    },
    {
      name: 'cart_ui_removeItem_UpdateQuantity',
      featureArea: 'cart',
      testType: 'ui',
      specificAction: 'removeItem',
      description: 'UI test for removing items from cart and quantity update',
      category: 'E-commerce'
    },
    {
      name: 'cart_integration_applyCoupon_DiscountCalculation',
      featureArea: 'cart',
      testType: 'integration',
      specificAction: 'applyCoupon',
      description: 'Integration test for coupon application and discount calculation',
      category: 'E-commerce'
    },
    // E-commerce: Checkout
    {
      name: 'checkout_payment_positive_creditCard_ValidTransaction',
      featureArea: 'checkout',
      testType: 'payment',
      specificAction: 'creditCard',
      description: 'Positive payment test with credit card - successful transaction',
      category: 'E-commerce'
    },
    {
      name: 'checkout_e2e_completeOrder_confirmationEmail',
      featureArea: 'checkout',
      testType: 'e2e',
      specificAction: 'completeOrder',
      description: 'End-to-end checkout test with order confirmation email',
      category: 'E-commerce'
    },
    // API Tests
    {
      name: 'api_auth_getUserData_SessionToken',
      featureArea: 'api_auth',
      testType: 'api',
      specificAction: 'getUserData',
      description: 'API test for retrieving user data with session token',
      category: 'API'
    },
    {
      name: 'api_crud_createUser_ValidResponse',
      featureArea: 'api_crud',
      testType: 'api',
      specificAction: 'createUser',
      description: 'API test for creating user with valid response validation',
      category: 'API'
    },
    {
      name: 'api_performance_bulkRequest_ResponseTime',
      featureArea: 'api_performance',
      testType: 'api',
      specificAction: 'bulkRequest',
      description: 'API performance test for bulk requests',
      category: 'API'
    },
    // User Profile
    {
      name: 'user_profile_ui_editPersonalInfo_SaveChanges',
      featureArea: 'user_profile',
      testType: 'ui',
      specificAction: 'editPersonalInfo',
      description: 'UI test for editing and saving user profile information',
      category: 'User Management'
    },
    {
      name: 'user_profile_validation_invalidEmail_ErrorMessage',
      featureArea: 'user_profile',
      testType: 'validation',
      specificAction: 'invalidEmail',
      description: 'Validation test for invalid email input with error message',
      category: 'User Management'
    },
    // Performance Tests
    {
      name: 'dashboard_performance_loadTime_Under3Sec',
      featureArea: 'dashboard',
      testType: 'performance',
      specificAction: 'loadTime',
      environment: 'Under3Sec',
      description: 'Performance test checking dashboard load time under 3 seconds',
      category: 'Performance'
    },
    {
      name: 'dashboard_performance_dataRendering_1000Rows',
      featureArea: 'dashboard',
      testType: 'performance',
      specificAction: 'dataRendering',
      description: 'Performance test for rendering 1000 rows of data',
      category: 'Performance'
    },
    // Accessibility Tests
    {
      name: 'navigation_accessibility_keyboardOnly_AllFeatures',
      featureArea: 'navigation',
      testType: 'accessibility',
      specificAction: 'keyboardOnly',
      description: 'Accessibility test for keyboard-only navigation',
      category: 'Accessibility'
    },
    {
      name: 'forms_accessibility_screenReader_FormCompletion',
      featureArea: 'forms',
      testType: 'accessibility',
      specificAction: 'screenReader',
      description: 'Accessibility test for screen reader compatibility',
      category: 'Accessibility'
    },
    // Mobile Tests
    {
      name: 'checkout_mobile_touchGestures_iOS',
      featureArea: 'checkout',
      testType: 'mobile',
      specificAction: 'touchGestures',
      environment: 'iOS',
      description: 'Mobile test for touch gestures on iOS devices',
      category: 'Mobile'
    },
    {
      name: 'navigation_mobile_responsive_Android',
      featureArea: 'navigation',
      testType: 'mobile',
      specificAction: 'responsive',
      environment: 'Android',
      description: 'Mobile responsive test on Android devices',
      category: 'Mobile'
    }
  ];

  // Naming convention parts with hover information
  const conventionParts = [
    {
      name: 'Feature Area',
      description: 'The functional area or module being tested (e.g., login, search, cart)',
      examples: ['login', 'search', 'cart', 'checkout', 'api_auth', 'user_profile', 'dashboard'],
      color: '#3b82f6'
    },
    {
      name: 'Test Type',
      description: 'The category or type of test being performed',
      examples: ['positive', 'negative', 'e2e', 'ui', 'api', 'performance', 'accessibility', 'security'],
      color: '#8b5cf6'
    },
    {
      name: 'Specific Action',
      description: 'The specific action or behavior being tested',
      examples: ['validCredentials', 'invalidInput', 'addItem', 'editInfo', 'loadTime', 'submitForm'],
      color: '#10b981'
    },
    {
      name: 'Environment (Optional)',
      description: 'The target environment, browser, or device for the test',
      examples: ['Chrome', 'Firefox', 'Safari', 'Mobile', 'iOS', 'Android', 'Desktop'],
      color: '#f59e0b'
    }
  ];

  // Validate naming convention
  useEffect(() => {
    if (value.trim().length > 0) {
      const result = validateNamingConvention(value);
      setValidation(result);
    } else {
      setValidation({ isValid: true, errors: [], warnings: [], suggestions: [] });
    }
  }, [value]);

  // Filter suggestions based on input
  useEffect(() => {
    if (value.trim().length > 0) {
      const filtered = namingConventions.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.featureArea.toLowerCase().includes(value.toLowerCase()) ||
        item.testType.toLowerCase().includes(value.toLowerCase()) ||
        item.specificAction.toLowerCase().includes(value.toLowerCase()) ||
        item.description.toLowerCase().includes(value.toLowerCase()) ||
        item.category?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validateNamingConvention = (name: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check minimum parts
    const parts = name.split('_');
    if (parts.length < 3) {
      errors.push('Name should have at least 3 parts: [Feature]_[Type]_[Action]');
      suggestions.push('Example: login_ui_validCredentials');
      return { isValid: false, errors, warnings, suggestions };
    }

    // Validate feature area
    const featureAreas = ['login', 'search', 'cart', 'checkout', 'api_auth', 'user_profile', 'dashboard', 'settings', 'notifications', 'reports', 'navigation', 'forms'];
    if (!featureAreas.some(fa => parts[0].toLowerCase().includes(fa))) {
      warnings.push(`Feature area "${parts[0]}" is not standard. Common areas: ${featureAreas.slice(0, 5).join(', ')}`);
    }

    // Validate test type
    const testTypes = ['positive', 'negative', 'e2e', 'ui', 'api', 'performance', 'accessibility', 'security', 'integration', 'smoke', 'validation', 'mobile', 'payment'];
    if (!testTypes.includes(parts[1].toLowerCase())) {
      warnings.push(`Test type "${parts[1]}" is not standard. Common types: ${testTypes.slice(0, 5).join(', ')}`);
    }

    // Check for camelCase in action
    if (parts[2] && /[a-z][A-Z]/.test(parts[2])) {
      // Good - camelCase detected
    } else if (parts[2] && parts[2].length > 0) {
      suggestions.push('Consider using camelCase for actions (e.g., validCredentials instead of valid_credentials)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion: NamingConventionSuggestion) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handlePartHover = (part: typeof conventionParts[0], event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltipPosition({ x: rect.left, y: rect.bottom + 5 });
    setTooltipContent({
      title: part.name,
      description: part.description
    });
    setShowTooltip(true);
  };

  const handlePartLeave = () => {
    setShowTooltip(false);
  };

  const generateTemplate = (featureArea: string, testType: string, action: string, environment?: string) => {
    let template = `${featureArea}_${testType}_${action}`;
    if (environment) {
      template += `_${environment}`;
    }
    onChange(template);
    setShowTemplateModal(false);
  };

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const category = suggestion.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(suggestion);
    return acc;
  }, {} as Record<string, NamingConventionSuggestion[]>);

  return (
    <div className="naming-convention-input-enhanced" ref={wrapperRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#374151' }}>
          <Code className="w-4 h-4" />
          {label}
        </label>
        {showTemplates && (
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              fontSize: 12,
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#6b7280'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e5e7eb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f3f4f6')}
          >
            <Zap className="w-3 h-3" />
            Templates
          </button>
        )}
      </div>

      {/* Convention Format Guide with Hover */}
      <div style={{ 
        marginBottom: 12, 
        padding: 12, 
        background: '#f0f9ff', 
        border: '1px solid #bfdbfe', 
        borderRadius: 8,
        fontSize: 13
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, color: '#1e40af' }}>
          <Info className="w-4 h-4" />
          Naming Convention Format
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {conventionParts.map((part, index) => (
            <React.Fragment key={part.name}>
              <span
                onMouseEnter={(e) => handlePartHover(part, e)}
                onMouseLeave={handlePartLeave}
                style={{
                  padding: '4px 8px',
                  background: part.color,
                  color: 'white',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'help',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {part.name}
              </span>
              {index < conventionParts.length - 1 && (
                <span style={{ color: '#6b7280', fontWeight: 600 }}>_</span>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280' }}>
          💡 Hover over each part to see details and examples
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipContent && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            zIndex: 9999,
            background: '#1f2937',
            color: 'white',
            padding: 12,
            borderRadius: 8,
            maxWidth: 300,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.2s',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{tooltipContent.title}</div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>{tooltipContent.description}</div>
        </div>
      )}

      {/* Input Field */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim().length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 40px 10px 12px',
            border: `2px solid ${validation.isValid ? '#d1d5db' : validation.errors.length > 0 ? '#ef4444' : '#f59e0b'}`,
            borderRadius: 8,
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = validation.isValid ? '#3b82f6' : validation.errors.length > 0 ? '#ef4444' : '#f59e0b';
          }}
          onBlur={(e) => {
            setTimeout(() => {
              e.target.style.borderColor = validation.isValid ? '#d1d5db' : validation.errors.length > 0 ? '#ef4444' : '#f59e0b';
            }, 200);
          }}
        />
        {/* Validation Icon */}
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {value.trim().length > 0 && (
            validation.isValid ? (
              <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
            ) : validation.errors.length > 0 ? (
              <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
            ) : (
              <HelpCircle className="w-5 h-5" style={{ color: '#f59e0b' }} />
            )
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {showValidation && value.trim().length > 0 && (
        <div style={{ marginTop: 8 }}>
          {validation.errors.map((error, index) => (
            <div key={`error-${index}`} style={{ display: 'flex', alignItems: 'start', gap: 6, padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, marginBottom: 6 }}>
              <AlertCircle className="w-4 h-4" style={{ color: '#ef4444', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#991b1b' }}>{error}</span>
            </div>
          ))}
          {validation.warnings.map((warning, index) => (
            <div key={`warning-${index}`} style={{ display: 'flex', alignItems: 'start', gap: 6, padding: '6px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, marginBottom: 6 }}>
              <HelpCircle className="w-4 h-4" style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#92400e' }}>{warning}</span>
            </div>
          ))}
          {validation.suggestions.map((suggestion, index) => (
            <div key={`suggestion-${index}`} style={{ display: 'flex', alignItems: 'start', gap: 6, padding: '6px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, marginBottom: 6 }}>
              <Info className="w-4 h-4" style={{ color: '#0284c7', marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#075985' }}>{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          zIndex: 1000,
          marginTop: 4,
          width: '100%',
          background: 'white',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          maxHeight: 400,
          borderRadius: 8,
          padding: 8,
          overflow: 'auto',
          border: '1px solid #e5e7eb'
        }}>
          {Object.entries(groupedSuggestions).map(([category, items]) => (
            <div key={category} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', padding: '4px 8px', marginBottom: 4 }}>
                {category}
              </div>
              {items.map((suggestion, index) => {
                const globalIndex = suggestions.findIndex(s => s.name === suggestion.name);
                return (
                  <div
                    key={suggestion.name}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: globalIndex === activeSuggestionIndex ? '#eff6ff' : 'transparent',
                      marginBottom: 4,
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (globalIndex !== activeSuggestionIndex) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (globalIndex !== activeSuggestionIndex) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, fontSize: 13, color: '#111827', fontFamily: 'monospace' }}>
                        {suggestion.name}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ fontSize: 10, padding: '2px 6px', background: '#dbeafe', color: '#1e40af', borderRadius: 4, fontWeight: 600 }}>
                          {suggestion.testType}
                        </span>
                        {suggestion.environment && (
                          <span style={{ fontSize: 10, padding: '2px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 4, fontWeight: 600 }}>
                            {suggestion.environment}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                      {suggestion.description}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
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
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Quick Templates</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
              {namingConventions.slice(0, 12).map((suggestion) => (
                <div
                  key={suggestion.name}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: 12,
                    border: '2px solid #e5e7eb',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 11, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase' }}>
                    {suggestion.category}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8, wordBreak: 'break-all' }}>
                    {suggestion.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    {suggestion.description.substring(0, 60)}...
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowTemplateModal(false)}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                width: '100%',
                fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NamingConventionInputEnhanced;
