import * as dotenv from 'dotenv';
import User from './models/user';
import dataSource from './dataSource';

// Load .env file
dotenv.config();

dataSource
	.initialize()
	.then(async () => {
		// Check if there are users created
		if (await User.findOneBy({ phone: '541159727098' })) {
			console.info('No need to create admin user');
			process.exit();
		}
		// Creates a new admin user
		const user_admin = new User();
		user_admin.role = 'admin';
		user_admin.phone = '541159727098';
		user_admin.password = 'admin';
		await user_admin.hashPassword();
		await user_admin.save();

		console.info('Admin user created');
		process.exit();
	})
	.catch((error) => console.error(error));
