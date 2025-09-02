import { Express } from "express";

declare global {
    namespace Express {
        export interface Request {
            file?: Express.Multer.File;
            files?: Express.Multer.File[];
        }
    }
}
