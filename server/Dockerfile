# Backend Dockerfile for Dokploy deployment (TypeScript + Node.js)

# Stage 1: Build
FROM node:20-alpine as build

WORKDIR /app

# Copy dependency files
COPY package*.json tsconfig.json ./

# Install all deps (including dev, for build)
RUN npm ci

# Copy source
COPY src ./src

# Build TS → JS
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy only package.json to install production deps
COPY package*.json ./

# Install production deps + typeorm CLI for migrations
RUN npm ci --only=production && npm install typeorm

# Copy built JS from build stage
COPY --from=build /app/dist ./dist

# Copy public directory for static file serving
COPY public ./public

# Create uploads directory
RUN mkdir -p public/uploads

# Set production environment
ENV NODE_ENV=production

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 4000

CMD ["npm", "start"]

