# Stage 1: Build application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy application source
COPY . .

# Build Vite frontend and Express server bundle
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install production-only dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled dist folder from builder stage
COPY --from=builder /app/dist ./dist

# Create persistent data directory for local JSON database storage
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
