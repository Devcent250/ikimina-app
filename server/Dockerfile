# Backend Dockerfile for Railway (TypeScript + Node.js)

# Stage 1: Build
FROM node:20-alpine as build

WORKDIR /app

# Copy dependency files
COPY package*.json tsconfig.json ./

# Install all deps (including dev, for build)
RUN npm install

# Copy source
COPY . .

# Build TS → JS
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy only package.json to install production deps + typeorm for migrations
COPY package*.json ./

# Install production deps + typeorm CLI for migrations
RUN npm install --production && npm install typeorm

# Copy built JS from build stage
COPY --from=build /app/dist ./dist

# Set production environment
ENV NODE_ENV=production

EXPOSE 4000

CMD ["npm", "start"]

