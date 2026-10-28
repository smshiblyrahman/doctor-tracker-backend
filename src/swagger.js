const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Doctor Tracker API',
    version: '1.0.0',
    description: 'REST API documentation for Doctor Tracker administrative web application.',
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT token stored in HTTP-only cookie',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Optional Authorization: Bearer <token>',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string' },
          issues: { type: 'array', items: { type: 'object' } },
        },
      },
      Doctor: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Dr. John Doe' },
          specialization: { type: 'string', example: 'Cardiology' },
          hospital: { type: 'string', example: 'Metro General Hospital' },
          phone: { type: 'string', example: '+1-555-0101' },
          email: { type: 'string', example: 'john.doe@example.com' },
          patientCount: { type: 'integer', example: 12 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DoctorInput: {
        type: 'object',
        required: ['name', 'specialization', 'hospital', 'phone', 'email'],
        properties: {
          name: { type: 'string', example: 'Dr. Jane Smith' },
          specialization: { type: 'string', example: 'Neurology' },
          hospital: { type: 'string', example: 'City Care Hospital' },
          phone: { type: 'string', example: '+1-555-0199' },
          email: { type: 'string', example: 'jane.smith@example.com' },
        },
      },
      Patient: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Alice Brown' },
          age: { type: 'integer', example: 34 },
          gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'female' },
          condition: { type: 'string', example: 'Hypertension' },
          doctorId: { type: 'string' },
          doctor: { $ref: '#/components/schemas/Doctor' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PatientInput: {
        type: 'object',
        required: ['name', 'age', 'gender', 'condition'],
        properties: {
          name: { type: 'string', example: 'Bob Green' },
          age: { type: 'integer', minimum: 0, maximum: 150, example: 45 },
          gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
          condition: { type: 'string', example: 'Type 2 Diabetes' },
        },
      },
      PatientUpdateInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          condition: { type: 'string' },
          doctorId: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'API health check',
        responses: {
          200: {
            description: 'API is running',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'doctor-tracker-api' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Administrator sign in',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@example.com' },
                  password: { type: 'string', example: 'AdminPassword123!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful. Sets HTTP-only auth cookie.',
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current administrator session',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Authenticated admin profile' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Sign out and clear session cookie',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Logout successful' },
        },
      },
    },
    '/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'List doctors with search, filters, and pagination',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search name, specialization, hospital, or email' },
          { name: 'specialization', in: 'query', schema: { type: 'string' } },
          { name: 'hospital', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Paginated doctor list' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Doctors'],
        summary: 'Create a new doctor',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DoctorInput' },
            },
          },
        },
        responses: {
          201: { description: 'Doctor created' },
          400: { description: 'Validation error' },
          409: { description: 'Doctor with email already exists' },
        },
      },
    },
    '/doctors/{id}': {
      get: {
        tags: ['Doctors'],
        summary: 'Get doctor by ID',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Doctor details' },
          404: { description: 'Doctor not found' },
        },
      },
    },
    '/doctors/{id}/patients': {
      get: {
        tags: ['Doctors'],
        summary: 'List patients under a doctor',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Paginated patients list for doctor' },
        },
      },
      post: {
        tags: ['Doctors'],
        summary: 'Add patient to a doctor',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatientInput' },
            },
          },
        },
        responses: {
          201: { description: 'Patient registered under doctor' },
        },
      },
    },
    '/patients': {
      get: {
        tags: ['Patients'],
        summary: 'List all patients across doctors',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'condition', in: 'query', schema: { type: 'string' } },
          { name: 'doctorId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Paginated global patients list' },
        },
      },
    },
    '/patients/{id}': {
      patch: {
        tags: ['Patients'],
        summary: 'Update patient information',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatientUpdateInput' },
            },
          },
        },
        responses: {
          200: { description: 'Patient updated' },
          404: { description: 'Patient not found' },
        },
      },
      delete: {
        tags: ['Patients'],
        summary: 'Delete patient record',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Patient deleted' },
          404: { description: 'Patient not found' },
        },
      },
    },
    '/analytics/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Dashboard metrics, trends, and charts',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Analytics aggregation data' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
