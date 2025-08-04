import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { organizationRouter } from "./src/routes/organization.route";
import { projectRouter } from "./src/routes/project.route";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     credentials: true,
//   })
// );

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello we are connected");
});

app.get("/api/organization", organizationRouter);
app.get("/api/project", projectRouter);

export default app;
