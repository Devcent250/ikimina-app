# Use the official Node.js image as the base image
FROM node:latest

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code
COPY . .

# app env variables
ARG DATABASE_URL
ARG JWT_SECRET
ARG PORT 
ARG NODE_ENV
ARG FRONTEND_URL

ENV DATABASE_URL=$DATABASE_URL \
  JWT_SECRET=$JWT_SECRET \
  JWT_EXPIRES_IN=$JWT_EXPIRES_IN \
  PORT=$PORT \ 
  NODE_ENV=$NODE_ENV \
  FRONTEND_URL=$FRONTEND_URL

# Run database migrations
RUN yarn migration:run

# Build the TypeScript code
RUN yarn build

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the app
CMD ["node", "dist/index.js"]
