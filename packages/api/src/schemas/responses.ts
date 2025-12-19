import { z } from "zod";

// Success response schema - always includes all three keys
export function createSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    error: z.null(),
  });
}

// Error response schema - always includes all three keys
export function createErrorSchema() {
  return z.object({
    success: z.literal(false),
    data: z.null(),
    error: z.string(),
  });
}

// Standard error response (data is null)
export const errorResponseSchema = z.object({
  success: z.literal(false),
  data: z.null(),
  error: z.string(),
});

// Combined response type
export function createResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.union([createSuccessSchema(dataSchema), createErrorSchema()]);
}
