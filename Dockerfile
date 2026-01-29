# Usamos una imagen de Node que ya trae herramientas de Linux
FROM ghcr.io/puppeteer/puppeteer:24.1.1

# Cambiamos al usuario root para instalar lo que falte
USER root

# Configuramos el directorio de trabajo
WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las dependencias
RUN npm ci

# Copiamos el resto del código
COPY . .

# Exponemos el puerto (Railway usa el que definas en variables)
EXPOSE 3000

# Comando para arrancar
CMD ["node", "server.js"]