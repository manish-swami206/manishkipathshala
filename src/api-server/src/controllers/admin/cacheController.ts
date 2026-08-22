/**
 * Admin Cache Invalidation Controller
 *
 * Provides an API endpoint for the frontend to trigger cache invalidation
 * after mutations. This ensures both the backend node-cache and Upstash Redis
 * are cleared when admin makes changes.
 */

import type { Request, Response, NextFunction } from "express";
import {
  invalidateEntity,
  invalidateEntities,
  getAllCachePatterns,
  type EntityType,
} from "../../services/cacheInvalidation";
import { AppError } from "../../middleware/errorHandler";
import { redis } from "../../lib/cache";

const VALID_ENTITY_TYPES: EntityType[] = [
  "questions",
  "subjects",
  "announcements",
  "mock-tests",
  "current-affairs",
  "study-notes",
  "syllabus",
  "ncert-books",
  "ncert-mcq",
  "daily-quizzes",
  "exam-sets",
  "pyp",
  "dashboard",
  "all",
];

/**
 * POST /admin/cache/invalidate
 *
 * Body:
 *   { entity: EntityType }           — invalidate a single entity type
 *   { entities: EntityType[] }       — invalidate multiple entity types
 *   { action: "flush-all" }          — nuclear: flush all caches
 *
 * This endpoint is called by the frontend after successful mutations
 * to ensure cache consistency across all replicas.
 */
export async function invalidateCache(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { entity, entities, action } = req.body as {
      entity?: EntityType;
      entities?: EntityType[];
      action?: string;
    };

    // Handle flush-all action
    if (action === "flush-all") {
      invalidateEntity("all");
      return res.json({
        success: true,
        message: "All caches invalidated",
        timestamp: new Date().toISOString(),
      });
    }

    // Handle single entity invalidation
    if (entity) {
      if (!VALID_ENTITY_TYPES.includes(entity)) {
        return next(
          new AppError(
            400,
            `Invalid entity type: ${entity}. Valid types: ${VALID_ENTITY_TYPES.join(", ")}`,
          ),
        );
      }
      invalidateEntity(entity);
      return res.json({
        success: true,
        message: `Cache invalidated for ${entity}`,
        entity,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle multiple entity invalidation
    if (entities && Array.isArray(entities)) {
      const invalid = entities.filter(
        (e) => !VALID_ENTITY_TYPES.includes(e),
      );
      if (invalid.length > 0) {
        return next(
          new AppError(
            400,
            `Invalid entity types: ${invalid.join(", ")}. Valid types: ${VALID_ENTITY_TYPES.join(", ")}`,
          ),
        );
      }
      invalidateEntities(entities);
      return res.json({
        success: true,
        message: `Cache invalidated for ${entities.length} entities`,
        entities,
        timestamp: new Date().toISOString(),
      });
    }

    return next(
      new AppError(
        400,
        "Provide either `entity`, `entities`, or `action: 'flush-all'` in request body",
      ),
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /admin/cache/status
 *
 * Returns cache status information for debugging.
 */
export async function getCacheStatus(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const patterns = getAllCachePatterns();
    let redisConnected = false;

    if (redis) {
      try {
        await redis.ping();
        redisConnected = true;
      } catch {
        redisConnected = false;
      }
    }

    return res.json({
      redis: {
        connected: redisConnected,
        configured: !!redis,
      },
      patterns,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return next(err);
  }
}
