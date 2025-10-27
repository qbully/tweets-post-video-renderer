# Production-ready Dockerfile for Twitter Video Generator Microservice
# Base image: Node.js 20 on slim Debian for minimal footprint
FROM node:20-slim

# Install system dependencies in a single layer to optimize image size
# This includes Chromium, FFmpeg, fonts, and required libraries for Puppeteer
RUN apt-get update && apt-get install -y \
    # Chromium browser for Puppeteer
    chromium \
    # FFmpeg for video processing
    ffmpeg \
    # Font packages for proper text rendering
    fonts-liberation \
    fonts-noto-color-emoji \
    # Required libraries for Chromium/Puppeteer
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    # Additional dependencies for stability
    ca-certificates \
    # Clean up apt cache to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set environment variables for Puppeteer and FFmpeg
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    NODE_ENV=production

# Copy package files first for better layer caching
# This allows Docker to cache npm install if package.json hasn't changed
COPY package*.json ./

# Install production dependencies only
# Using npm ci for faster, more reliable, reproducible builds
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
# This is done after npm install to leverage Docker layer caching
COPY . .

# Create directory for video output with proper permissions
RUN mkdir -p /data/videos && \
    chown -R node:node /data/videos && \
    chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose port 3000
EXPOSE 3000

# Add health check to monitor container health
HEALTHCHECK --interval=30s \
    --timeout=10s \
    --start-period=40s \
    --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["node", "server.js"]
