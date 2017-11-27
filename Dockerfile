FROM node:8.9.0-alpine

WORKDIR /usr/local/src/microservices-path-mv
COPY package.json .
RUN npm install
ADD . .
EXPOSE 80
CMD npm start
