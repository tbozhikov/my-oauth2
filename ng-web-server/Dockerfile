FROM node:lts

WORKDIR /usr/src/app
COPY package.json .
COPY ../ng-client/dist/ng-client .
RUN npm install
COPY . .

CMD [ "npm", "start" ] 