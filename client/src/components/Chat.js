import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import livekitService from '../services/livekit.service';

const Container = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  height: 400px;
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid #eee;
  font-weight: 500;
  color: #2c3e50;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-self: ${props => props.isLocal ? 'flex-end' : 'flex-start'};
  max-width: 80%;
`;

const MessageContent = styled.div`
  background: ${props => {
    if (props.isAI) return '#4CAF50';
    return props.isLocal ? '#2196F3' : '#f1f3f4';
  }};
  color: ${props => (props.isAI || props.isLocal) ? '#fff' : '#2c3e50'};
  padding: 8px 12px;
  border-radius: 12px;
  border-bottom-${props => props.isLocal ? 'right' : 'left'}-radius: 4px;
  font-size: 0.95rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
`;

const MessageMeta = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  ${props => props.isLocal && 'align-self: flex-end;'}
`;

const SystemMessage = styled(MessageContent)`
  background: #fff3cd;
  color: #856404;
  align-self: center;
  text-align: center;
  font-style: italic;
  max-width: 90%;
`;

const InputArea = styled.div`
  padding: 16px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
`;

const Input = styled.textarea`
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  resize: none;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const SendButton = styled.button`
  padding: 0 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #43a047;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px 0;

  div {
    width: 8px;
    height: 8px;
    background: #4CAF50;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out;

    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const messageListRef = useRef(null);
  const localParticipant = livekitService.getLocalParticipant();

  useEffect(() => {
    const handleDataReceived = async (payload, participant) => {
      try {
        const data = JSON.parse(payload);
        if (data.type === 'chat') {
          const metadata = JSON.parse(participant.metadata || '{}');
          const message = {
            id: Date.now(),
            content: data.content,
            sender: metadata.name || 'Unknown User',
            participantId: participant.identity,
            timestamp: new Date(),
            isSystem: false,
            isAI: metadata.isAI
          };

          setMessages(prev => [...prev, message]);

          // If it's not from AI, check if AI should respond
          if (!metadata.isAI) {
            setIsAITyping(true);
            try {
              const response = await fetch('http://localhost:3001/api/ai/chat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
              });

              if (response.ok) {
                const aiResponse = await response.json();
                if (aiResponse.content) {
                  // Small delay to make it feel more natural
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // If speech is needed, play it
                  if (aiResponse.shouldSpeak) {
                    const audio = new Audio(`http://localhost:3001/api/tts?text=${encodeURIComponent(aiResponse.content)}`);
                    audio.play();
                  }
                }
              }
            } catch (error) {
              console.error('Error getting AI response:', error);
            } finally {
              setIsAITyping(false);
            }
          }
        }
      } catch (error) {
        console.error('Error processing received data:', error);
      }
    };

    livekitService.room?.on('dataReceived', handleDataReceived);

    // Add system message when someone joins
    livekitService.onParticipantConnected = (participant) => {
      const metadata = JSON.parse(participant.metadata || '{}');
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: `${metadata.name || 'Someone'} joined the room`,
        timestamp: new Date(),
        isSystem: true
      }]);
    };

    // Add system message when someone leaves
    livekitService.onParticipantDisconnected = (participant) => {
      const metadata = JSON.parse(participant.metadata || '{}');
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: `${metadata.name || 'Someone'} left the room`,
        timestamp: new Date(),
        isSystem: true
      }]);
    };

    return () => {
      livekitService.room?.off('dataReceived', handleDataReceived);
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !livekitService.room) return;

    const message = {
      type: 'chat',
      content: inputValue.trim()
    };

    try {
      // Send to all participants
      await livekitService.room.localParticipant.publishData(
        JSON.stringify(message),
        { reliable: true }
      );

      // Add to local messages
      const metadata = JSON.parse(localParticipant.metadata || '{}');
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: inputValue.trim(),
        sender: metadata.name || 'You',
        participantId: localParticipant.identity,
        timestamp: new Date(),
        isSystem: false
      }]);

      setInputValue('');
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <Container>
      <Header>Chat</Header>
      <MessageList ref={messageListRef}>
        {messages.map(message => {
          if (message.isSystem) {
            return (
              <SystemMessage key={message.id}>
                {message.content}
              </SystemMessage>
            );
          }

          const isLocal = message.participantId === localParticipant?.identity;

          return (
            <Message key={message.id} isLocal={isLocal}>
              <MessageContent isLocal={isLocal} isAI={message.isAI}>
                {message.content}
              </MessageContent>
              <MessageMeta isLocal={isLocal}>
                <span>{message.sender}</span>
                <span>•</span>
                <span>{formatTime(message.timestamp)}</span>
                {message.isAI && <span>🤖</span>}
              </MessageMeta>
            </Message>
          );
        })}
        {isAITyping && (
          <Message>
            <MessageContent isAI>
              <TypingIndicator>
                <div></div>
                <div></div>
                <div></div>
              </TypingIndicator>
            </MessageContent>
            <MessageMeta>
              <span>JAMIE is typing...</span>
            </MessageMeta>
          </Message>
        )}
      </MessageList>
      <InputArea>
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsTyping(e.target.value.length > 0);
          }}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
        />
        <SendButton 
          onClick={sendMessage}
          disabled={!isTyping || isAITyping}
        >
          Send
        </SendButton>
      </InputArea>
    </Container>
  );
};

export default Chat; 