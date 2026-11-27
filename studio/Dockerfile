FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node server.mjs config.mjs core.mjs store.mjs catalog.mjs import-legacy.mjs views.mjs view-util.mjs studio.css studio-ui.js ./
RUN mkdir /data && chown node:node /data
USER node
ENV NODE_ENV=production PORT=8080 STUDIO_DB=/data/studio.sqlite
EXPOSE 8080
CMD ["node","/app/server.mjs"]
