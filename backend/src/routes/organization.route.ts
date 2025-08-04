import { Router } from "express";
import {
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  listOrganization,
  updateOrganization,
} from "../controller/organization.controller";

const organizationRouter = Router();

organizationRouter.route("/").get(listOrganization);
organizationRouter.route("/add").post(createOrganization);

organizationRouter.route("/:id").put(updateOrganization);
organizationRouter.route("/:id").get(getOrganizationById);
organizationRouter.route("/:id").delete(deleteOrganization);

export { organizationRouter };
