FROM node:18-slim

# 1. Instalar dependencias necesarias para que corra Chrome (Puppeteer)
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 2. Configurar directorio de trabajo
WORKDIR /usr/src/app

# 3. Copiar archivos de dependencias e instalar
COPY package*.json ./
RUN npm install

# 4. Copiar el resto del código del proyecto
COPY . .

# 5. Exponer el puerto
EXPOSE 3000

# 6. Comando para iniciar el servidor
CMD [ "node", "server.js" ]