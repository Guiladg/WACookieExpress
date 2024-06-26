import { validateOrReject } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

/** Validates body data against the validation schema using class-validator decorators. https://github.com/typestack/class-validator#readme. */
export function validateInput(validationSchema?: new () => any) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// First, check if body is provided
			if (!req.body) {
				return res.status(400).json({ message: 'Missing request body' });
			}

			// If validationSchema option exists, validate body data against it
			if (validationSchema) {
				// Create a new validation schema object
				const schema = new validationSchema();
				// Fill validation schema object with body data
				for (const field in req.body) {
					field in schema && (schema[field] = req.body[field]);
				}
				// Validate schema after filling fields
				await validateOrReject(schema);
			}

			// Next middleware
			next();
		} catch (e: any) {
			// Extract generated message from the errors array
			const message = Object.values(e[0].constraints)[0];
			// Send error message
			return res.status(400).json({ message });
		}
	};
}
