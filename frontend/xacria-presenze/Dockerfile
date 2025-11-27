# ===========================================
# STAGE 1: Dev Environment con hot reload
# ===========================================
FROM node:18-alpine

# Installa strumenti utili
RUN apk add --no-cache git curl

# Imposta directory
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Installa dipendenze
RUN npm install

# Copia il resto del codice
COPY . .

# Espone la porta di sviluppo
EXPOSE 4200

# Avvia Angular in modalità dev
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
