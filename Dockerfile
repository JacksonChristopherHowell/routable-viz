FROM node:erbium-alpine AS builder

WORKDIR /root/app/
COPY package.json webpack.config.js ./
EXPOSE 8081

CMD npm install && npm start
