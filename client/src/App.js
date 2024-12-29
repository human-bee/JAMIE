import React from 'react';
import { createGlobalStyle } from 'styled-components';
import Whiteboard from './Whiteboard';

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

function App() {
  return (
    <>
      <GlobalStyle />
      <Whiteboard />
    </>
  );
}

export default App;
