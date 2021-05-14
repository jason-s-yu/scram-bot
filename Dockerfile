FROM node:lts-alpine as base

# use tini (https://github.com/krallin/tini/issues/8) and (https://github.com/krallin/tini)
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

COPY package.json .
COPY prisma/schema.prisma prisma/schema.prisma

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# -------- Dependency Installation --------
FROM base AS dependencies

RUN yarn config set depth 0

RUN yarn install --production --no-progress
RUN cp -R node_modules prod_modules

RUN yarn install --no-progress

# ---------------- Builder ----------------
FROM dependencies as builder

COPY . .
RUN yarn build

# -------- Dependency Injection --------
FROM base as release

COPY --from=dependencies /root/scram-bot/prod_modules ./node_modules
COPY --from=builder /root/scram-bot/dist ./dist
COPY .docker.env .env
CMD ["node", "dist/src/bot"]
