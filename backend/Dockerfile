# Stage 1: Build dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for potential build scripts)
RUN npm install

# Copy source code
COPY . .

# Stage 2: Production runtime
FROM node:20-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy only production dependencies and source from builder
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copy source
COPY --from=builder /app/src ./src

# Create a non-root user for security
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
USER nodeapp

# Expose port
EXPOSE 5002

# Run the application
CMD ["node", "src/server.js"]
