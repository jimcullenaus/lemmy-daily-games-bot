# Use Node.js 24 as the base image
FROM node:24-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# ENV PUPPETEER_CACHE_DIR=/usr/src/app/.cache/puppeteer

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
    fonts-kacst fonts-freefont-ttf dbus dbus-x11 \
    build-essential \
    python3 \
    python3-pip \
    pkg-config \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxrandr2 \
    libgbm-dev \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libpango1.0-dev \
    libcairo2-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libgtk-3-0 \
    libxdamage1 \
    libxfixes3 \
    ca-certificates \
    fonts-liberation \
    chromium \
    chromium-sandbox \
    gconf-service libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libnspr4 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcursor1 libxext6 libxi6 libxrender1 libxss1 libxtst6 libappindicator1 \
    lsb-release xdg-utils wget \
    && rm -rf /var/lib/apt/lists/*

# Skip Puppeteer browser install since we'll use system Chromium
# ENV PUPPETEER_SKIP_DOWNLOAD=true
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN npm install

# Copy the rest of the project files
COPY . .

# Create logs directory and set permissions
RUN mkdir -p logs && \
    chown -R node:node /usr/src/app

# Run the application as a non-root user.
USER node

# Set a default command, but allow overriding it with an environment variable
CMD npm start 2>&1 | tee logs/bot.log
