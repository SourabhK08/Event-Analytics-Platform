import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  listProject,
  regenerateApiKey,
  updateProject,
} from "../controller/project.controller";

const projectRouter = Router();

projectRouter.route("/").get(listProject);
projectRouter.route("/add").post(createProject);

projectRouter.route("/:id/regenrate").post(regenerateApiKey);
projectRouter.route("/:id").get(getProjectById);
projectRouter.route("/:id").put(updateProject);
projectRouter.route("/:id").delete(deleteProject);


export { projectRouter };
