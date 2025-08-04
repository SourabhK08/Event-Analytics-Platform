import { Project } from "../models/project.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/AsyncHandler";
import { Request, Response } from "express";

interface createProjectBody {
  name: string;
  description?: string;
  organizationId: string;
  apiKey: string;
}

interface listProjectQuery {
  search?: string;
  page?: string | number;
  perPage?: string | number;
}

interface GetProjectParams {
  id: string;
}

const createProject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, description, organizationId, apiKey } =
      req.body as createProjectBody;

    if (!organizationId) {
      throw new ApiError(400, "Organization is required");
    }
    if (!name) {
      throw new ApiError(400, "Name is required");
    }

    const project = await Project.create({
      name,
      description,
      organizationId,
    });

    const createdProject = await Project.findById(project._id)
      .select("-__v")
      .populate({ path: "organizationId", select: "name email website" });

    if (!createdProject) {
      throw new ApiError(500, "Project not created successfully");
    }

    res
      .status(201)
      .json(
        new ApiResponse(201, createdProject, "Project created successfully")
      );
  }
);

const listProject = asyncHandler(
  async (
    req: Request<{}, {}, {}, listProjectQuery>,
    res: Response
  ): Promise<void> => {
    const { search, page = 1, perPage = 10 } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(perPage as string, 10);

    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const count = await Project.countDocuments(query);

    const project = await Project.find(query)
      .select("-__v")
      .populate({ path: "organizationId", select: "name email website" })
      .skip(skip)
      .limit(limitNum);

    const message =
      count === 0
        ? search
          ? `No matching project found for the keyword "${search}"`
          : "No projects found"
        : "Project list fetched successfully";

    res.status(200).json(new ApiResponse(200, { count, project }, message));
  }
);

const getProjectById = asyncHandler(
  async (req: Request<GetProjectParams>, res: Response): Promise<void> => {
    const { id } = req.params;

    const project = await Project.findById(id)
      .select("-__v")
      .populate({ path: "organizationId", select: "name email website" });

    if (!project) {
      throw new ApiError(500, "Internal Server Error");
    }

    res
      .status(200)
      .json(new ApiResponse(200, project, "Data fetched successfully"));
  }
);

const updateProject = asyncHandler(
  async (
    req: Request<GetProjectParams, {}, createProjectBody>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const { name, description, organizationId } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          description,
          organizationId,
        },
      },
      {
        new: true,
      }
    )
      .select("-__v")
      .populate({ path: "organizationId", select: "name email website" });

    if (!updateProject) {
      throw new ApiError(404, "Project not updated successfully");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, updatedProject, "Project updated successfully")
      );
  }
);

const deleteProject = asyncHandler(
  async (
    req: Request<GetProjectParams, {}, {}>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;

    const deletedProject = await Project.findByIdAndDelete(id)
      .select("-__v")
      .populate({ path: "organizationId", select: "name email website" });

    if (!deletedProject) {
      throw new ApiError(404, "Project not deleted");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, deletedProject, "Project deleted successfully")
      );
  }
);

export {
  listProject,
  getProjectById,
  createProject,
  deleteProject,
  updateProject,
};
