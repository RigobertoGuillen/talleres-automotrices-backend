FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN rm -f .env
EXPOSE 3000
CMD ["npm", "start"]