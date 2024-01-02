FROM node:latest

WORKDIR /app

COPY ./javascript/producer/package.json ./package.json
COPY ./javascript/producer/package-lock.json ./package-lock.json

RUN yes | npm install -g npm
RUN yes | npm install

COPY ./javascript/producer ./

CMD ["node", "index.js"]