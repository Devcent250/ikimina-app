# Frontend Dockerfile for Railway (React + Nginx)

# Stage 1: Build React app
FROM node:20-alpine as build

WORKDIR /app

# Copy dependency files
COPY package*.json ./

RUN npm install

# Copy rest of the app
COPY . .

# Build React for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy build files to Nginx web root
COPY --from=build /app/build /usr/share/nginx/html

# Optional: custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
