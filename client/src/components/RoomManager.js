import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import livekitService from '../services/livekit.service';

const Container = styled.div`
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #43a047;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e41;
  font-size: 0.9rem;
  margin-top: 8px;
`;

const RoomManager = ({ onRoomJoined }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');

  const createRoom = useCallback(async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/rooms', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const roomDetails = await response.json();
      
      // Connect to the room using LiveKit
      await livekitService.connect(
        roomDetails.wsUrl,
        roomDetails.token
      );

      onRoomJoined(roomDetails);
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [onRoomJoined]);

  const joinRoom = useCallback(async (e) => {
    e.preventDefault();
    setIsJoining(true);
    setError('');

    try {
      // Validate room name
      const validateResponse = await fetch(`http://localhost:3001/api/rooms/${roomName}/validate`);
      const { isValid } = await validateResponse.json();

      if (!isValid) {
        throw new Error('Invalid room name');
      }

      // Join the room
      const joinResponse = await fetch(`http://localhost:3001/api/rooms/${roomName}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ guestName })
      });

      if (!joinResponse.ok) {
        throw new Error('Failed to join room');
      }

      const guestDetails = await joinResponse.json();
      
      // Connect to the room using LiveKit
      await livekitService.connect(
        guestDetails.wsUrl,
        guestDetails.token
      );

      onRoomJoined({
        roomName,
        guestIdentity: guestDetails.guestIdentity,
        token: guestDetails.token,
        wsUrl: guestDetails.wsUrl
      });
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please check the room name and try again.');
    } finally {
      setIsJoining(false);
    }
  }, [roomName, guestName, onRoomJoined]);

  return (
    <Container>
      <Form onSubmit={createRoom}>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating Room...' : 'Create New Room'}
        </Button>
      </Form>

      <div style={{ margin: '20px 0', textAlign: 'center' }}>or</div>

      <Form onSubmit={joinRoom}>
        <Input
          type="text"
          placeholder="Enter Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Your Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          required
        />
        <Button type="submit" disabled={isJoining || !roomName || !guestName}>
          {isJoining ? 'Joining Room...' : 'Join Room'}
        </Button>
      </Form>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </Container>
  );
};

export default RoomManager; 