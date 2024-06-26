import axios, { AxiosResponse } from 'axios';
import User from '../models/user';
import VerificationCode from '../models/verificationCode';
import NotFoundError from '../errors/NotFoundError';
import DataBaseError from '../errors/DataBaseError';

export type Template = 'phone_number_verification';
export interface SendTemplateWAParams {
	to: number;
	template: Template;
	parameters?: Record<string, unknown>[];
	components?: Record<string, unknown>[];
}
export async function sendTemplateWA({ to, template, parameters = [], components = [] }: SendTemplateWAParams): Promise<AxiosResponse<any, any>> {
	const phoneID = process.env.WA_PHONE_ID;
	const tokenSendWA = process.env.WA_SEND_TOKEN;
	const body = {
		messaging_product: 'whatsapp',
		to,
		type: 'template',
		template: {
			name: template,
			language: {
				code: 'es_AR'
			},
			components: [
				{
					type: 'body',
					parameters
				},
				...components
			]
		}
	};
	console.log('body:', JSON.stringify(body, null, 3));

	return axios({
		method: 'post',
		url: `https://graph.facebook.com/v19.0/${phoneID}/messages`,
		headers: {
			Authorization: `Bearer ${tokenSendWA}`,
			'Content-Type': 'application/json'
		},
		data: JSON.stringify(body)
	});
}

export function sendTextWA(to: number, text: string) {
	const phoneID = process.env.WA_PHONE_ID;
	const tokenSendWA = process.env.WA_SEND_TOKEN;
	const body = {
		messaging_product: 'whatsapp',
		to,
		type: 'text',
		text: {
			body: text
		}
	};

	return axios({
		method: 'post',
		url: `https://graph.facebook.com/v19.0/${phoneID}/messages`,
		headers: {
			Authorization: `Bearer ${tokenSendWA}`,
			'Content-Type': 'application/json'
		},
		data: JSON.stringify(body)
	});
}

export async function sendNewVerificationCode(phone: string) {
	// Create verification code (random from 100000 to 999999)
	const token = String(Math.floor(Math.random() * (999_999 - 100_000 + 1)) + 100_000);

	// Save a new recovery token
	try {
		const verificationCode = new VerificationCode();
		verificationCode.phone = phone;
		verificationCode.token = token;
		verificationCode.expires = Math.round(new Date().getTime() / 1000) + 60 * 10; // 10 minutes from now
		await verificationCode.save();
	} catch (error) {
		throw new DataBaseError();
	}

	// Send WhatsApp message to user
	await sendTemplateWA({
		to: Number(phone),
		template: 'phone_number_verification',
		parameters: [
			{
				type: 'text',
				text: token
			}
		],
		components: [
			{
				type: 'button',
				sub_type: 'url',
				index: 0,
				parameters: [
					{
						type: 'text',
						text: token
					}
				]
			}
		]
	});
}
