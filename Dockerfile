# Incident Sensory Fabric — Capstone Phase-1 demo
# Build: docker build -t incident-sensory-fabric .
# Run:   docker run --rm -p 4317:4317 incident-sensory-fabric
# Then open http://127.0.0.1:4317 on THIS machine.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY scenarios ./scenarios
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# scenarios JSON is imported at build time into the bundle; keep folder for honesty/docs
COPY --from=build /app/scenarios /usr/share/nginx/html/scenarios
EXPOSE 4317
CMD ["nginx", "-g", "daemon off;"]
