import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  statusCode?: number;
  errors?: any[];
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    data: null,
  });
};

export { errorHandler };
