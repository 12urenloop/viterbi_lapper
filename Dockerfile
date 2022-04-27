## BUILD STAGE
FROM node:alpine AS build

WORKDIR /viterbi_visualiser/

COPY package.json .

RUN npm i

COPY tsconfig.json .
COPY index.ts .

RUN npm run build

## RUN STAGE
FROM nginx:alpine

WORKDIR /usr/share/nginx/html/

COPY --from=build /viterbi_visualiser/index.js .
COPY index.css .
COPY index.html	.
