import React from 'react';
import styled from 'styled-components';
import { Document, Page } from 'react-pdf';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const ContentWrapper = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
`;

const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
`;

const FileName = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
`;

const FileType = styled.span`
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #495057;
`;

const Summary = styled.div`
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  border-radius: 6px;
  margin-bottom: 12px;
`;

const ChartContainer = styled.div`
  height: 300px;
  margin: 20px 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Tab = styled.button`
  padding: 8px 16px;
  border: none;
  background: ${props => props.active ? '#4CAF50' : '#e9ecef'};
  color: ${props => props.active ? '#fff' : '#495057'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? '#43a047' : '#dee2e6'};
  }
`;

const ProcessedContent = ({ content }) => {
  const [activeTab, setActiveTab] = React.useState('preview');
  
  const renderContent = () => {
    if (!content) return null;

    switch (content.type) {
      case 'application/pdf':
        return (
          <>
            <TabContainer>
              <Tab 
                active={activeTab === 'preview'} 
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </Tab>
              <Tab 
                active={activeTab === 'summary'} 
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </Tab>
            </TabContainer>
            
            {activeTab === 'preview' ? (
              <Document file={content.preview}>
                <Page pageNumber={1} />
              </Document>
            ) : (
              <Summary>{content.content.summary}</Summary>
            )}
          </>
        );

      case 'text/csv':
        return (
          <>
            <div>
              <strong>Rows:</strong> {content.content.metadata.rowCount}
              <strong style={{ marginLeft: '16px' }}>Columns:</strong> {content.content.metadata.columns.join(', ')}
            </div>
            
            <ChartContainer>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={content.content.records.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={content.content.metadata.columns[0]} />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey={content.content.metadata.columns[1]} 
                    stroke="#4CAF50" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            <Summary>
              <h4>AI Insights:</h4>
              {content.content.insights}
            </Summary>
          </>
        );

      case 'image/jpeg':
      case 'image/png':
        return (
          <>
            <ImagePreview src={content.preview} alt={content.originalName} />
            {content.content.ocr && (
              <div>
                <h4>OCR Text:</h4>
                <p>{content.content.ocr}</p>
              </div>
            )}
            {content.content.description && (
              <Summary>
                <h4>AI Description:</h4>
                <p>{content.content.description}</p>
              </Summary>
            )}
          </>
        );

      case 'text/plain':
        return (
          <>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '0.9rem',
              background: '#f8f9fa',
              padding: '12px',
              borderRadius: '4px'
            }}>
              {content.content.text}
            </pre>
            {content.content.analysis && (
              <Summary>
                <h4>Analysis:</h4>
                {content.content.analysis}
              </Summary>
            )}
          </>
        );

      default:
        return <div>Unsupported file type</div>;
    }
  };

  return (
    <ContentWrapper>
      <ContentHeader>
        <FileName>{content.originalName}</FileName>
        <FileType>{content.type}</FileType>
      </ContentHeader>
      {renderContent()}
    </ContentWrapper>
  );
};

export default ProcessedContent; 