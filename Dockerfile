FROM node:lts-alpine as base

WORKDIR /root/scram-bot
ENTRYPOINT ["/sbin/tini", "--"]

COPY package.json .

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh

# --------------------------
FROM base AS dependencies

RUN yarn config set depth 0

RUN yarn install --production --no-progress
RUN cp -R node_modules prod_node_modules

RUN yarn install --no-progress
# ---------------------------

# ---------------------------
FROM dependencies as builder

COPY . .
RUN yarn build
# ---------------------------

# ---------------------------
FROM base as release

COPY --from=dependencies /root/scram-bot/prod_node_modules ./node_modules
COPY --from=builder /root/scram-bot/dist ./dist 
CMD ["yarn", "start"]
