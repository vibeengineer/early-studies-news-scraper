import { publicationCategories } from '@early-studies/db/schema';
import { type ZodTypeAny, z } from 'zod';

// --- Base Schemas ---
const PublicationUrlsSchema = z
  .array(z.string().url({ message: 'Each publication URL must be a valid URL.' }))
  .min(1, { message: 'At least one publication URL is required.' })
  .default([
    'https://bbc.co.uk',
    'https://theguardian.com',
    'https://telegraph.co.uk',
    'https://thetimes.co.uk',
    'https://ft.com',
    'https://economist.com',
    'https://independent.co.uk',
    'https://thesun.co.uk',
    'https://dailymail.co.uk',
    'https://mirror.co.uk',
    'https://express.co.uk',
    'https://standard.co.uk',
    'https://spectator.co.uk',
    'https://newstatesman.com',
  ]);

// --- Serper API Schemas ---
const SerperNewsItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
  date: z.string(),
  source: z.string(),
  imageUrl: z.string().optional(),
  position: z.number().optional(),
});

// Schema for transformed news items
const TransformedNewsItemSchema = z.object({
  headline: z.string(),
  publicationUrl: z.string(),
  url: z.string(),
  snippet: z.string().nullable(),
  source: z.string(),
  rawDate: z.string().nullable(),
  normalizedDate: z.string().optional(),
});

const SerperSearchParametersSchema = z.object({
  q: z.string(),
  gl: z.string().optional(),
  location: z.string().optional(),
  type: z.string(),
  engine: z.string(),
  page: z.number().optional(),
  num: z.number().optional(),
  tbs: z.string().optional(),
});

const SerperNewsResultSchema = z.object({
  searchParameters: SerperSearchParametersSchema,
  news: z.array(SerperNewsItemSchema),
  credits: z.number(),
});

// --- API Response Schemas ---
const BaseResponseSchema = z.object({
  url: z.string(),
  queriesMade: z.number(),
  creditsConsumed: z.number(),
  results: z.array(TransformedNewsItemSchema),
});

const FetchSuccessSchema = BaseResponseSchema.extend({
  status: z.literal('fulfilled'),
});

const FetchFailureSchema = BaseResponseSchema.extend({
  status: z.literal('rejected'),
  reason: z.string(),
});

const FetchResultSchema = z.discriminatedUnion('status', [FetchSuccessSchema, FetchFailureSchema]);

// --- Request Schemas ---
const HeadlinesFetchRequestBaseSchema = z.object({
  publicationUrls: PublicationUrlsSchema,
  region: z.enum(['US', 'UK']),
  startDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'Start date must be in DD/MM/YYYY format' })
    .describe('Start date in DD/MM/YYYY format'),
  endDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: 'End date must be in DD/MM/YYYY format' })
    .describe('End date in DD/MM/YYYY format'),
  maxQueriesPerPublication: z
    .number()
    .int()
    .positive('Max queries per publication must be a positive integer.')
    .optional()
    .default(5),
  flattenResults: z
    .boolean()
    .optional()
    .default(true)
    .describe('If true, returns a flat array of headlines. If false, groups by publication URL.'),
});

// --- Hono Request Input Schema ---
export const HeadlinesFetchRequestSchema = HeadlinesFetchRequestBaseSchema.refine(
  (data) => {
    const startParts = data.startDate.split('/').map(Number);
    const endParts = data.endDate.split('/').map(Number);
    const startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
    const endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);
    return startDate <= endDate;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
);

// --- Response Schemas ---
const HeadlinesFetchSummarySchema = z.object({
  totalResults: z.number(),
  totalCreditsConsumed: z.number(),
  totalQueriesMade: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
});

export type HeadlinesFetchSummary = z.infer<typeof HeadlinesFetchSummarySchema>;

export const HeadlinesFetchResponseSchema = z.object({
  summary: HeadlinesFetchSummarySchema,
});

// --- Error Schema ---
const ErrorDetailSchema = z.union([z.string(), z.record(z.unknown())]);

export const StandardErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: ErrorDetailSchema.optional(),
});

// Generic function to create the standard response schema
export function createStandardResponseSchema<T extends ZodTypeAny>(
  dataSchema: T,
  refName?: string
) {
  const schema = z.object({
    data: dataSchema.nullable(),
    success: z.boolean(),
    error: StandardErrorSchema.nullable(),
  });
  return schema;
}

// --- Publications Schemas ---
export const PublicationBaseSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    ,
  category: z
    .enum(publicationCategories)
    .optional()
    .nullable()
    ,
  region: z
    .string()
    .optional()
    .nullable()
    ,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const PublicationSchema = PublicationBaseSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const InsertPublicationSchema = PublicationBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Body for POST /publications/query
export const PublicationsQueryBodySchema = z.object({
  category: z.enum(publicationCategories).optional(),
  region: z.string().optional(),
});

// Body for DELETE /publications
export const DeletePublicationBodySchema = z.object({
  id: z.string(),
});

// --- Response Schemas ---
export const PublicationsListResponseSchema = createStandardResponseSchema(
  z.array(PublicationSchema),
  'PublicationsListResponse'
);

export const SinglePublicationResponseSchema = createStandardResponseSchema(
  PublicationSchema,
  'SinglePublicationResponse'
);

export const HeadlinesFetchStdResponseSchema = createStandardResponseSchema(
  HeadlinesFetchResponseSchema,
  'HeadlinesFetchResponse'
);

// --- Derived Types ---
export type HeadlinesFetchRequestInput = z.input<typeof HeadlinesFetchRequestSchema>;
export type ValidatedHeadlinesFetchData = z.output<typeof HeadlinesFetchRequestSchema>;
export type SerperNewsItem = z.infer<typeof SerperNewsItemSchema>;
export type SerperNewsResult = z.infer<typeof SerperNewsResultSchema>;
export type FetchResult = z.infer<typeof FetchResultSchema>;
export type FetchSuccess = z.infer<typeof FetchSuccessSchema>;
export type FetchFailure = z.infer<typeof FetchFailureSchema>;
export type TransformedNewsItem = z.infer<typeof TransformedNewsItemSchema>;

// --- Internal Fetcher Helper Types ---
export type FetchAllPagesResult = {
  url: string;
  queriesMade: number;
  credits: number;
  results: SerperNewsItem[];
  error?: Error;
  tbsParams?: string;
};

export type SerperAccountDetails = {
  balance: number;
  rateLimit: number;
  apiKey?: string;
};

export type GeoParams = {
  gl: string;
  location: string;
};
