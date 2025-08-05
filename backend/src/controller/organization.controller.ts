import { Organization } from "../models/organization.model";
import { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

interface createOrganizationBody {
  name: string;
  email: string;
  website?: string;
}

interface listOrganizationQuery {
  search?: string;
  page?: string | number;
  perPage?: string | number;
}

interface GetOrgParams {
  id: string;
}

const createOrganization = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, website } = req.body as createOrganizationBody;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }
    if (!name) {
      throw new ApiError(400, "Name is required");
    }

    const exsistingEmail = await Organization.findOne({
      email: email.toLowerCase(),
    });

    if (exsistingEmail) {
      throw new ApiError(400, "Email already exists");
    }

    const organization = await Organization.create({
      name,
      email: email.toLowerCase(),
      website,
    });

    const createdOrganization = await Organization.findById(
      organization._id
    ).select("-__v");

    if (!createdOrganization) {
      throw new ApiError(500, "Organization not created successfully");
    }

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          createdOrganization,
          "Organization created successfully"
        )
      );
  }
);

const listOrganization = asyncHandler(
  async (
    req: Request<{}, {}, {}, listOrganizationQuery>,
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
        { email: { $regex: search, $options: "i" } },
        { website: { $regex: search, $options: "i" } },
      ];
    }

    const count = await Organization.countDocuments(query);

    const organization = await Organization.find(query)
      .select("-__v")
      .skip(skip)
      .limit(limitNum);

    const message =
      count === 0
        ? search
          ? `No matching organization found for the keyword "${search}"`
          : "No organizations found"
        : "Organization list fetched successfully";

    res
      .status(200)
      .json(new ApiResponse(200, { count, organization }, message));
  }
);

const getOrganizationById = asyncHandler(
  async (req: Request<GetOrgParams>, res: Response): Promise<void> => {
    const { id } = req.params;

    const organization = await Organization.findById(id).select("-__v");

    if (!organization) {
      throw new ApiError(500, "Internal Server Error");
    }

    res
      .status(200)
      .json(new ApiResponse(200, organization, "Data fetched successfully"));
  }
);

const updateOrganization = asyncHandler(
  async (
    req: Request<GetOrgParams, {}, createOrganizationBody>,
    res: Response
  ): Promise<void> => {
    const { id } = req.params;
    const { name, email, website } = req.body;

    const organization = await Organization.findById(id);

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    const updatedOrganization = await Organization.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          website,
          email: email.toLowerCase(),
        },
      },
      {
        new: true,
      }
    ).select("-__v");

    if (!updatedOrganization) {
      throw new ApiError(404, "Organization not updated successfully");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedOrganization,
          "Organization updated successfully"
        )
      );
  }
);

const deleteOrganization = asyncHandler(
  async (req: Request<GetOrgParams, {}, {}>, res: Response): Promise<void> => {
    const { id } = req.params;

    const deletedOrganization = await Organization.findByIdAndDelete(id).select(
      "-__v"
    );

    if (!deletedOrganization) {
      throw new ApiError(404, "Organization not deleted");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedOrganization,
          "Organization deleted successfully"
        )
      );
  }
);

export {
  createOrganization,
  listOrganization,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
};
