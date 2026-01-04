/**
 * NLP Features Integration Component
 * Adds NLP features tab to the main Dashboard
 */

import React from 'react';
import { NLPDashboard } from './NLPDashboard';

interface NLPIntegrationProps {
  scripts?: Array<{
    id: string;
    name: string;
    code?: string;
    language: string;
  }>;
}

export const NLPIntegration: React.FC<NLPIntegrationProps> = ({ scripts = [] }) => {
  return (
    <div className="nlp-integration-container">
      <NLPDashboard scripts={scripts} />
    </div>
  );
};

export default NLPIntegration;
