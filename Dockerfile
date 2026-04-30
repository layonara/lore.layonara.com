# syntax=docker/dockerfile:1.7
# Multi-stage build for Next.js 16 with output: 'standalone'.
# Final image is ~150MB (node:22-alpine + standalone bundle + sharp).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# imagemagick decodes both DDS and TGA portrait sources from nwn-haks; sharp
# alone (libvips) handles TGA but not DDS. Shell out via convert(1) for the
# decode + resize + WebP encode in a single subprocess; cache result on disk.
# libwebp-tools provides the cwebp delegate that imagemagick shells out to
# for WebP output — it's not bundled with the imagemagick alpine package.
RUN apk add --no-cache imagemagick libwebp-tools

# Non-root user for the runtime — matches what create-next-app's standalone
# template expects. Sharp's prebuilt binaries handle musl on alpine via the
# linux-musl target it pulls in automatically.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Portrait cache lives on a Coolify-managed volume so it survives redeploys.
RUN mkdir -p /var/cache/portraits && chown nextjs:nodejs /var/cache/portraits

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
