import Router from 'express';
const mainRouter = Router();
import authRouter from './authRoutes';
import newsletterRouter from './newsletterRoutes';
import contactRouter from './contactRoutes';
import testimonialRouter from './testimonialRoutes';
import { adminRouter as adminCareersRouter, publicRouter as careersRouter } from '../careers/careers.routes';

mainRouter.use('/auth', authRouter);
mainRouter.use('/contacts', contactRouter);
mainRouter.use('/newsletter', newsletterRouter);
mainRouter.use('/testimonials', testimonialRouter);
mainRouter.use('/careers', careersRouter);
mainRouter.use('/admin/careers', adminCareersRouter);

export default mainRouter;