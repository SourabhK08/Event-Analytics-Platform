import { Router } from "express";
import { authenticateApiKey } from "../middleware/apiKeyAuth";
import {
  deleteEvent,
  getEventById,
  getEventStats,
  ingestEvents,
  listEvents,
} from "../controller/event.controller";

const eventRouter = Router();

eventRouter.use(authenticateApiKey);

eventRouter.post("/", ingestEvents);
eventRouter.get("/", listEvents);
eventRouter.get("/stats", getEventStats);
eventRouter.get("/:id", getEventById);
eventRouter.delete("/:id", deleteEvent);

export default eventRouter;
