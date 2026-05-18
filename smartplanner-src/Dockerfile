# split to 2 stage for optimization, reduce docker image size
# stage 1: build the app and install dependencies
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# stage 2: run the app
FROM nginx:alpine AS runner

# copy only final built frontend files
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]