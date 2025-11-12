import express from 'express';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './config/swagger';

import authRoutes from './routes/auth';
import companiesRoutes from './routes/companies';
import companyRoutes from './routes/company';
import membersRoutes from './routes/members';
import companySelectRoutes from './routes/companySelect';

const app = express();
app.use(express.json());
app.use(cookieParser());

setupSwagger(app);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok back bombando', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/company', membersRoutes);
app.use('/api/company', companySelectRoutes);

app.use((_req, res) => res.status(404).json({ error: 'not found' }));

export default app;
