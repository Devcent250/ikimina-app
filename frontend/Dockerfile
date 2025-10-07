# Multi-stage build for React app
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code (excluding .env.local via .dockerignore)
COPY . .

# Set default API URL if not provided
ARG VITE_PUBLIC_API_URL=https://vjn.infinityconect.com
ENV VITE_PUBLIC_API_URL=$VITE_PUBLIC_API_URL

# Debug: Print the environment variable
RUN echo "🔍 Building with VITE_PUBLIC_API_URL: $VITE_PUBLIC_API_URL"

# Build the app
RUN npm run build

# Production stage - Use nginx for better performance
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
