FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

# Apply migrations and seed database
RUN npx prisma migrate deploy || true
RUN npm run seed 2>/dev/null || true

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
