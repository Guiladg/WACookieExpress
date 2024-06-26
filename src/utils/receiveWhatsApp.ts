import { Request, Response } from 'express';
import { createHmac } from 'crypto';
import { sendTextWA } from './sendWhatsApp';

/** Validate Meta Token for WhatsApp, only for config purposes */
export async function validateWhatsApp(req: Request, res: Response) {
	if (req.query['hub.verify_token'] !== process.env.tokenWebhookWA) {
		return res.status(401).send();
	}
	res.send(req.query['hub.challenge']);
}

/** Receive WhatsApp message response, from webhook */
export async function receiveWhatsApp(req: Request & { rawBody: Buffer }, res: Response) {
	// Verify signature, compare with token
	const signature = req.headers['x-hub-signature-256'] as string;
	if (!signature) {
		return res.status(401).send();
	}
	const signatureHash = signature.substring(7); // After sha256=
	const expectedHash = createHmac('sha256', process.env.tokenAppWA).update(req.rawBody).digest('hex');
	if (signatureHash !== expectedHash) {
		return res.status(401).send();
	}

	// Message data from body
	const data = req.body;
	const message = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
	if (!message) {
		return;
	}

	// Button actions
	if (message.type === 'button') {
		const payload = message.button.payload.split('_');
		// Pedido abandonado
	}

	res.send('ok');
}
