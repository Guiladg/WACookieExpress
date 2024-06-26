import * as dotenv from 'dotenv';
import dataSource from './dataSource';
import app from './app';

// Load .env file
dotenv.config();

dataSource
	.initialize()
	.then(async () => {
		// Start listening requests
		app.listen(process.env.PORT, () => {
			console.info(`\n***************************************************************************`);
			console.info(`*  Server started and running.`);
			console.info(`*  Port: ${process.env.PORT}.`);
			console.info(`*  API Route: /${process.env.API_ROUTE}`);
			console.info(`*  Root dir: ${__dirname}.`);
			console.info(`***************************************************************************\n`);
		});
	})
	.catch((error) => {
		console.error(`\n***************************************************************************`);
		console.error('*  Error initializing database:', error);
		console.error(`***************************************************************************\n`);
	});
