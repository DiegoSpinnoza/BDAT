# Build React
FROM node:22

LABEL version="1.0"
LABEL maintainer = ["felipe.castroa@alumnos.uv.cl"]

WORKDIR /src

COPY ["package.json", "package-lock.json", "./"]

RUN npm install --production

COPY . .

EXPOSE 80

CMD ["npm", "start"]
