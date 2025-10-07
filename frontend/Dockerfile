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

# Production stage - Use nginx for better performance
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add curl for health checks
RUN apk add --no-cache curl

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/nginx-status || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
