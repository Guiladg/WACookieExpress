import { Request, Response } from 'express';
import User from '../models/user';
import { ClientList, ClientRecord } from '../types/client';
import { createRecord, updateRecord } from '../utils/crud';

class UserController {
	static list = async (req: Request, res: Response) => {
		// Page number and page size from querystring
		const page = Number(req.query.page) || 0;
		const pageSize = Number(req.query.size) || Number(process.env.PAGE_SIZE);
		const order = req.query.order ?? 'asc';
		const sort = (req.query.sort as string) ?? 'phone';

		// Select users
		let records: User[];
		try {
			records = await User.find({
				select: ['id', 'phone', 'role'],
				skip: page * pageSize,
				take: pageSize,
				order: { [sort]: order }
			});
		} catch (e) {
			return res.status(409).send('Error inesperado.');
		}

		// Get count of rows
		const totalRecords = await User.count();

		// Return rows and associated data for rendering the table
		const ret: ClientList = {
			records,
			totalRecords,
			page,
			pageSize,
			order: `${sort} ${order}`
		};
		res.send(ret);
	};

	static get = async (req: Request, res: Response) => {
		console.log('req.params:', req.params);
		// Id parameter from URL
		const id = Number(req.params.id);

		// Search user, if not found, return 404
		let data: User;
		try {
			data = await User.findOneOrFail({
				where: { id },
				select: ['id', 'phone', 'role']
			});
		} catch (error) {
			return res.status(404).send('Registro no encontrado.');
		}

		// Return user data
		res.send(data);
	};

	static add = async (req: Request, res: Response) => {
		// New user data from body
		const userData = req.body;

		// Check if there is already another user with same phone number
		const test = await User.findOne({ where: { phone: userData.phone } });
		if (test) {
			return res.status(400).send({ message: 'Ya existe un usuario registrado con este número de teléfono.' });
		}

		// Hash password before saving
		if (userData.password) {
			userData.password = await User.hashAnyPassword(userData.password);
		}

		// Create record
		try {
			const record = await createRecord(User, { data: { ...userData } });

			// Create return to client object
			const { password: _pass, ...retData } = record;
			const ret: ClientRecord = {
				record: retData,
				message: 'Usuario creado con exito.'
			};

			// Return 200 and the newly created record without unnecessary data (password)
			res.status(200).json(ret);
		} catch (error) {
			// Return errors with code and message if exists
			res.status(error?.status ?? 500).send(error?.message ?? '');
		}
	};

	static edit = async (req: Request, res: Response) => {
		// Id parameter from URL
		const id = Number(req.params.id);

		// User data from body
		const userData = req.body;

		// Check if there is already another user with same phone number
		const test = await User.findOne({ where: { phone: userData.phone } });
		if (test) {
			return res.status(400).send({ message: 'Ya existe un usuario registrado con este número de teléfono.' });
		}

		// Hash password before saving
		if (userData.password !== undefined) {
			userData.password = await User.hashAnyPassword(userData.password);
		}

		try {
			const record = await updateRecord(User, { data: { id, ...userData } });

			// Create return to client object
			const { password: _pass, ...retData } = record;
			const ret: ClientRecord = {
				record: retData,
				message: 'Usuario modificado con exito.'
			};

			// Return 200 and the newly created record without unnecessary data (password)
			res.status(200).json(ret);
		} catch (error) {
			// Return errors with code and message if exists
			res.status(error?.status ?? 500).send(error?.message ?? '');
		}
	};

	static delete = async (req: Request, res: Response) => {
		// Id parameter from URL
		const id = Number(req.params.id);

		// Prevent user from deleting itself
		if (id === req?.jwtPayload?.id) {
			return res.status(409).send('No puede eliminarse el usuario activo.');
		}

		// Search user, if not found, return 404
		let record: User;
		try {
			record = await User.findOneOrFail({ where: { id: Number(id) } });
		} catch (error) {
			return res.status(404).send('Registro no encontrado.');
		}

		// Try to delete the record
		try {
			await record.remove();
		} catch (e) {
			return res.status(500).send('Error en la base de datos.');
		}

		// Return 200 and the deleted record without unnecessary data
		const { password: pass, ...retData } = record;
		res.status(200).send({
			record: retData,
			text: 'Usuario eliminado con éxito.'
		});
	};
}

export default UserController;
