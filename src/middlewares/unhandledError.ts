import { Request, Response, NextFunction } from 'express';

/** Global error-handling middleware. */
export function unhandledError(err: Error, req: Request, res: Response, next: NextFunction) {
	if (res.headersSent) {
		return next(err);
	}
	res.status(500);
	console.error(`Error: ${err.message}`);
	return res.status(500).json({ message: 'Internal server error' });
}
