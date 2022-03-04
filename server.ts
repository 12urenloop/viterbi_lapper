import * as log from "https://deno.land/std@0.127.0/log/mod.ts";

import { Application } from "https://deno.land/x/oak@v10.4.0/mod.ts";

// Configure logger
await log.setup({
	handlers: {
		console: new log.handlers.ConsoleHandler("DEBUG"),
	},
	loggers: {
		default: {
			level: "DEBUG",
			handlers: ["console"],
		},
	},
});
const logger = log.getLogger();

const app = new Application();

/* App Config */

// Simple logger due to lack of proper logging library for koa (somehow)
app.use(async (ctx, next) => {
	await next();

	const date = new Date(Date.now()).toISOString();
	const user_agent = ctx.request.headers.get("User_Agent");
	const { method } = ctx.request;
	const { url } = ctx.request;
	const { status } = ctx.response;
	logger.info(`${date} ${user_agent} ${method} ${url} ${status}`);
});

app.addEventListener("listen", () => {
	const date = new Date(Date.now()).toISOString();
	log.info(`${date} viterbi_lapper started on http://localhost`);
});

/* Request Handlers */

app.use(async (ctx, next) => {
	try {
		await ctx.send({
			root: `${Deno.cwd()}/public`,
			index: "index.html",
		});
	} catch {
		next();
	}
});

await app.listen({ port: 80 });
