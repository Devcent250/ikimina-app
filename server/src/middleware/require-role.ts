import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/http.errors";

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError("Authentication required"));
    }

    if (req.user.role?.name !== role && !req.user.isAdmin) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
}; 