FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "[ -f /etc/secrets/local-production.json ] && cp /etc/secrets/local-production.json ./config/local-production.json; exec npm start"]
