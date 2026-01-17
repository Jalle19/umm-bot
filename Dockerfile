FROM node:22-trixie AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json /app/
RUN npm install

COPY src /app/src
RUN npm run build

FROM node:22-trixie AS run

WORKDIR /app

COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules

VOLUME /data

CMD ["node", "/app/dist/umm-slack-bot.js", "-d", "/data/umm-bot.database.json"]
