import { Router } from 'express';
import auth from './AS/auth';
import user from './AS/user';

const routes = Router();

/** Authentication service */
routes.use('/AS/auth', auth);
routes.use('/AS/user', user);

export default routes;
