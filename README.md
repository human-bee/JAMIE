# JAMIE (Just A Machine Infographic Enabler / Joint AI Multimedia Interaction Engine)

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

- Xcode 15.0 or higher
- macOS 14.0 or higher
- LiveKit account
- Various API keys (see Configuration section)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/jamie.git
   cd jamie
   ```

2. Set up API credentials:
   ```bash
   cd "Jamie SWIFT App/App/Services"
   cp -r API-Templates API
   cd API
   # Remove .template extensions from files
   for file in *.template; do mv "$file" "${file%.template}"; done
   ```

3. Configure environment variables:
   ```bash
   cp Config/.env.example Config/.env
   # Edit .env with your API keys and configuration
   ```

4. Open the Xcode project:
   ```bash
   open "Jamie SWIFT App.xcodeproj"
   ```

5. Build and run the project in Xcode

## 🔧 Configuration

Create a `.env` file in the Config directory with your API keys. See `Jamie SWIFT App/App/Services/API-Templates/README.md` for a complete list of supported APIs and required environment variables.

Key configurations include:

```env
# LiveKit Configuration
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_WS_URL=your_livekit_url

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key
OPENAI_ORG_ID=your_org_id

# Other AI Services
ANTHROPIC_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
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
   - SwiftUI-based interface
   - Real-time collaborative canvas
   - Dynamic visualization rendering

4. **Services Layer**
   - API integration management
   - Secure credential storage
   - Real-time data synchronization

## 🛡️ Security Notes

- Never commit your `.env` file
- API credentials are stored securely in the macOS Keychain
- The `API` directory is included in `.gitignore`
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
- All contributors and supporters

## ⚠️ Disclaimer

This is a work in progress. Features and documentation may change as the project evolves.

