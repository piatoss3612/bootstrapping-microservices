FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY index.js ./

COPY ./videos ./videos

ENV PORT=3000

CMD npm start