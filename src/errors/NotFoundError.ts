export interface NotFoundErrorProps {
	message?: string;
	cause?: Error;
}
/** For throwing a custom error when a requested record is not found on DB. */
export default class NotFoundError extends Error {
	cause: Error;
	status: 404;

	constructor({ message, cause }: NotFoundErrorProps = {}) {
		super(message);
		this.cause = cause;
	}
}
