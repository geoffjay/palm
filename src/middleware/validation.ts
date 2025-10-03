/**
 * Validation middleware for request body and query parameter validation
 */

import { z } from "zod";

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    public errors: z.ZodIssue[],
    message = "Validation failed",
  ) {
    super(message);
    this.name = "ValidationError";
  }

  /**
   * Format validation errors into user-friendly messages
   */
  toJSON() {
    return {
      error: "Validation failed",
      issues: this.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    };
  }
}

/**
 * Validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request): Promise<z.infer<T>> => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request): z.infer<T> => {
    try {
      const url = new URL(req.url);
      const params = Object.fromEntries(url.searchParams.entries());
      return schema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  };
}

/**
 * Validate URL parameters against a Zod schema
 * @param schema - Zod schema to validate against
 * @param params - URL parameters object
 * @returns Validated and typed data
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T, params: Record<string, string>) {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
}

/**
 * Handle validation errors and return appropriate HTTP response
 */
export function handleValidationError(error: unknown): Response {
  if (error instanceof ValidationError) {
    return new Response(JSON.stringify(error.toJSON()), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Generic error handling
  console.error("Unexpected error during validation:", error);
  return new Response(
    JSON.stringify({
      error: "Invalid request data",
      message: error instanceof Error ? error.message : "Unknown error",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    },
  );
}
