#!/bin/bash

# Create root-level files
touch README.md package.json .gitignore docker-compose.yml Dockerfile

# Create client directory structure and files
mkdir -p client/src/components client/src/utils client/public
touch client/package.json
touch client/src/index.js client/src/App.js client/src/Whiteboard.js client/src/DragAndDropZone.js client/src/AIInterjection.js
touch client/src/components/PageLayout.js client/src/components/ChartCanvas.js client/src/components/GeneratedCover.js
touch client/src/utils/api.js client/src/utils/fileParser.js
touch client/public/index.html
touch client/.env

# Create server directory structure and files
mkdir -p server/routes server/controllers server/services server/utils
touch server/index.js server/config.js
touch server/routes/upload.js server/routes/transcription.js server/routes/search.js server/routes/tts.js server/routes/aiOrchestration.js
touch server/controllers/fileController.js server/controllers/transcriptionController.js server/controllers/searchController.js server/controllers/ttsController.js
touch server/services/whisperService.js server/services/factCheckService.js server/services/imageGenService.js server/services/ttsService.js
touch server/utils/logger.js server/utils/parser.js
touch server/.env

# Create ai directory and files
mkdir -p ai
touch ai/orchestratorAgent.js ai/factCheckerAgent.js ai/webSearchAgent.js ai/codeGeneratorAgent.js ai/summaryAgent.js ai/config.js

# Create tests directory structure and files
mkdir -p tests/client tests/server tests/ai
touch tests/client/Whiteboard.test.js tests/client/AIInterjection.test.js
touch tests/server/routes.test.js tests/server/controllers.test.js
touch tests/ai/orchestratorAgent.test.js tests/ai/factCheckerAgent.test.js

echo "Project structure created successfully inside 'WHITEBOARD JAMIE'"

