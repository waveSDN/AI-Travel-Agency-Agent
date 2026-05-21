FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies only when package files change
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
