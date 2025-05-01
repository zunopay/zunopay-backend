FROM node:18-slim AS builder
WORKDIR /app
ENV PORT 3005
EXPOSE 3005

RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*
RUN git config --global url."https://".insteadOf ssh://

COPY package.json yarn.lock ./
COPY prisma ./prisma/

RUN yarn install --immutable && yarn cache clean

COPY . .

RUN yarn build

CMD ["yarn", "start:prod"]