
import { z } from 'zod';
import { locations, pins, locationFormSchema, updateLocationSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  locations: {
    list: {
      method: 'GET' as const,
      path: '/api/locations',
      responses: {
        200: z.array(z.custom<typeof locations.$inferSelect & { pins: typeof pins.$inferSelect[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/locations/:id',
      responses: {
        200: z.custom<typeof locations.$inferSelect & { pins: typeof pins.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/locations',
      input: locationFormSchema,
      responses: {
        201: z.custom<typeof locations.$inferSelect & { pins: typeof pins.$inferSelect[] }>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/locations/:id',
      input: updateLocationSchema,
      responses: {
        200: z.custom<typeof locations.$inferSelect & { pins: typeof pins.$inferSelect[] }>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/locations/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
