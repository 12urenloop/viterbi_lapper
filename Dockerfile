#############
#	BUILD   #
#############

FROM node:alpine AS build

WORKDIR /viterbi_lapper

RUN npm i -D parcel
RUN npm i -D @parcel/transformer-sass
RUN npm i -D @parcel/transformer-webmanifest
RUN npm i -D @parcel/packager-raw-url

# Copy over static files
COPY ./public/ ./public/

RUN npx parcel build ./public/*.html

###########
#	RUN   #
###########

FROM denoland/deno:alpine

# Install curl (for healthcheck)
RUN apk --no-cache add curl

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=2 CMD curl --fail http://localhost/ || exit 1

WORKDIR /viterbi_lapper

USER deno

# Copy over backend code
COPY --chown=deno ./server.ts .

# Cache compiled code
RUN deno cache server.ts

# copy over built static files
COPY --from=build --chown=deno /viterbi_lapper/dist/ ./public/

CMD [ "run", "--allow-net", "--allow-env", "--allow-read", "server.ts" ]
