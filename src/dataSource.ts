import * as dotenv from 'dotenv';
import { DataSource, LogLevel } from 'typeorm';

// Load .env file
dotenv.config();

// Establish database connection
export const dataSource = new DataSource({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT),
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	entityPrefix: process.env.DB_PREFIX,
	synchronize: true,
	logging: ['error', ...((process.env.NODE_ENV !== 'production' ? ['query'] : []) as LogLevel[])],
	logger: 'simple-console',
	entities: [__dirname + '/**/models/*.{ts,js}'],
	// This project can run on MySQL or PostgreSQL
	type: process.env.DB_TYPE as any,
	// SSL options
	...(process.env.DB_SSL === 'true' && {
		ssl: true,
		extra: {
			ssl: {
				rejectUnauthorized: false
			}
		}
	})
});

export default dataSource;
