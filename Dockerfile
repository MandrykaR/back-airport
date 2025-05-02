FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -g ts-node nodemon

COPY . .


EXPOSE ${PORT}

CMD ["npm", "run", "dev"]