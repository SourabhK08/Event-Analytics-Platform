import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

const asyncHandler = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
) => {
  return (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;