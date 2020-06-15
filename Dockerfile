FROM node:12.18.0 as build

WORKDIR /opt
COPY . .
RUN npm install && npm run build

FROM gcr.io/distroless/nodejs

COPY --from=build /opt /
EXPOSE 4535 8080 80
WORKDIR /dist
CMD [ "server.js" ]
