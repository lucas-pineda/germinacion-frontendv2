
# Etapa 1: Build de React con Vite
FROM node:20-alpine AS builder

# Directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Build de producción
RUN npm run build


# Etapa 2: Servidor Nginx
FROM nginx:stable-alpine

# Copiar archivos generados por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
