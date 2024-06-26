import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import User from '../models/user';
import { createTokens, removeToken } from '../utils/jwt';
import RefreshToken from '../models/refreshToken';
import { MoreThan } from 'typeorm';
import { RefreshPayload } from '../types/payload';
import { ClientRecord } from '../types/client';
import VerificationCode from '../models/verificationCode';
import { sendNewVerificationCode } from '../utils/sendWhatsApp';
import DataBaseError from '../errors/DataBaseError';

class AuthController {
	/** Login user and send tokens. */
	static login = async (req: Request, res: Response) => {
		// Login data from body
		const { phone, password } = req.body;

		// Find user by phone number
		let user: User;
		try {
			user = await User.findOneOrFail({
				where: [{ phone }]
			});
		} catch (error) {
			return res.status(401).json({ message: process.env.NODE_ENV !== 'production' ? 'Incorrect username' : 'Incorrect username or password' });
		}

		// Check password
		if (!(await user.checkPassword(password))) {
			return res.status(401).json({ message: process.env.NODE_ENV !== 'production' ? 'Incorrect password' : 'Incorrect username or password' });
		}

		// Create tokens and store refresh in database
		let newAccessToken: string;
		let newRefreshToken: string;
		let newControlToken: string;
		try {
			[newAccessToken, newRefreshToken, newControlToken] = createTokens(user);
		} catch (error) {
			// Return errors with code and message if exists
			res.status(error?.status ?? 500).send(error?.message ?? '');
		}

		// Send tokens to the client inside cookies
		// HTTP-only cookies for access and refresh tokens
		res.cookie('access_token', newAccessToken, {
			sameSite: 'none',
			secure: true,
			httpOnly: true,
			maxAge: Number(process.env.ACCESS_TOKEN_LIFE) * 60 * 1000
		});
		res.cookie('refresh_token', newRefreshToken, {
			sameSite: 'none',
			secure: true,
			httpOnly: true,
			maxAge: Number(process.env.REFRESH_TOKEN_LIFE) * 60 * 1000
		});
		// Regular cookie for access control token
		res.cookie('control_token', newControlToken, {
			sameSite: 'none',
			secure: true,
			httpOnly: false,
			maxAge: Number(process.env.REFRESH_TOKEN_LIFE) * 60 * 1000
		});

		// Set in record user without sensitive information
		const { password: pass, ...record } = user;

		// Create return to client object
		const ret: ClientRecord = {
			record,
			message: 'Login Ok'
		};

		// Return 200 and the user data
		res.status(200).json(ret);
	};

	/** Refresh tokens and send new ones. */
	static refresh = async (req: Request, res: Response) => {
		// Control (non-http-only) token from cookies
		const controlToken: string = req.cookies.control_token;

		// Refresh token from cookies
		const refreshToken: string = req.cookies.refresh_token;

		// If there is no control token, complete unfinished logout and return error status
		if (!controlToken) {
			// Remove refresh token from database
			removeToken(refreshToken);

			// Delete cookies from client
			res.cookie('access_token', '', { maxAge: 1 });
			res.cookie('refresh_token', '', { maxAge: 1 });
			return res.status(401).json({ message: process.env.NODE_ENV !== 'production' ? 'No control token' : '' });
		}

		// If there is no refresh token, the request is unauthorized
		if (!refreshToken) {
			return res.status(401).json({ message: process.env.NODE_ENV !== 'production' ? 'No refresh token' : '' });
		}

		// Validate control token
		try {
			jwt.verify(controlToken, process.env.REFRESH_TOKEN_SECRET);
		} catch (error) {
			return res.status(401).json({ message: process.env.NODE_ENV !== 'production' ? 'Invalid control token' : '' });
		}

		// Validate refresh token
		let refreshPayload: RefreshPayload;
		try {
			refreshPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET) as RefreshPayload;
		} catch (error) {
			return res.status(401).json({ message: process.env.NODE_ENV !== 'production' ? 'Invalid refresh token' : '' });
		}

		// Get user
		let user: User;
		try {
			user = await User.findOneOrFail({ where: { id: refreshPayload.idUser } });
		} catch (error) {
			return res.status(401).json({ message: process.env.NODE_ENV !== 'production' ? 'User not found' : '' });
		}

		// Verify that the refresh token is in database and remove it
		// Double check validity
		let refreshTokenRecord: RefreshToken;
		try {
			const expirationTime = Math.round(new Date().getTime() / 1000);
			refreshTokenRecord = await RefreshToken.findOneOrFail({
				where: { user: { id: refreshPayload.idUser }, token: refreshPayload.token, expires: MoreThan(expirationTime) }
			});
			refreshTokenRecord.remove();
		} catch (error) {
			return res.status(401).json({ message: process.env.NODE_ENV !== 'production' ? 'Refresh token not found' : '' });
		}

		// Create tokens and store refresh in database
		let newAccessToken: string;
		let newRefreshToken: string;
		let newControlToken: string;
		try {
			[newAccessToken, newRefreshToken, newControlToken] = createTokens(user);
		} catch (error) {
			// Return errors with code and message if exists
			res.status(error?.status ?? 500).send(error?.message ?? '');
		}

		// Send new tokens to the client inside cookies
		// HTTP-only cookies for access and refresh tokens
		res.cookie('access_token', newAccessToken, {
			secure: process.env.NODE_ENV === 'production',
			httpOnly: process.env.NODE_ENV === 'production',
			maxAge: Number(process.env.ACCESS_TOKEN_LIFE) * 60 * 1000
		});
		res.cookie('refresh_token', newRefreshToken, {
			secure: process.env.NODE_ENV === 'production',
			httpOnly: process.env.NODE_ENV === 'production',
			maxAge: Number(process.env.REFRESH_TOKEN_LIFE) * 60 * 1000
		});
		// Regular cookie for access control token
		res.cookie('control_token', newControlToken, {
			sameSite: 'none',
			secure: true,
			httpOnly: false,
			maxAge: Number(process.env.REFRESH_TOKEN_LIFE) * 60 * 1000
		});
		res.send();
	};

	/** Logout user and delete tokens. */
	static logout = async (req: Request, res: Response) => {
		// Refresh token from cookies
		const refreshToken: string = req.cookies.refresh_token;

		// Remove refresh token from database
		removeToken(refreshToken);

		// Delete cookies from client
		res.cookie('access_token', '', { maxAge: 1 });
		res.cookie('refresh_token', '', { maxAge: 1 });
		res.cookie('control_token', '', { maxAge: 1 });

		// Return 204
		res.status(204).send();
	};

	static changePassword = async (req: Request, res: Response) => {
		// Get the user from middlewares
		const phone = req?.jwtPayload?.phone ?? '';

		// Data for password change
		const { oldPassword, newPassword } = req.body;
		if (!oldPassword || !newPassword) {
			return res.status(400).send();
		}

		// Get user
		let user: User;
		try {
			user = await User.findOneOrFail({ where: { phone } });
		} catch (error) {
			return res.status(404).send(process.env.NODE_ENV !== 'production' ? 'Usuario inexistente' : '');
		}

		// Verify current password
		if (!user.checkPassword(oldPassword)) {
			return res.status(400).send(process.env.NODE_ENV !== 'production' ? 'Password actual incorrecto' : '');
		}

		// Change password and encrypt it
		user.password = newPassword;
		user.hashPassword();

		// Save new user data
		try {
			await user.save();
		} catch (error) {
			return res.status(500).send();
		}

		// Return 204
		res.status(204).send();
	};

	static askNewPhone = async (req: Request, res: Response) => {
		// New phone from body
		const phone = req.body.phone;

		try {
			await sendNewVerificationCode(phone);
		} catch (error) {
			if (error instanceof DataBaseError) {
				console.error(error);
				return res.status(500).send(process.env.NODE_ENV !== 'production' ? error : '');
			} else {
				console.error(error);
				return res.status(400).send(process.env.NODE_ENV !== 'production' ? error : '');
			}
		}

		// Return 204
		res.status(204).send();
	};

	static confirmNewPhone = async (req: Request, res: Response) => {
		// Get the user from middlewares
		const currentPhone = req?.jwtPayload?.phone ?? '';

		// Phone number and restore token from body
		const { phone: newPhone, token } = req.body;

		// Get user
		let user: User;
		try {
			user = await User.findOneOrFail({ where: { phone: currentPhone } });
		} catch (error) {
			return res.status(404).send(process.env.NODE_ENV !== 'production' ? 'Usuario inexistente' : '');
		}

		// Confirm that verification code exists
		try {
			await VerificationCode.findOneOrFail({
				where: {
					phone: newPhone,
					token,
					expires: MoreThan(Math.round(new Date().getTime() / 1000))
				}
			});
		} catch (error) {
			return res.status(409).send(process.env.NODE_ENV !== 'production' ? 'Código de verificación inválido' : '');
		}

		// Change phone number
		// Save new user data
		// Remove every token for this user from database
		try {
			user.phone = newPhone;
			await user.save();
			await VerificationCode.delete({ phone: currentPhone });
		} catch (error) {
			console.error(error);
			return res.status(500).send(process.env.NODE_ENV !== 'production' ? error : '');
		}

		// Return 204
		res.status(204).send();
	};

	static resetPassword = async (req: Request, res: Response) => {
		// User phone from body
		const phone = req.body.phone;

		// Get user
		let user: User;
		try {
			user = await User.findOneOrFail({ where: { phone } });
		} catch (error) {
			return res.status(404).send(process.env.NODE_ENV !== 'production' ? 'Usuario inexistente' : '');
		}

		try {
			await sendNewVerificationCode(phone);
		} catch (error) {
			if (error instanceof DataBaseError) {
				console.error(error);
				return res.status(500).send(process.env.NODE_ENV !== 'production' ? error : '');
			} else {
				console.error(error);
				return res.status(400).send(process.env.NODE_ENV !== 'production' ? error : '');
			}
		}

		// Return 204
		res.status(204).send();
	};

	static restorePassword = async (req: Request, res: Response) => {
		// Username, restore token and new password from body
		const { phone, token, password } = req.body;

		// Get user
		let user: User;
		try {
			user = await User.findOneOrFail({ where: { phone } });
		} catch (error) {
			return res.status(404).send(process.env.NODE_ENV !== 'production' ? 'Usuario inexistente' : '');
		}

		// Confirm that verification code exists
		try {
			await VerificationCode.findOneOrFail({
				where: {
					phone,
					token,
					expires: MoreThan(Math.round(new Date().getTime() / 1000))
				}
			});
		} catch (error) {
			return res.status(401).send(process.env.NODE_ENV !== 'production' ? 'Código de verificación inválido' : '');
		}

		// Change password and encrypt
		// Save new user data
		// Remove every token for this user from database
		try {
			user.password = password;
			await user.hashPassword();
			await user.save();
			await VerificationCode.delete({ phone });
		} catch (error) {
			console.error(error);
			return res.status(500).send(process.env.NODE_ENV !== 'production' ? error : '');
		}

		// Return 204
		res.status(204).send();
	};

	static userData = async (req: Request, res: Response) => {
		// idUser from payload
		const idUser = req?.jwtPayload?.id;

		// Get user
		let user: User;
		try {
			user = await User.findOneOrFail({ where: { id: idUser } });
		} catch (error) {
			return res.status(404).send(process.env.NODE_ENV !== 'production' ? 'Usuario inexistente' : '');
		}

		// Return user without unnecessary data
		const { password: pass, ...retData } = user;
		res.send(retData);
	};

	static validate = (req: Request, res: Response) => {
		// Return 204 when middleware validated authentication token
		res.status(204).send();
	};
}
export default AuthController;
