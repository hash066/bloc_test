export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Bloc CRM API Documentation',
    version: '1.0.0',
    description: 'API endpoints for the Bloc CRM system, including lead ingestion and agent management.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      WebhookAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-hook-key',
        description: 'Secret key for webhook authentication',
      },
    },
  },
  paths: {
    '/api/leads/webhook': {
      post: {
        summary: 'Ingest a new lead from an automation tool',
        tags: ['Leads'],
        security: [{ WebhookAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  phone: { type: 'string', example: '9988776655' },
                  city: { type: 'string', example: 'Mumbai' },
                  state: { type: 'string', example: 'Maharashtra' },
                  source: { type: 'string', example: 'Google Sheets' },
                  raw: { type: 'object', description: 'Raw row data from sheet' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Lead processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    leadId: { type: 'string' },
                    assigned: { type: 'boolean' },
                    callerId: { type: 'string' },
                  },
                },
               },
            },
          },
          401: { description: 'Unauthorized - Invalid x-hook-key' },
          400: { description: 'Bad Request - Missing or invalid fields' },
        },
      },
    },
    '/api/leads': {
      get: {
        summary: 'Get all leads',
        tags: ['Leads'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'assigned', 'unassigned'] } },
          { name: 'state', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: {
            description: 'List of leads',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } },
          },
        },
      },
    },
    '/api/callers': {
      get: {
        summary: 'Get all agents/callers',
        tags: ['Agents'],
        responses: {
          200: {
            description: 'List of callers with their current daily counts',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } },
          },
        },
      },
      post: {
        summary: 'Add a new agent/caller',
        tags: ['Agents'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone'],
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  role: { type: 'string', default: 'Sales Caller' },
                  daily_limit: { type: 'integer', default: 60 },
                  assigned_states: { type: 'array', items: { type: 'string' } },
                  languages: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Agent created' },
        },
      },
    },
    '/api/assignments/logs': {
      get: {
        summary: 'Get assignment audit logs',
        tags: ['System'],
        responses: {
          200: {
            description: 'Recent assignment activities',
            content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } },
          },
        },
      },
    },
  },
};
