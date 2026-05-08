FROM node:20-bookworm
WORKDIR /app
COPY package*.json ./
RUN rm -f package-lock.json
RUN npm install
COPY . .
RUN npm install -g prisma@5.22.0 && prisma generate
RUN npm run build
EXPOSE 3007
CMD ["npm", "run", "start"]
