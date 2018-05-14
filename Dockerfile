FROM node:latest

COPY ./node_modules /node_modules
COPY ./dist /dist

CMD ["node","/dist/app.js"]
