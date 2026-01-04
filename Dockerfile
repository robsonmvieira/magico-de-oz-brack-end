FROM node:22

RUN npm install -g @nestjs/cli@11

USER node

WORKDIR /home/node/app

CMD [ "tail", "-f", "/dev/null" ]