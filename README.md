# JAMIE (Joint AI Multimedia Interaction Engine)

JAMIE is an AI-enhanced whiteboard system that acts as an intelligent "third guest" for podcasts and conversations. It provides real-time transcription, fact-checking, and dynamic visualizations while facilitating rich, data-driven discussions.

## 🌟 Features

- **Real-Time Communication**
  - Video/audio streaming via LiveKit
  - Real-time whiteboard collaboration
  - AI voice interjections for fact-checking

- **AI-Powered Analysis**
  - Speech-to-text transcription
  - Multi-agent system for fact-checking and research
  - Sentiment analysis and topic extraction
  - Dynamic chart and visualization generation

- **Interactive Whiteboard**
  - Multi-page canvas with rich media support
  - AI-generated visualizations and charts
  - Real-time collaboration features
  - Magazine-style layout options

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- LiveKit account
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/jamie.git
   cd jamie
   ```

2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# LiveKit Configuration
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_WS_URL=your_livekit_url

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key

# MongoDB Configuration
MONGODB_URI=your_mongodb_uri
```

## 🏗️ Architecture

### Components

1. **Real-Time Communication Layer**
   - LiveKit for video/audio streaming
   - WebSocket for real-time updates

2. **AI Processing Pipeline**
   - Speech-to-text processing
   - Multi-agent system for content analysis
   - Fact-checking and web search capabilities

3. **Whiteboard Interface**
   - React-based frontend
   - Real-time collaborative canvas
   - Dynamic visualization rendering

4. **Backend Services**
   - Express.js server
   - MongoDB for data persistence
   - WebSocket server for real-time updates

## 🛡️ Security Notes

- Never commit your `.env` file
- Keep your API keys secure
- The repository includes only example/template API keys
- Follow security best practices when deploying

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT and Whisper APIs
- LiveKit for real-time communication
- MongoDB for database services
- All contributors and supporters

## ⚠️ Disclaimer

This is a work in progress. Features and documentation may change as the project evolves.

