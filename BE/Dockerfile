FROM node:18-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma generate && npm start"]