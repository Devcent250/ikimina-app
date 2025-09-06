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

# Copy only package.json to install production deps
COPY package*.json ./

RUN npm install --production

# Copy built JS from build stage
COPY --from=build /app/dist ./dist

# Copy anything else needed (e.g., migrations, seeds)
COPY --from=build /app/src/database ./src/database
COPY --from=build /app/src/scripts ./src/scripts

EXPOSE 4000

CMD ["npm", "run", "start:migrate"]

