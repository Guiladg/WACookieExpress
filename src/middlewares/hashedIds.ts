import { Request, Response, NextFunction } from 'express';
import Sqids from 'sqids';

const sqids = new Sqids({
	alphabet: 'abcdefghijklmnopqrstuvwxyz',
	minLength: 10
});

/** helper function to recursively replace ids inside object */
export function replaceIds(obj: any, replaceFunc: (v: any) => any) {
	if (obj == null) return obj;

	for (const key of Object.keys(obj)) {
		if (obj[key] == null) continue;

		if (typeof obj[key] === 'object') obj[key] = replaceIds(obj[key], replaceFunc);
		else if (key == 'id' || (key.length >= 4 && key.endsWith('_id'))) obj[key] = replaceFunc(obj[key]);
	}
	return obj;
}

export function encodeIds(req: Request, res: Response, next: NextFunction) {
	const _json = res.json;
	res.json = (obj: any) => {
		res.json = _json;
		obj = replaceIds(obj, (v) => sqids.encode([v]));
		return res.json(obj);
	};
	next();
}

/**
 * Middleware to decode ids in routes.
 * Converts alphabetical/obfuscated to numeric/real ids in query, body and params.
 */
export function decodeIds(req: Request, res: Response, next: NextFunction) {
	try {
		req.query = replaceIds(req.query, (v) => sqids.decode(v)[0]);
		req.body = replaceIds(req.body, (v) => sqids.decode(v)[0]);
		req.params = replaceIds(req.params, (v) => sqids.decode(v)[0]);
	} catch (error) {
		console.error(error);
		return res.status(500).send(process.env.NODE_ENV !== 'production' ? error : '');
	}
	next();
}
