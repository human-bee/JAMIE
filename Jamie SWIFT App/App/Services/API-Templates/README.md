# API Templates

These templates provide the structure for handling API keys and sensitive data in the Jamie SWIFT App. To use them:

1. Create a new `API` directory in `Services/`:
```bash
mkdir -p Jamie\ SWIFT\ App/App/Services/API
```

2. Copy the templates to the new directory:
```bash
cp API-Templates/*.swift.template Jamie\ SWIFT\ App/App/Services/API/
```

3. Rename the files (remove .template extension):
```bash
cd Jamie\ SWIFT\ App/App/Services/API/
for file in *.template; do mv "$file" "${file%.template}"; done
```

## File Descriptions

### APIKeys.swift
- Manages API credentials for different services
- Handles loading credentials from environment variables
- Provides validation and error handling
- Supports multiple credential types (API keys, secrets, URLs, etc.)

### KeychainHelper.swift
- Securely stores and retrieves API credentials
- Uses the iOS/macOS Keychain for secure storage
- Provides methods for saving, reading, and deleting credentials

### NetworkManager.swift
- Singleton class for accessing API credentials
- Provides a clean interface for other parts of the app

## Supported APIs

### AI Services
- OpenAI (GPT-4, etc.)
- Anthropic (Claude)
- Perplexity (Search)
- Deepgram (Transcription)
- Stability AI (Image Generation)
- Replicate AI (Model Deployment)
- Vercel AI (AI Components)

### Communication & Streaming
- LiveKit (Audio/Video)
- Ably (Real-time Data)
- WebSocket Hub

### Data & Search
- Google Custom Search
- Alpha Vantage (Financial Data)
- News API
- Wikipedia
- Kaggle (Datasets)

### Government & Research
- US Census
- Data.gov
- Crossref
- Semantic Scholar
- PubMed

### Weather & Climate
- OpenWeatherMap
- NOAA

### Financial
- Financial Modeling Prep
- Coinbase

### Geographic
- Mapbox
- OpenCage

### Science & Research
- NASA
- World Bank
- CORE
- Unpaywall
- arXiv
- Lens

### Media & Content
- Internet Archive
- Spotify
- YouTube Data
- Mediastack

### Visualization
- Plotly
- Flourish
- Datawrapper

### Fact Checking
- Google Fact Check
- Snopes

### Image Processing
- Cloudinary
- Imgur

### Scientific Computing
- Wolfram Alpha
- Mathpix

### UI & Deployment
- Streamlit
- Gradio

## Environment Variables
Required environment variables should be set in your `.env` file. Here's a complete list:

```env
# AI Services
OPENAI_API_KEY=your_key_here
OPENAI_ORG_ID=your_org_id_here
OPENAI_MODEL=gpt-4-1106-preview  # Optional
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-2.1  # Optional
PERPLEXITY_API_KEY=your_key_here
DEEPGRAM_API_KEY=your_key_here
STABILITY_API_KEY=your_key_here
STABILITY_MODEL=stable-diffusion-xl-1024-v1-0  # Optional
REPLICATE_API_TOKEN=your_token_here
VERCEL_AI_API_KEY=your_key_here

# Communication & Streaming
LIVEKIT_API_KEY=your_key_here
LIVEKIT_API_SECRET=your_secret_here
LIVEKIT_WS_URL=your_ws_url_here
ABLY_API_KEY=your_key_here
WEBSOCKET_HUB_KEY=your_key_here

# Data & Search
GOOGLE_CUSTOM_SEARCH_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_key_here
NEWSAPI_KEY=your_key_here
WIKIPEDIA_API_USER_AGENT="YourAppName (your_email@example.com)"
KAGGLE_USERNAME=your_username_here
KAGGLE_KEY=your_key_here

# Government & Research
US_CENSUS_API_KEY=your_key_here
DATA_GOV_API_KEY=your_key_here
CROSSREF_API_EMAIL=your_email
SEMANTIC_SCHOLAR_API_KEY=your_key_here
PUBMED_API_KEY=your_key_here

# Weather & Climate
OPENWEATHERMAP_API_KEY=your_key_here
NOAA_API_TOKEN=your_key_here

# Financial
FINANCIAL_MODELING_PREP_KEY=your_key_here
COINBASE_API_KEY=your_key_here

# Geographic
MAPBOX_API_KEY=your_key_here
OPENCAGE_API_KEY=your_key_here

# Science & Research
NASA_API_KEY=your_key_here
WORLDBANK_API_FORMAT=json
CORE_API_KEY=your_key_here
UNPAYWALL_EMAIL=your_email
ARXIV_API_USER=your_app_name
LENS_API_KEY=your_key_here

# Media & Content
INTERNET_ARCHIVE_KEY=your_key_here
SPOTIFY_API_KEY=your_key_here
YOUTUBE_DATA_API_KEY=your_key_here
MEDIASTACK_API_KEY=your_key_here

# Visualization
PLOTLY_API_KEY=your_key_here
FLOURISH_API_KEY=your_key_here
DATAWRAPPER_API_KEY=your_key_here

# Fact Checking
GOOGLE_FACT_CHECK_API_KEY=your_key_here
SNOPES_API_KEY=your_key_here

# Image Processing
CLOUDINARY_URL=your_url_here
IMGUR_CLIENT_ID=your_client_id

# Scientific Computing
WOLFRAM_ALPHA_APPID=your_appid_here
MATHPIX_API_KEY=your_key_here

# UI & Deployment
STREAMLIT_SHARING_API_KEY=your_key_here
GRADIO_API_KEY=your_key_here
```

## Security Notes
- Never commit API keys or sensitive data to version control
- The `API` directory is included in `.gitignore`
- Use environment variables for sensitive data
- Always use the Keychain for storing credentials
- Each API service has its own secure storage in the Keychain
- Credentials can be cleared using `APIKeys.clearAllCredentials()` 