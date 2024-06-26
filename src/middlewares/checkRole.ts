import { Request, Response, NextFunction } from 'express';

/** Checks if the user role provided in the access token fits the list of allowed ones. */
export function checkRole(...roles: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		// Check if array of authorized roles includes the user's role
		if (!roles.includes(req?.jwtPayload?.role)) {
			res.status(403).send(process.env.NODE_ENV !== 'production' ? 'Invalid user role' : '');
		}

		// Next middleware
		next();
	};
}
