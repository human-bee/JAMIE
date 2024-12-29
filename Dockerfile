# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm install && npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
