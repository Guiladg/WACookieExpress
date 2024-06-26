export interface DataBaseErrorProps {
	message?: string;
	cause?: Error;
}
/** For throwing a custom error on save/delete processes. */
export default class DataBaseError extends Error {
	cause: Error;
	status: 500;

	constructor({ message, cause }: DataBaseErrorProps = {}) {
		super(message);
		this.cause = cause;
	}
}
