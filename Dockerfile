FROM node:18.16.0-alpine As build

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .
COPY .yarn/cache ./.yarn/cache
COPY .yarn/plugins ./.yarn/plugins
COPY .yarn/releases ./.yarn/releases
COPY .yarnrc.yml .

RUN yarn install

COPY tsconfig.json .
COPY tsconfig.build.json .
COPY prisma ./prisma
COPY src ./src

ENV NODE_ENV production

RUN yarn prisma:generate
RUN yarn build
RUN SKIP_POSTINSTALL=1 yarn workspaces focus --production

###################
# PRODUCTION
###################

FROM node:18.16.0-alpine As production

USER node
WORKDIR /usr/src/app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

ENV NODE_ENV production

# Start the server using the production build
CMD ["node", "--require", "./dist/tracing.js", "dist/main.js"]
