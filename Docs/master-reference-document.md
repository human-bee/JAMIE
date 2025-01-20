# MASTER REFERENCE DOCUMENT

This document is intended for **any AI Agent** involved in building and refining the "JAMIE" application. It consolidates the **vision, scope, architecture, file structure, and best practices** so that, regardless of how much or how little context the agent currently has, it can always return here to "get back on track." Use this as your single source of truth and guidance to ensure alignment with the project's goals and requirements.

---

## 1. HIGH-LEVEL OVERVIEW

**Project Name**: **JAMIE** (Joint AI Multimedia Interaction Engine)

**Primary Objective**:  
Create an AI-enhanced application that serves as a "third-guest" in a podcast or live conversation, providing real-time transcription, fact-checking, data visualization, and dynamic content creation (charts, images, etc.) on a shared whiteboard or "magazine-style" interface.

**Key Features**:
1. **Real-Time Transcription** with optional speaker diarization.  
2. **Multi-Agent AI Orchestration** for fact-checking, summarizing, web searching, code/visual generation, and voice interjections.  
3. **Collaborative Whiteboard** (or multi-page "magazine" layout) where data, charts, images, and user-dragged files are displayed.  
4. **Drag-and-Drop File Support** for automatically parsing and visualizing PDFs, CSVs, images, etc.  
5. **Text-to-Speech Interjections** when factual discrepancies are found or relevant insights arise.  
6. **Generative Image** or cover-art creation using external APIs like Ideogram, DALL·E, or Stable Diffusion.

**Who Benefits**:
- Podcast hosts who want on-the-fly fact-checking and visuals.
- Educational streams requiring real-time data verification and dynamic content.
- Any user wanting a fully interactive, AI-assisted multimedia presentation environment.

---

## 2. ARCHITECTURAL BREAKDOWN

Below is the recommended high-level architecture:

1. **Frontend (Client)**  
   - **React** or similar framework.  
   - Main components:  
     - **Whiteboard** (displays charts, images, text).  
     - **DragAndDropZone** (file uploads).  
     - **AIInterjection** (shows AI's spoken corrections, prompts, or TTS).  
     - **PageLayout** / **Magazine UI** (optional, if using multi-page "flipping" design).  
   - Communicates with the backend via REST/GraphQL/WebSocket for real-time updates.

2. **Backend (Server)**  
   - **Node.js** with **Express** (or a similar framework).  
   - Core responsibilities:  
     - Handling file uploads and storage (e.g., to S3 or local store).  
     - Serving and orchestrating AI tasks (fact-checking, summarizing).  
     - Managing transcription endpoints (forwarding audio streams or files to STT services).  
     - Providing TTS responses back to the client.  
     - Keeping logs and session data.  

3. **AI Layer**  
   - Multi-agent or chain-of-thought approach using libraries like **LangChain** or custom code.  
   - Agents:  
     - **OrchestratorAgent**: Coordinates when to call the other agents.  
     - **FactCheckerAgent**: Checks statements against known data or web search results.  
     - **WebSearchAgent**: Queries external APIs (SerpAPI, Bing).  
     - **CodeGeneratorAgent**: Generates code for charts or other UI elements.  
     - **SummaryAgent**: Provides conversation summaries or bullet points.  
   - **ImageGenService** (optional agent or service) for generating covers or illustrations.

4. **Speech-to-Text & TTS Services**  
   - **Speech-to-Text**: OpenAI Whisper, Google Cloud Speech-to-Text, AssemblyAI, etc.  
   - **Text-to-Speech**: Amazon Polly, Google TTS, Azure, or others.

5. **Data Storage**  
   - Store logs, user info, or references to uploaded files.  
   - Could be **MongoDB** or **PostgreSQL** with JSON support.  
   - Possibly use an S3-like bucket for larger files or media.

6. **Real-Time Communication**  
   - Use **LiveKit**, **Twilio**, **Agora**, or another RTC platform for audio/video streaming.  
   - The whiteboard could update in real-time via **WebSockets** or built-in solutions from the RTC platform.

---

## 3. KEY FILES & DIRECTORIES

A canonical folder structure is provided below (adapt as needed):

.
├── README.md
├── package.json
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── client
│   ├── package.json
│   ├── src
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── Whiteboard.js
│   │   ├── DragAndDropZone.js
│   │   ├── AIInterjection.js
│   │   ├── components
│   │   │   ├── PageLayout.js
│   │   │   ├── ChartCanvas.js
│   │   │   └── GeneratedCover.js
│   │   ├── utils
│   │   │   ├── api.js
│   │   │   └── fileParser.js
│   ├── public
│   │   └── index.html
│   └── .env
├── server
│   ├── index.js
│   ├── config.js
│   ├── routes
│   │   ├── upload.js
│   │   ├── transcription.js
│   │   ├── search.js
│   │   ├── tts.js
│   │   └── aiOrchestration.js
│   ├── controllers
│   │   ├── fileController.js
│   │   ├── transcriptionController.js
│   │   ├── searchController.js
│   │   └── ttsController.js
│   ├── services
│   │   ├── whisperService.js
│   │   ├── factCheckService.js
│   │   ├── imageGenService.js
│   │   └── ttsService.js
│   ├── utils
│   │   ├── logger.js
│   │   └── parser.js
│   └── .env
├── ai
│   ├── orchestratorAgent.js
│   ├── factCheckerAgent.js
│   ├── webSearchAgent.js
│   ├── codeGeneratorAgent.js
│   ├── summaryAgent.js
│   └── config.js
└── tests
    ├── client
    │   ├── Whiteboard.test.js
    │   └── AIInterjection.test.js
    ├── server
    │   ├── routes.test.js
    │   └── controllers.test.js
    └── ai
        ├── orchestratorAgent.test.js
        └── factCheckerAgent.test.js

---

## 4. DEVELOPMENT MILESTONES

Below is a recommended **milestone-based** approach to building JAMIE:

1. **Foundation**  
   - **Set up server** (Express) and **client** (React).  
   - Basic "Hello World" route to verify connectivity.  
   - Initialize Git, environment variables, linting, and testing frameworks.

2. **Real-Time Transcription**  
   - Integrate a minimal RTC solution (e.g., LiveKit).  
   - Forward audio to a STT service (e.g., Whisper).  
   - Display live transcripts in the frontend.

3. **AI Orchestration**  
   - Create an **OrchestratorAgent** and at least one "dummy" agent to handle a test scenario.  
   - Implement a simple route (`/aiOrchestration`) that returns a test response.

4. **File Upload & Parsing**  
   - Add a **DragAndDropZone** in the client.  
   - Implement **upload.js** route and **fileController.js** to handle incoming files.  
   - Use **pdf-parse**, CSV parser, or docx libraries for extracting text and data.

5. **Agent Specialization**  
   - **FactCheckerAgent** + **WebSearchAgent** for verifying user statements.  
   - **CodeGeneratorAgent** for generating chart scripts or layout instructions.  
   - **SummaryAgent** for conversation summaries or bullet points.

6. **Whiteboard Visualization**  
   - Build a **Whiteboard** or multi-page layout (e.g., **PageLayout**, **ChartCanvas**).  
   - Display newly generated charts, images, or text summaries in real time.

7. **Text-to-Speech & AI Interjection**  
   - Add a route and a controller for TTS (e.g., **ttsController.js**).  
   - Have the AI Orchestrator decide when to speak up (e.g., if fact-check confidence is high).  
   - Stream TTS audio back to the RTC session or render it in the UI.

8. **UI Polish & Magazine Flow**  
   - Optional: implement a page-turning interface or high-end visual aesthetic.  
   - Integrate generative image services for custom "covers."

9. **Testing & Validation**  
   - Write unit and integration tests for each agent, route, and major UI component.  
   - Validate stability of real-time connections (e.g., handle network hiccups gracefully).

10. **Deployment & Scaling**  
    - Containerize the app with Docker (`Dockerfile`, `docker-compose.yml`).  
    - Deploy to a platform of choice (AWS, GCP, DigitalOcean, etc.).  
    - Implement logging and monitoring for server load and AI usage.

---

## 5. COMMON CHALLENGES & HOW TO ADDRESS THEM

1. **Transcription Latency & Accuracy**  
   - Use streaming STT for minimal lag.  
   - Possibly adapt fallback if the API rate-limits or fails.

2. **AI Agent Hallucinations**  
   - Incorporate a FactCheckerAgent that uses verified sources or a web search for critical claims.  
   - Implement a threshold or human oversight before AI "speaks" in the conversation.

3. **File Parsing Complexity**  
   - Large or malformed PDFs, multi-sheet CSVs.  
   - Use robust libraries or queue the parsing in a background worker.

4. **Overload of Visuals**  
   - Provide a toggle or an approval workflow for the host.  
   - Let the user choose which AI-generated charts or images to display.

5. **System Resource Costs**  
   - Caching responses or partial results from AI calls.  
   - Monitor usage of external APIs, especially image generation and TTS.

---

## 6. BEST PRACTICES & GUIDELINES

1. **Error Handling**  
   - Return meaningful errors from each route (file upload, transcription, TTS).  
   - Log agent interactions in case the system needs debugging later.

2. **User Privacy**  
   - Clarify how transcripts are stored and used.  
   - Optionally provide ephemeral or anonymized transcripts.

3. **Extensibility**  
   - Each agent in the `ai/` folder should remain modular.  
   - The Orchestrator can easily add or remove specialized agents.

4. **Performance Optimization**  
   - WebSockets for real-time data to avoid polling.  
   - Use worker threads or microservices for CPU-intensive tasks (e.g., STT, image generation).

5. **Iterative Development**  
   - Always keep a working "end-to-end" pipeline, even if some features are stubbed.  
   - Gradually layer complexity (don't attempt everything in one go).

---

## 7. TIPS FOR AI AGENTS USING THIS DOCUMENT

1. **Context Recovery**: If you lose track of your current task or conversation flow, review:  
   - The **Architecture** (Section 2) for the big picture.  
   - The **File Structure** (Section 3) to see where new features should be implemented.  
   - **Milestones** (Section 4) to know which step you're on.

2. **Refactoring**: When new features conflict with existing architecture, check if you can reorganize or rename files while maintaining the core structure.

3. **Adding Dependencies**: When you add new libraries (e.g., for chart rendering or PDF parsing), remember to document it in `package.json` and reference it in the relevant `services/` or `components/` file.

4. **Consolidation**: If the project grows too large, consider modular sub-packages or microservices that handle distinct tasks (e.g., a separate microservice for STT or TTS).

5. **Open Communication**: If in doubt about the next step, you can always prompt for clarity based on the **milestone** you're working toward. This reference ensures you stay aligned with the overall vision.

---

## 8. GOING LIVE

1. **Minimum Viable Product**  
   - Achieve real-time audio transcription, a working whiteboard, and at least minimal AI commentary.
2. **Beta Testing**  
   - Gather feedback from real users or pilot episodes.  
   - Refine UI/UX around the magazine/whiteboard experience.
3. **Full Release**  
   - Host on a public server.  
   - Ensure you have usage limits or cost structures in place for AI/LLM calls.
4. **Ongoing Maintenance**  
   - Monitor logs, fix bugs, tune AI prompts for better reliability.  
   - Update to new LLM models or improved STT/TTS services as they become available.

---

## 9. FINAL REMARKS

This **Master Reference Document** should be **timeless** in the sense that future modifications can be recorded here to keep the entire project coherent. Whenever an AI agent is uncertain or forgetful, **consult this document** to realign with the app's **purpose, structure, and roadmap**.