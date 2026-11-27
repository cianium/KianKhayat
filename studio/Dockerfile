FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node *.mjs studio.css ./
RUN mkdir /data && chown node:node /data
USER node
ENV NODE_ENV=production PORT=8080 STUDIO_DB=/data/studio.sqlite
EXPOSE 8080
CMD ["node","/app/server.mjs"]
