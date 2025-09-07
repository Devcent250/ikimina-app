# Frontend Dockerfile for Railway (React + Node.js serve)

FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies including serve
RUN npm install

# Copy rest of the app
COPY . .

# Build React for production
RUN npm run build

# Set production environment
ENV NODE_ENV=production

# Expose port (Railway will set PORT automatically)
EXPOSE 3000

# Use serve to host the built React app with SPA routing
CMD ["npm", "start"]
