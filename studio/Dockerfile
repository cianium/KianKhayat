FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && node -e "require('sharp')" && npm cache clean --force
COPY --chown=node:node studio/server.mjs studio/config.mjs studio/core.mjs studio/store.mjs studio/catalog.mjs studio/import-legacy.mjs studio/views.mjs studio/view-util.mjs studio/profile.mjs studio/studio.css studio/studio-ui.js ./
RUN mkdir /data && chown node:node /data
USER node
ENV NODE_ENV=production PORT=8080 STUDIO_DB=/data/studio.sqlite
EXPOSE 8080
CMD ["node","/app/server.mjs"]
