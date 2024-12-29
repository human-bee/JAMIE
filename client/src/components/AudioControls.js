import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const RecordButton = styled.button`
  background: ${props => props.isRecording ? '#ff4444' : '#4CAF50'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.isRecording ? '#ff4444' : '#666'};
  font-size: 0.9rem;

  &::before {
    content: '';
    display: ${props => props.isRecording ? 'block' : 'none'};
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff4444;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }
`;

const AudioControls = ({ onTranscriptionUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/transcription');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.transcription) {
        onTranscriptionUpdate(data.transcription);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    setSocket(ws);

    return () => {
      if (ws) ws.close();
    };
  }, [onTranscriptionUpdate]);

  // Set up audio recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000
      });

      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          
          // Send audio chunk to backend via WebSocket
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start(1000); // Collect data in 1-second chunks
      setMediaRecorder(recorder);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone');
    }
  }, [socket]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <ControlsContainer>
      <RecordButton 
        onClick={toggleRecording}
        isRecording={isRecording}
        disabled={!!error}
        title={error || (isRecording ? 'Stop Recording' : 'Start Recording')}
      >
        {isRecording ? '⬛' : '⏺'}
      </RecordButton>
      <StatusIndicator isRecording={isRecording}>
        {error || (isRecording ? 'Recording...' : 'Ready to record')}
      </StatusIndicator>
    </ControlsContainer>
  );
};

export default AudioControls; 