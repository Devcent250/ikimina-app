# Multi-stage build for React app
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code (excluding .env.local via .dockerignore)
COPY . .

# Set build-time environment variable
ARG VITE_PUBLIC_API_URL=https://vjn.infinityconect.com
ENV VITE_PUBLIC_API_URL=$VITE_PUBLIC_API_URL

# Debug: Print the environment variable and verify
RUN echo "🔍 Building with VITE_PUBLIC_API_URL: $VITE_PUBLIC_API_URL"
RUN echo "🔍 All VITE environment variables:" && env | grep VITE || echo "No VITE vars found"

# Build the app with environment variables baked in
RUN npm run build

# Debug: Verify build output
RUN echo "🔍 Build completed. Checking built files..." && \
    ls -la dist/ && \
    echo "🔍 Checking for API URL in build:" && \
    (grep -r "vjn.infinityconect.com" dist/ || echo "❌ Production API URL not found") && \
    (grep -r "localhost:4000" dist/ || echo "✅ No localhost URLs found")

# Production stage - Use Node.js serve (more stable than nginx for simple apps)
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Add wget for health checks
RUN apk add --no-cache wget

# Make port configurable
ARG PORT=3000
ENV PORT=$PORT

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/ || exit 1

# Expose the configured port
EXPOSE $PORT

# Start the app with serve on the configured port
CMD ["sh", "-c", "echo '🚀 Starting frontend on port' $PORT && serve -s dist -l $PORT"]
