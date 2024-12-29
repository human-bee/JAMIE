import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import livekitService from '../services/livekit.service';

const Container = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 16px;
`;

const Title = styled.h3`
  color: #2c3e50;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-size: 0.8em;
    color: #666;
    font-weight: normal;
  }
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 6px;
  background: ${props => props.isLocal ? '#f8f9fa' : 'transparent'};
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.isAI ? '#4CAF50' : '#2196F3'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
  font-size: 0.9rem;
`;

const ParticipantInfo = styled.div`
  flex: 1;
`;

const Name = styled.div`
  font-weight: 500;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-size: 0.8em;
    color: #666;
    font-weight: normal;
  }
`;

const Status = styled.div`
  font-size: 0.8rem;
  color: ${props => props.isSpeaking ? '#4CAF50' : '#666'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AudioIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.isMuted ? '#ff4444' : '#4CAF50'};
`;

const ParticipantList = () => {
  const [participants, setParticipants] = useState([]);
  const [speakingStates, setSpeakingStates] = useState({});

  useEffect(() => {
    const updateParticipants = () => {
      const localParticipant = livekitService.getLocalParticipant();
      const remoteParticipants = livekitService.getParticipants();
      
      setParticipants([
        localParticipant,
        ...remoteParticipants
      ].filter(Boolean));
    };

    const handleParticipantConnected = () => {
      updateParticipants();
    };

    const handleParticipantDisconnected = () => {
      updateParticipants();
    };

    const handleSpeakingChanged = (participant, speaking) => {
      setSpeakingStates(prev => ({
        ...prev,
        [participant.identity]: speaking
      }));
    };

    // Set up event listeners
    livekitService.onParticipantConnected = handleParticipantConnected;
    livekitService.onParticipantDisconnected = handleParticipantDisconnected;

    // Initial participants
    updateParticipants();

    // Set up speaking detection
    participants.forEach(participant => {
      participant.on('speakingChanged', speaking => {
        handleSpeakingChanged(participant, speaking);
      });
    });

    return () => {
      livekitService.onParticipantConnected = null;
      livekitService.onParticipantDisconnected = null;
    };
  }, []);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getParticipantMetadata = (participant) => {
    try {
      return JSON.parse(participant.metadata || '{}');
    } catch {
      return {};
    }
  };

  return (
    <Container>
      <Title>
        Participants <span>({participants.length})</span>
      </Title>
      {participants.map(participant => {
        const metadata = getParticipantMetadata(participant);
        const isLocal = participant === livekitService.getLocalParticipant();
        const isAI = metadata.isAI;
        const isSpeaking = speakingStates[participant.identity];
        const isMuted = !participant.isMicrophoneEnabled;

        return (
          <ParticipantItem key={participant.identity} isLocal={isLocal}>
            <Avatar isAI={isAI}>
              {isAI ? 'AI' : getInitials(metadata.name || 'User')}
            </Avatar>
            <ParticipantInfo>
              <Name>
                {metadata.name || 'Unknown User'}
                {isLocal && <span>(You)</span>}
                {isAI && <span>(AI)</span>}
              </Name>
              <Status isSpeaking={isSpeaking}>
                <AudioIndicator isMuted={isMuted} />
                {isMuted ? 'Muted' : (isSpeaking ? 'Speaking' : 'Not speaking')}
              </Status>
            </ParticipantInfo>
          </ParticipantItem>
        );
      })}
    </Container>
  );
};

export default ParticipantList; 