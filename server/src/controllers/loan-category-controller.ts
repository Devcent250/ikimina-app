import { Request, Response, NextFunction } from "express";
import { Repository } from "typeorm";
import { LoanCategory } from "../entities/LoanCategory";
import { User } from "../entities/User";
import { Branch } from "../entities/Branch";
import { asyncHandler } from "../utils/async-handler";
import { BadRequestError, NotFoundError } from "../errors/http.errors";
import { QueryBuilder } from "../utils/QueryBuilder";
import { QueryParams } from "../types/QueryParams";
import { AppDataSource } from "../data-source";

export class LoanCategoryController {
    private loanCategoryRepository: Repository<LoanCategory> = AppDataSource.getRepository(LoanCategory);
    private queryBuilder: QueryBuilder<LoanCategory>;

    constructor() {
        this.queryBuilder = new QueryBuilder(this.loanCategoryRepository, {
            alias: "loanCategory",
            defaultLimit: 10,
            maxLimit: 100,
            defaultSortBy: "createdAt",
            defaultOrder: "DESC",
            searchableFields: ["name", "description"],
            allowedSortFields: ["name", "createdAt", "defaultAmount", "interestRate"],
            filterableFields: ["isActive"],
        });
    }

    create = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const {
                name,
                description,
                defaultAmount,
                interestRate,
                minAmount,
                maxAmount,
                branchId,
            } = req.body;

            // Validate amounts - maxAmount should not override contribution-based limits
            if (maxAmount && maxAmount > 0) {
                // Add a warning note about contribution-based limits
                console.log(`Warning: Category max amount (${maxAmount}) may be overridden by member contribution limits (3x contributions)`);
            }

            // Validate that minAmount is not greater than defaultAmount
            if (minAmount && defaultAmount && minAmount > defaultAmount) {
                return next(new BadRequestError("Minimum amount cannot be greater than default amount"));
            }

            // Validate that defaultAmount is not greater than maxAmount (if set)
            if (maxAmount && defaultAmount && defaultAmount > maxAmount) {
                return next(new BadRequestError("Default amount cannot be greater than maximum amount"));
            }

            // Validate optional branch if provided
            let branch: Branch | null = null;
            if (branchId) {
                branch = await AppDataSource.getRepository(Branch).findOne({
                    where: { id: Number(branchId) },
                });
                if (!branch) {
                    return next(new NotFoundError("Branch not found"));
                }
            }

            // Validate creator if present in token; fall back to null if not found
            let createdBy: User | null = null;
            if (req.user?.id) {
                createdBy = await AppDataSource.getRepository(User).findOne({
                    where: { id: Number(req.user.id) },
                });
            }

            const category = this.loanCategoryRepository.create({
                name,
                description,
                defaultAmount,
                interestRate,
                minAmount: minAmount ?? null,
                maxAmount: maxAmount ?? null,
                ...(createdBy ? { createdBy } : {}),
                ...(branch ? { branch } : {}),
            });

            const savedCategory = await this.loanCategoryRepository.save(category);

            res.status(201).json({
                status: "success",
                data: {
                    ...savedCategory,
                    note: "Maximum loan amounts are ultimately limited by member contributions (3x total contributions)"
                },
            });
        }
    );

    getAll = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const result = await this.queryBuilder.buildAndExecute(
                req.query as QueryParams,
                [],
                ["loanCategory.createdBy", "loanCategory.branch"]
            );

            res.status(200).json({
                status: "success",
                data: result,
            });
        }
    );

    getById = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params;

            const category = await this.loanCategoryRepository.findOne({
                where: { id: parseInt(id) },
                relations: ["createdBy", "branch"],
            });

            if (!category) {
                throw new NotFoundError("Loan category not found");
            }

            res.status(200).json({
                status: "success",
                data: category,
            });
        }
    );

    update = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params;
            const {
                name,
                description,
                defaultAmount,
                interestRate,
                minAmount,
                maxAmount,
                isActive,
            } = req.body;

            const category = await this.loanCategoryRepository.findOne({
                where: { id: parseInt(id) },
            });

            if (!category) {
                throw new NotFoundError("Loan category not found");
            }

            // Validate amounts before updating
            const newMinAmount = minAmount !== undefined ? minAmount : category.minAmount;
            const newDefaultAmount = defaultAmount !== undefined ? defaultAmount : category.defaultAmount;
            const newMaxAmount = maxAmount !== undefined ? maxAmount : category.maxAmount;

            // Validate that minAmount is not greater than defaultAmount
            if (newMinAmount && newDefaultAmount && newMinAmount > newDefaultAmount) {
                return next(new BadRequestError("Minimum amount cannot be greater than default amount"));
            }

            // Validate that defaultAmount is not greater than maxAmount (if set)
            if (newMaxAmount && newDefaultAmount && newDefaultAmount > newMaxAmount) {
                return next(new BadRequestError("Default amount cannot be greater than maximum amount"));
            }

            // Update fields
            if (name !== undefined) category.name = name;
            if (description !== undefined) category.description = description;
            if (defaultAmount !== undefined) category.defaultAmount = defaultAmount;
            if (interestRate !== undefined) category.interestRate = interestRate;
            if (minAmount !== undefined) category.minAmount = minAmount;
            if (maxAmount !== undefined) category.maxAmount = maxAmount;
            if (isActive !== undefined) category.isActive = isActive;

            const updatedCategory = await this.loanCategoryRepository.save(category);

            res.status(200).json({
                status: "success",
                data: {
                    ...updatedCategory,
                    note: "Maximum loan amounts are ultimately limited by member contributions (3x total contributions)"
                },
            });
        }
    );

    delete = asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            const { id } = req.params;

            const category = await this.loanCategoryRepository.findOne({
                where: { id: parseInt(id) },
            });

            if (!category) {
                throw new NotFoundError("Loan category not found");
            }

            await this.loanCategoryRepository.remove(category);

            res.status(204).json({
                status: "success",
                data: null,
            });
        }
    );
} 