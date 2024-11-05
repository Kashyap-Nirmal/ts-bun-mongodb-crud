run:
	bun run src/index.ts

migrate:
	npx prisma migrate dev

generate:
	npx prisma generate
