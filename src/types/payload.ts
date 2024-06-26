export interface Payload {
	id: number;
	phone: string;
	role: string;
}

export interface RefreshPayload {
	idUser: number;
	token: string;
}

// Add jwtPayload to express Request object
declare module 'express-serve-static-core' {
	interface Request {
		jwtPayload?: Payload;
	}
}
