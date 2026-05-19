FROM node:20-alpine

WORKDIR /app

# Pre-install dependencies to utilize docker layer cache
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
