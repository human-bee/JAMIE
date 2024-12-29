import React, { useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import Whiteboard from './Whiteboard';
import RoomManager from './components/RoomManager';
import styled from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: #f0f2f5;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #1a1a1a;
    margin-bottom: 0.5em;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.5rem;
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Logo = styled.h1`
  margin-bottom: 2rem;
  color: #4CAF50;
  text-align: center;
`;

function App() {
  const [roomDetails, setRoomDetails] = useState(null);

  const handleRoomJoined = (details) => {
    setRoomDetails(details);
  };

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        {!roomDetails ? (
          <>
            <Logo>JAMIE</Logo>
            <RoomManager onRoomJoined={handleRoomJoined} />
          </>
        ) : (
          <Whiteboard roomDetails={roomDetails} />
        )}
      </AppContainer>
    </>
  );
}

export default App;
