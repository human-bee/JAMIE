import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

const DropZone = styled.div`
  border: 2px dashed ${props => props.isDragging ? '#4CAF50' : '#ddd'};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  background: ${props => props.isDragging ? 'rgba(76, 175, 80, 0.1)' : '#fff'};
  transition: all 0.2s ease;
  cursor: pointer;
  margin-bottom: 16px;

  &:hover {
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.05);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: ${props => props.isDragging ? '#4CAF50' : '#666'};
  margin-bottom: 8px;
`;

const UploadText = styled.p`
  color: #666;
  margin: 0;
`;

const FilePreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: ${props => props.hasFiles ? '16px' : '0'};
`;

const FileCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #2c3e50;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  button {
    background: none;
    border: none;
    color: #ff4444;
    cursor: pointer;
    padding: 0;
    font-size: 1.1rem;
    line-height: 1;
    opacity: 0.7;
    
    &:hover {
      opacity: 1;
    }
  }
`;

const DragAndDrop = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = [...e.dataTransfer.files];
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = [...e.target.files];
    processFiles(selectedFiles);
  }, []);

  const processFiles = useCallback((newFiles) => {
    // Filter for supported file types
    const supportedFiles = newFiles.filter(file => {
      const type = file.type.toLowerCase();
      return type.includes('pdf') || 
             type.includes('image') || 
             type.includes('text') ||
             type.includes('csv');
    });

    if (supportedFiles.length > 0) {
      setFiles(prev => [...prev, ...supportedFiles]);
      onFilesAdded(supportedFiles);
    }
  }, [onFilesAdded]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div>
      <DropZone
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        isDragging={isDragging}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <FileInput
          type="file"
          id="fileInput"
          multiple
          onChange={handleFileSelect}
          accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
        />
        <UploadIcon isDragging={isDragging}>
          📄
        </UploadIcon>
        <UploadText>
          {isDragging 
            ? 'Drop files here!'
            : 'Drag & drop files here or click to browse'}
        </UploadText>
      </DropZone>

      <FilePreview hasFiles={files.length > 0}>
        {files.map((file, index) => (
          <FileCard key={index}>
            <span>{file.name}</span>
            <button onClick={() => removeFile(index)}>×</button>
          </FileCard>
        ))}
      </FilePreview>
    </div>
  );
};

export default DragAndDrop; 