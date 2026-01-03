FROM node:24

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

ENV PUPPETEER_CACHE_DIR=/usr/src/app/.cache/puppeteer

RUN apt-get update && apt-get install -y \
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
    && rm -rf /var/lib/apt/lists/*

RUN npm install

# Run the application as a non-root user.
USER node

# Copy the rest of the project files
COPY . .

# Set a default command, but allow overriding it with an environment variable
CMD npm start 2>&1 | tee logs/bot.log
