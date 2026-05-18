# Use official Node.js LTS (slim = smaller image)
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files first (for layer caching)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the source
COPY . .

# Cloud Run injects PORT env var (usually 8080) — expose it
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "src/index.js"]
