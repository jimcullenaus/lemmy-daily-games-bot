# Use Node.js 22 as the base image
FROM zenika/alpine-chrome:with-puppeteer

# Set the working directory inside the container
WORKDIR /usr/src/app

# Ensure we are running as root for package installation
USER root

# Copy package.json and package-lock.json first
COPY package*.json ./

ENV PUPPETEER_CACHE_DIR=/usr/src/app/.cache/puppeteer

# Install dependencies required for canvas
RUN apk add --no-cache \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pkgconf \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

RUN npm install --omit=optional

# Run the application as a non-root user.
USER chrome

# Copy the rest of the project files
COPY . .

# Set a default command, but allow overriding it with an environment variable
CMD npm start
