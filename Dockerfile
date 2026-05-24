# Stage 1: Development
FROM node:20-alpine AS development

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code and other files
COPY . .

# Expose backend port
EXPOSE 5000

# Start nodemon dev server
CMD ["npm", "run", "dev"]


# Stage 2: Build
FROM development AS build

# Build the TypeScript project
RUN npm run build


# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled files from build stage
COPY --from=build /app/dist ./dist

# Expose backend port
EXPOSE 5000

# Start production server
CMD ["npm", "start"]
