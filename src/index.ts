/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Parse Cookie header into key-value object.
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
	if (!cookieHeader) return {};
	return Object.fromEntries(
		cookieHeader
			.split(';')
			.map((c) => {
				const eq = c.trim().indexOf('=');
				if (eq === -1) return [c.trim(), ''];
				return [c.trim().slice(0, eq), c.trim().slice(eq + 1)];
			})
			.filter(([k]) => k.length > 0)
	);
}

/**
 * Convert Headers to plain object. Handles multiple values for same header.
 */
function headersToObject(headers: Headers): Record<string, string | string[]> {
	const result: Record<string, string | string[]> = {};
	for (const [key, value] of headers.entries()) {
		const existing = result[key];
		if (existing !== undefined) {
			result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
		} else {
			result[key] = value;
		}
	}
	return result;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const bodyInfo: { type: string; consumed: boolean } = {
			type: request.body ? 'stream' : 'none',
			consumed: request.bodyUsed,
		};

		const data = {
			url: request.url,
			method: request.method,
			headers: headersToObject(request.headers),
			cookies: parseCookies(request.headers.get('Cookie')),
			cf: request.cf,
			redirect: request.redirect,
			body: bodyInfo,
			bodyText: await request.text(),
			
		};

		return new Response(JSON.stringify(data, null, 2), {
			headers: { 'Content-Type': 'application/json' },
		});
	},
} satisfies ExportedHandler<Env>;
