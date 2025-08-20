import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      query?: any;
    }
  }
}
