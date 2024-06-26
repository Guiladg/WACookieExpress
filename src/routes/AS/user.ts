import { Router } from 'express';
import UserController from '../../controllers/user';
import { checkJwt } from '../../middlewares/checkJwt';
import { checkRole } from '../../middlewares/checkRole';
import { validateInput } from '../../middlewares/validateInput';
import { UserCreateValidationSchema, UserUpdateValidationSchema } from '../../validators/user';
import { decodeIds } from '../../middlewares/hashedIds';

const router = Router();

/**
 * * Get all users
 * @openapi
 * /AS/user:
 *   get:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Lists all users with their data except passwords.
 *     parameters:
 *       - $ref: '#/components/parameters/QueryListPage'
 *       - $ref: '#/components/parameters/QueryListPageSize'
 *       - $ref: '#/components/parameters/QueryListSort'
 *       - $ref: '#/components/parameters/QueryListOrder'
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseListUser'
 *
 */
router.get('/', [checkJwt, checkRole('admin')], UserController.list);

/**
 * * Get one user
 * @openapi
 * /AS/user/{id}:
 *   get:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Retrieves user data without passwords.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           minimum: AbCdEf
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found.
 *
 */
router.get('/:id([a-z]+)', [checkJwt, checkRole('admin'), decodeIds], UserController.get);

/**
 * * New user
 * @openapi
 * /AS/user:
 *   post:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Creates a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserNoId'
 *             required:
 *               - phone
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseRecordUser'
 *
 */
router.post('/', [checkJwt, checkRole('admin'), validateInput(UserCreateValidationSchema)], UserController.add);

/**
 * * Modify user
 * @openapi
 * /AS/user/{id}:
 *   patch:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Modifies data from user.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           example: ABCDEFGHIJ
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserNoId'
 *             required:
 *               - phone
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseRecordUser'
 *       404:
 *         description: User not found.
 *
 */
router.patch('/:id([a-z]+)', [checkJwt, checkRole('admin'), validateInput(UserUpdateValidationSchema), decodeIds], UserController.edit);

/**
 * * Delete user
 * @openapi
 * /AS/user/{id}:
 *   delete:
 *     tags: ['Authentication Service']
 *     security:
 *       - cookieAuthControl: []
 *       - cookieAuthAccess: []
 *     summary: Deletes user form database.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           example: ABCDEFGHIJ
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseRecordUser'
 *       404:
 *         description: User not found.
 *       409:
 *         description: Logged-in user cannot be deleted.
 *
 */
router.delete('/:id([a-z]+)', [checkJwt, checkRole('admin'), decodeIds], UserController.delete);

export default router;
