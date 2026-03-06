# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# better-sqlite3 needs build tools for native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install backend dependencies (with native builds)
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --production

# Remove build tools to keep image small
RUN apk del python3 make g++

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create data directory
RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3000

EXPOSE 3000

CMD ["node", "backend/server.js"]
