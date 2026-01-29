FROM node:18

# Instalamos las dependencias de Linux necesarias para que Chrome corra
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
# Este comando descarga el navegador correcto para este sistema
RUN npx puppeteer browsers install chrome

COPY . .
EXPOSE 3000
CMD ["node", "server.js"]