// controllers/eventController.ts

import { Request, Response } from "express";
import { Event as EventModel } from "../models/event.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/AsyncHandler";
import crypto from "crypto";

interface CreateEventBody {
  events: Array<{
    eventId?: string;
    userId: string;
    eventName: string;
    properties?: Record<string, any>;
    timestamp?: string | Date;
    sessionId?: string;
  }>;
}

interface ListEventQuery {
  userId?: string;
  eventName?: string;
  startDate?: string;
  endDate?: string;
  page?: string | number;
  limit?: string | number;
  sessionId?: string;
}

interface GetEventParams {
  id: string;
}

const generateEventId = (): string => {
  return "evt_" + crypto.randomBytes(16).toString("hex");
};

const ingestEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { events } = req.body as CreateEventBody;

    if (!events || !Array.isArray(events) || events.length === 0) {
      throw new ApiError(400, "Events array is required and cannot be empty");
    }

    if (events.length > 1000) {
      throw new ApiError(400, "Maximum 1000 events allowed per request");
    }

    const organizationId = req.organizationId;
    const projectId = req.projectId;

    if (!organizationId || !projectId) {
      throw new ApiError(
        401,
        "Authentication required - organizationId/projectId missing"
      );
    }

    const processedEvents = events.map((event) => {
      if (!event.userId) {
        throw new ApiError(400, "userId is required for each event");
      }
      if (!event.eventName) {
        throw new ApiError(400, "eventName is required for each event");
      }

      return {
        eventId: event.eventId || generateEventId(),
        userId: event.userId.trim(),
        eventName: event.eventName.trim(),
        properties: event.properties || {},
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        organizationId,
        projectId,
        sessionId: event.sessionId?.trim() || undefined,
        userAgent: req.headers["user-agent"] || undefined,
        ipAddress: req.ip || req.socket.remoteAddress || undefined,
      };
    });

    try {
      const results = await EventModel.insertMany(processedEvents, {
        ordered: false,
      });

      res.status(201).json(
        new ApiResponse(
          201,
          {
            ingested: results.length,
            total: events.length,
            events: results,
          },
          `${results.length} events ingested successfully`
        )
      );
    } catch (error: any) {
      if (error.code === 11000) {
        const duplicates = error.writeErrors?.length || 0;
        const success = events.length - duplicates;

        res.status(207).json(
          new ApiResponse(
            207,
            {
              ingested: success,
              total: events.length,
              duplicates: duplicates,
            },
            `${success} events ingested, ${duplicates} duplicates ignored`
          )
        );
      } else {
        throw error;
      }
    }
  }
);

const listEvents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      userId,
      eventName,
      startDate,
      endDate,
      sessionId,
      page = 1,
      limit = 50,
    } = req.query as ListEventQuery;

    const organizationId = req.organizationId;
    const projectId = req.projectId;

    if (!organizationId || !projectId) {
      throw new ApiError(401, "Authentication required");
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 1000);
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {
      organizationId,
      projectId,
    };

    if (userId) {
      query.userId = userId;
    }

    if (eventName) {
      query.eventName = eventName;
    }

    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    try {
      const totalCount = await EventModel.countDocuments(query);

      const events = await EventModel.find(query)
        .select("-__v")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum);

      const message =
        totalCount === 0 ? "No events found" : "Events fetched successfully";

      res.status(200).json(
        new ApiResponse(
          200,
          {
            totalCount,
            events,
            pagination: {
              currentPage: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(totalCount / limitNum),
              hasNext: pageNum < Math.ceil(totalCount / limitNum),
              hasPrev: pageNum > 1,
            },
          },
          message
        )
      );
    } catch (error) {
      throw new ApiError(500, "Error fetching events");
    }
  }
);

const getEventById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as GetEventParams;
    const organizationId = req.organizationId;
    const projectId = req.projectId;

    if (!organizationId || !projectId) {
      throw new ApiError(401, "Authentication required");
    }

    const event = await EventModel.findOne({
      _id: id,
      organizationId,
      projectId,
    }).select("-__v");

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, event, "Event fetched successfully"));
  }
);

const deleteEvent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as GetEventParams;
    const organizationId = req.organizationId;
    const projectId = req.projectId;

    if (!organizationId || !projectId) {
      throw new ApiError(401, "Authentication required");
    }

    const deletedEvent = await EventModel.findOneAndDelete({
      _id: id,
      organizationId,
      projectId,
    }).select("-__v");

    if (!deletedEvent) {
      throw new ApiError(404, "Event not found or already deleted");
    }

    res
      .status(200)
      .json(new ApiResponse(200, deletedEvent, "Event deleted successfully"));
  }
);

const getEventStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;
    const projectId = req.projectId;

    if (!organizationId || !projectId) {
      throw new ApiError(401, "Authentication required");
    }

    try {
      const stats = await EventModel.aggregate([
        {
          $match: {
            organizationId,
            projectId,
          },
        },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            uniqueUsers: { $addToSet: "$userId" },
            uniqueEvents: { $addToSet: "$eventName" },
            latestEvent: { $max: "$timestamp" },
            oldestEvent: { $min: "$timestamp" },
          },
        },
        {
          $project: {
            _id: 0,
            totalEvents: 1,
            uniqueUserCount: { $size: "$uniqueUsers" },
            uniqueEventCount: { $size: "$uniqueEvents" },
            latestEvent: 1,
            oldestEvent: 1,
          },
        },
      ]);

      const result = stats[0] || {
        totalEvents: 0,
        uniqueUserCount: 0,
        uniqueEventCount: 0,
        latestEvent: null,
        oldestEvent: null,
      };

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Event statistics fetched successfully")
        );
    } catch (error) {
      throw new ApiError(500, "Error fetching event statistics");
    }
  }
);

export { ingestEvents, listEvents, getEventById, deleteEvent, getEventStats };
