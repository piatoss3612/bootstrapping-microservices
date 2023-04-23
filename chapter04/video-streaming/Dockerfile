FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY index.js ./

COPY ./videos ./videos

CMD npm start