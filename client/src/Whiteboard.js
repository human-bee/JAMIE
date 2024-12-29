import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import AudioControls from './components/AudioControls';
import DragAndDrop from './components/DragAndDrop';
import ProcessedContent from './components/ProcessedContent';

const WhiteboardContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: #ffffff;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: auto 1fr;
  gap: 20px;
  padding: 20px;
  box-sizing: border-box;
`;

const Header = styled.header`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const TranscriptionPanel = styled.div`
  grid-column: 1 / 9;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow-y: auto;
`;

const ContentPanel = styled.div`
  grid-column: 9 / -1;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TranscriptionText = styled.div`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #2c3e50;
  white-space: pre-wrap;
`;

const ContentCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  min-height: 100px;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  z-index: 10;
  border-radius: 12px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: #2c3e50;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #e41;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  button {
    margin-left: auto;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    &:hover { opacity: 1; }
  }
`;

const Whiteboard = () => {
  const [transcription, setTranscription] = useState('');
  const [generatedContent, setGeneratedContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingText, setLoadingText] = useState('');

  const handleTranscriptionUpdate = useCallback((newTranscription) => {
    setTranscription(prev => prev + ' ' + newTranscription);
  }, []);

  const handleFilesAdded = useCallback(async (files) => {
    setIsLoading(true);
    setError(null);
    
    // Create immediate preview cards
    const newContent = files.map(file => ({
      type: file.type,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file)
    }));

    setGeneratedContent(prev => [...prev, ...newContent]);

    // Upload and process files
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      setLoadingText('Uploading files...');
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setLoadingText('Processing files...');
      const result = await response.json();
      
      // Update content with processed results
      setGeneratedContent(prev => 
        prev.map(content => {
          const processedFile = result.files.find(
            file => file.originalName === content.name
          );
          return processedFile ? { ...content, content: processedFile.content } : content;
        })
      );
    } catch (error) {
      console.error('Error processing files:', error);
      setError('Failed to process files. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  }, []);

  return (
    <WhiteboardContainer>
      <Header>
        <h1>JAMIE</h1>
        <AudioControls onTranscriptionUpdate={handleTranscriptionUpdate} />
      </Header>

      <TranscriptionPanel>
        <h2>Live Transcription</h2>
        <TranscriptionText>
          {transcription || 'Transcription will appear here...'}
        </TranscriptionText>
      </TranscriptionPanel>

      <ContentPanel>
        <h2>Generated Content</h2>
        
        {error && (
          <ErrorMessage>
            {error}
            <button onClick={() => setError(null)}>×</button>
          </ErrorMessage>
        )}

        <DragAndDrop onFilesAdded={handleFilesAdded} />
        
        {isLoading && (
          <LoadingOverlay>
            <Spinner />
            <LoadingText>{loadingText}</LoadingText>
          </LoadingOverlay>
        )}

        {generatedContent.map((content, index) => (
          <ProcessedContent 
            key={index}
            content={content}
          />
        ))}

        {!isLoading && generatedContent.length === 0 && (
          <ContentCard>
            AI-generated content (charts, facts, images) will appear here...
          </ContentCard>
        )}
      </ContentPanel>
    </WhiteboardContainer>
  );
};

export default Whiteboard;
