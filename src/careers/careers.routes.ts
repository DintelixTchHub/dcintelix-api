import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { paymentProofUpload } from '../middleware/paymentProofUpload';
import {
  createAdminJob, deleteAdminApplication, deleteAdminJob, getAdminApplication, getAdminApplications, getAdminJob,
  getAdminJobs, getJobBySlug, getJobs, submitGeneralApplication, submitJobApplication, updateAdminApplication, updateAdminJob,
} from './careers.controller';

const publicRouter = Router();
publicRouter.get('/jobs', getJobs);
publicRouter.get('/jobs/:slug', getJobBySlug);
publicRouter.post('/jobs/:jobId/applications', paymentProofUpload.single('paymentProof'), submitJobApplication);
publicRouter.post('/general-applications', paymentProofUpload.single('paymentProof'), submitGeneralApplication);

const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.post('/jobs', createAdminJob);
adminRouter.get('/jobs', getAdminJobs);
adminRouter.get('/jobs/:id', getAdminJob);
adminRouter.patch('/jobs/:id', updateAdminJob);
adminRouter.delete('/jobs/:id', deleteAdminJob);
adminRouter.get('/applications', getAdminApplications);
adminRouter.get('/applications/:id', getAdminApplication);
adminRouter.patch('/applications/:id', updateAdminApplication);
adminRouter.delete('/applications/:id', deleteAdminApplication);

export { publicRouter, adminRouter };