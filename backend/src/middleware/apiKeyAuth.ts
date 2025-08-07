import { Request, Response, NextFunction } from "express";
import { Project } from "../models/project.model";
import { ApiError } from "../utils/ApiError";

declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      projectId?: string;
      project?: any;
    }
  }
}

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey =
      (req.headers["x-api-key"] as string) ||
      (req.headers["authorization"]?.replace("Bearer ", "") as string);

    if (!apiKey) {
      throw new ApiError(401, "API key is required in headers (X-API-Key)");
    }

    if (!apiKey.startsWith("sk_")) {
      throw new ApiError(401, "Invalid API key format");
    }

    const project = await Project.findOne({
      apiKey,
    }).populate("organizationId", "name email website");

    if (!project) {
      throw new ApiError(401, "Invalid or inactive API key");
    }

    req.organizationId = project.organizationId._id.toString();
    req.projectId = project._id.toString();
    req.project = project;

    next();
  } catch (error) {
    next(error);
  }
};
