FROM node:18-alpine

# Installa strumenti utili per sviluppo
RUN apk add --no-cache git curl

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di configurazione delle dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Installa Angular CLI globalmente (versione compatibile con Angular 15.2)
RUN npm install -g @angular/cli@15

# Copia tutto il codice sorgente
COPY . .

# Espone la porta di sviluppo
EXPOSE 4200

# Comando per avviare il development server con hot reload
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000"]
