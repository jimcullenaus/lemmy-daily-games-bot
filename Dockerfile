# Use Node.js 22 as the base image
FROM node:22

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

ENV PUPPETEER_CACHE_DIR=/usr/src/app/.cache/puppeteer

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    pkg-config \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxrandr2 \
    libgbm-dev \
    libasound2 \
    libpango1.0-dev \
    libcairo2-dev \
    libjpeg62-turbo-dev \
    libpixman-1-dev \
    libgif-dev \
    libpng-dev \
    libgtk-3-0 \
    libxdamage1 \
    libxfixes3 \
    ca-certificates \
    fonts-liberation \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN npm install

# Run the application as a non-root user.
USER node

# Copy the rest of the project files
COPY . .

# Set a default command, but allow overriding it with an environment variable
CMD npm start 2>&1 | tee logs/bot.log
