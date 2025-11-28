FROM node:20-alpine AS base
WORKDIR /app

# 1) Install deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install

# 2) Copy source
COPY . .

# 3) Provide DATABASE_URL at build time for Prisma generate (can be dummy)
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/postgres"
ENV DATABASE_URL=${DATABASE_URL}

# 4) Generate Prisma client then build
RUN npx prisma generate
RUN npm run build

EXPOSE 4000
CMD ["npm", "run", "start"]
