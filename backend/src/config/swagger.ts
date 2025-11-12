import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'sid',
});

const AuthUser = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  activeCompanyId: z.string().uuid().nullable(),
});

const Company = z.object({
  id: z.string().uuid(),
  name: z.string(),
  logoUrl: z.string().nullable(),
});

const Membership = z.object({
  id: z.string().uuid(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
});

const Invite = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['MEMBER', 'ADMIN']),
  token: z.string(),
  expiresAt: z.string(),
});

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const AcceptInviteSchema = z.object({
  token: z.string().min(10),
  setActive: z.boolean().optional().default(true),
});

const CreateCompanySchema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().url().optional(),
  setActive: z.boolean().optional(),
});

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MEMBER', 'ADMIN']).optional(),
  expiresInHours: z.number().optional(),
});

const UpdateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().url().nullable().optional(),
});

const UpdateRoleSchema = z.object({
  role: z.enum(['MEMBER', 'ADMIN', 'OWNER']),
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/signup',
  tags: ['Auth'],
  description: 'Cria um novo usuário e define cookie de sessão.',
  request: { body: { content: { 'application/json': { schema: SignupSchema } } } },
  responses: { 201: { description: 'Usuário criado', content: { 'application/json': { schema: AuthUser } } } },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  description: 'Autentica o usuário e retorna cookie de sessão.',
  request: { body: { content: { 'application/json': { schema: LoginSchema } } } },
  responses: { 200: { description: 'Login bem-sucedido', content: { 'application/json': { schema: AuthUser } } } },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  description: 'Retorna o usuário autenticado.',
  security: [{ cookieAuth: [] }],
  responses: { 200: { description: 'Usuário autenticado', content: { 'application/json': { schema: AuthUser } } } },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  description: 'Finaliza a sessão atual limpando o cookie.',
  security: [{ cookieAuth: [] }],
  responses: { 204: { description: 'Logout realizado com sucesso' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/accept-invite',
  tags: ['Auth'],
  description: 'Aceita um convite de empresa e vincula o usuário autenticado.',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: AcceptInviteSchema } } } },
  responses: {
    200: {
      description: 'Convite aceito com sucesso',
      content: {
        'application/json': {
          schema: z.object({
            ok: z.boolean(),
            companyId: z.string().uuid(),
            activeCompanyId: z.string().uuid().nullable(),
          }),
        },
      },
    },
    400: { description: 'Convite inválido ou expirado' },
    403: { description: 'Usuário não autorizado para aceitar este convite' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/companies',
  tags: ['Companies'],
  description: 'Cria uma nova empresa e vincula o usuário autenticado como OWNER.',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CreateCompanySchema } } } },
  responses: {
    201: {
      description: 'Empresa criada',
      content: { 'application/json': { schema: Company.extend({ membership: Membership.partial() }) } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/companies',
  tags: ['Companies'],
  description: 'Lista empresas associadas ao usuário autenticado.',
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Lista de empresas',
      content: { 'application/json': { schema: z.array(Company) } },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/company/{id}',
  tags: ['Companies'],
  description: 'Atualiza dados da empresa ativa (somente ADMIN ou OWNER).',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateCompanySchema } } } },
  responses: { 200: { description: 'Empresa atualizada com sucesso', content: { 'application/json': { schema: Company } } } },
});

registry.registerPath({
  method: 'get',
  path: '/api/company/{id}/members',
  tags: ['Members'],
  description: 'Lista membros da empresa.',
  security: [{ cookieAuth: [] }],
  parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
  responses: {
    200: {
      description: 'Lista de membros',
      content: { 'application/json': { schema: z.array(Membership.extend({ user: AuthUser })) } },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/company/{id}/members/{memberId}',
  tags: ['Members'],
  description: 'Atualiza o papel de um membro (ADMIN/OWNER).',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateRoleSchema } } } },
  responses: { 200: { description: 'Membro atualizado', content: { 'application/json': { schema: Membership } } } },
});

registry.registerPath({
  method: 'post',
  path: '/api/company/{id}/invite',
  tags: ['Invite'],
  description: 'Cria e retorna um token de convite para a empresa.',
  security: [{ cookieAuth: [] }],
  request: { body: { content: { 'application/json': { schema: InviteSchema } } } },
  responses: {
    201: {
      description: 'Convite criado com sucesso',
      content: { 'application/json': { schema: Invite } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['System'],
  description: 'Verifica se a API está operacional.',
  responses: {
    200: {
      description: 'Servidor ativo',
      content: {
        'application/json': { schema: z.object({ status: z.string(), time: z.string() }) },
      },
    },
  },
});

const generator = new OpenApiGeneratorV31(registry.definitions);
const openApiDoc = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Alta API',
    version: '1.0.0',
    description: 'Documentação oficial da API Altaa (Desafio Técnico)',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Servidor Local' }],
  security: [{ cookieAuth: [] }],
});

export function setupSwagger(app: Express) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));
  console.log('📘 Swagger rodando em: http://localhost:4000/docs');
}
