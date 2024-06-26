import { Router } from 'express';
import AuthController from '../../controllers/auth';
import { validateInput } from '../../middlewares/validateInput';
import { UserLoginValidationSchema } from '../../validators/user';
import { checkJwt } from '../../middlewares/checkJwt';
import {
	AuthChangePasswordValidationSchema,
	AuthConfirmChangePhoneValidationSchema,
	AuthRestorePasswordValidationSchema,
	AuthValidatePhoneValidationSchema
} from '../../validators/auth';

const router = Router();

/**
 * * Login
 * @openapi
 * /AS/auth/login:
 *   post:
 *     tags: ['Authentication Service']
 *     summary: Logs in user. Returns cookies with JWT tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 example: 541144445555
 *                 type: string
 *                 description: User's phone number.
 *               password:
 *                 example: Abcd1234
 *                 type: string
 *                 description: User's login password.
 *             required:
 *               - phone
 *               - password
 *     responses:
 *       200:
 *         description: Login ok.
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/ResponseRecordUser'
 *         headers:
 *           Set-Cookie (access_token):
 *             schema:
 *               type: string
 *               example: access_token=abcde12345; Max-Age=5184000; Path=/; Expires=Fri, 23 Aug 2024 19:32:08 GMT; HttpOnly; Secure; SameSite=None
 *               description: A HttpOnly-plus-secure cookie with the access token.
 *           Set-Cookie (refresh_token):
 *             schema:
 *               type: string
 *               example: refresh_token=abcde12345; Max-Age=5184000; Path=/; Expires=Fri, 23 Aug 2024 19:32:08 GMT; HttpOnly; Secure; SameSite=None
 *               description: A HttpOnly-plus-secure cookie with the refresh token.
 *           Set-Cookie (control_token):
 *             schema:
 *               type: string
 *               example: control_token=abcde1234; Max-Age=5184000; Path=/; Expires=Fri, 23 Aug 2024 19:32:08 GMT; Secure; SameSite=None
 *               description: A normal cookie with the control token.
 *       401:
 *         description: Password or phone incorrect.
 *       500:
 *         description: Error creating tokens.
 */
router.post('/login', validateInput(UserLoginValidationSchema), AuthController.login);

/**
 * * Logout
 * @openapi
 * /AS/auth/logout:
 *   post:
 *     tags: ['Authentication Service']
 *     summary: Logs out user. Returns empty cookies that expire after 1 second.
 *     responses:
 *       204:
 *         description: Logout ok.
 *         headers:
 *           Set-Cookie (access_token):
 *             schema:
 *               type: string
 *               example: access_token=; Max-Age=5184000; Path=/; Expires=Fri, 23 Aug 2024 19:32:08 GMT; HttpOnly; Secure; SameSite=None
 *               description: A HttpOnly-plus-secure cookie with the access token.
 *           Set-Cookie (refresh_token):
 *             schema:
 *               type: string
 *               example: refresh_token=; Max-Age=5184000; Path=/; Expires=Fri, 23 Aug 2024 19:32:08 GMT; HttpOnly; Secure; SameSite=None
 *               description: A HttpOnly-plus-secure cookie with the refresh token.
 *           Set-Cookie (control_token):
 *             schema:
 *               type: string
 *               example: control_token=; Path=/;
 *               description: A normal cookie with the control token.
 */
router.post('/logout', AuthController.logout);

/**
 * * Refresh tokens
 * @openapi
 * /AS/auth/refresh:
 *   post:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthRefresh: []
 *     summary: Generates new authentication and refresh tokens.
 *     responses:
 *       204:
 *         description: Refresh ok.
 *         headers:
 *           Set-Cookie (access_token):
 *             schema:
 *               type: string
 *               example: access_token=abcde12345; Max-Age=5184000; Path=/; Expires=Fri, 23 Aug 2024 19:32:08 GMT; HttpOnly; Secure; SameSite=None
 *               description: A HttpOnly-plus-secure cookie with the access token.
 *           Set-Cookie (refresh_token):
 *             schema:
 *               type: string
 *               example: refresh_token=abcde12345; Max-Age=5184000; Path=/; Expires=Fri, 23 Aug 2024 19:32:08 GMT; HttpOnly; Secure; SameSite=None
 *               description: A HttpOnly-plus-secure cookie with the refresh token.
 *           Set-Cookie (control_token):
 *             schema:
 *               type: string
 *               example: control_token=abcde1234; Max-Age=5184000; Path=/; Expires=Fri, 23 Aug 2024 19:32:08 GMT; Secure; SameSite=None
 *               description: A normal cookie with the control token.
 *       401:
 *         description: Refresh token incorrect.
 *       500:
 *         description: Error creating tokens.
 */
router.post('/refresh', AuthController.refresh);

/**
 * * Change password
 * @openapi
 * /AS/auth/change:
 *   post:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Changes user's password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 example: Abcd1234
 *                 type: string
 *                 description: User's current password.
 *               newPassword:
 *                 example: Abcd1234
 *                 type: string
 *                 description: User's new password.
 *             required:
 *               - oldPassword
 *               - newPassword
 *     responses:
 *       204:
 *         description: Password changed ok.
 *       400:
 *         description: Current password incorrect.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Error saving data.
 */
router.post('/change', [checkJwt, validateInput(AuthChangePasswordValidationSchema)], AuthController.changePassword);

/**
 * * Ask for changing user's phone number
 * @openapi
 * /AS/auth/askNewPhone:
 *   post:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Sends a phone verification token via WhatsApp which will be used to change user's phone in /AS/confirmNewPhone.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 example: 541144445555
 *                 type: string
 *                 description: User's new phone number.
 *             required:
 *               - phone
 *     responses:
 *       204:
 *         description: Verification token sent ok.
 *       400:
 *         description: Verification token sent error.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Error saving data.
 */
router.post('/askNewPhone', [checkJwt, validateInput(AuthValidatePhoneValidationSchema)], AuthController.askNewPhone);

/**
 * * Change user's phone number
 * @openapi
 * /AS/auth/confirmNewPhone:
 *   post:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Confirms new phone number for user and changes it.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 example: 541144445555
 *                 type: string
 *                 description: User's phone number.
 *               token:
 *                 example: 123456
 *                 type: string
 *                 description: Verification code sent to user's WhatsApp.
 *             required:
 *               - phone
 *               - token
 *
 *     responses:
 *       204:
 *         description: New phone set ok.
 *       404:
 *         description: User not found.
 *       409:
 *         description: Verification token invalid.
 *       500:
 *         description: Error saving data.
 */
router.post('/confirmNewPhone', [checkJwt, validateInput(AuthConfirmChangePhoneValidationSchema)], AuthController.confirmNewPhone);

/**
 * * Ask for password reset
 * @openapi
 * /AS/auth/reset:
 *   post:
 *     tags: ['Authentication Service']
 *     summary: Sends a phone verification token via WhatsApp which will be used to reset user's password in /AS/restore.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 example: 541144445555
 *                 type: string
 *                 description: User's phone number.
 *             required:
 *               - phone
 *     responses:
 *       204:
 *         description: Verification token sent ok.
 *       400:
 *         description: Verification token sent error.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Error saving data.
 */
router.post('/reset', [validateInput(AuthValidatePhoneValidationSchema)], AuthController.resetPassword);

/**
 * * * Reset password (create a new one)
 * @openapi
 * /AS/auth/restore:
 *   post:
 *     tags: ['Authentication Service']
 *     summary: Sets a new password for user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 example: 541144445555
 *                 type: string
 *                 description: User's phone number.
 *               token:
 *                 example: 123456
 *                 type: string
 *                 description: Verification code sent to user's WhatsApp.
 *               password:
 *                 example: Abcd1234
 *                 type: string
 *                 description: User's new password.
 *             required:
 *               - phone
 *               - token
 *               - password
 *
 *     responses:
 *       204:
 *         description: Password set ok.
 *       401:
 *         description: Verification token invalid.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Error saving data.
 */
router.post('/restore', [validateInput(AuthRestorePasswordValidationSchema)], AuthController.restorePassword);

/**
 * * Validate current authentication token
 * @openapi
 * /AS/auth/validate:
 *   get:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Validates current authentication token.
 *     responses:
 *       204:
 *         description: Access token ok.
 *       401:
 *         description: Access token incorrect.
 */
router.get('/validate', [checkJwt], AuthController.validate);

/**
 * * Get logged-in user data
 * @openapi
 * /AS/auth/user:
 *   get:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Returns logged-in user data without password from database.
 *     responses:
 *       200:
 *          content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get('/user', [checkJwt], AuthController.userData);

export default router;
