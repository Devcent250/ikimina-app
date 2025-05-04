import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { District } from "../entities/District";
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { QueryBuilder } from "../utils/QueryBuilder";
import { NotFoundError, BadRequestError } from "../errors/http.errors";
import { QueryParams } from "../types/QueryParams";

export class DistrictController {
  private repository: Repository<District> =
    AppDataSource.getRepository(District);
  private queryBuilder: QueryBuilder<District>;

  constructor() {
    this.queryBuilder = new QueryBuilder(this.repository, {
      alias: "districts",
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: "createdAt",
      defaultOrder: "DESC",
      searchableFields: ["name", "description", "location"],
      allowedSortFields: ["createdAt", "updatedAt", "name"],
      filterableFields: [],
    });
  }

  // Get all districts with pagination and filtering
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const queryParams = req.query as unknown as QueryParams;
    const result = await this.queryBuilder.buildAndExecute(queryParams, [], ["districts.branches"]);
    res.json(result);
  });

  // Get a single district by ID
  getOne = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const district = await this.repository.findOne({
      where: { id: Number(id) },
      relations: ["branches"],
    });

    if (!district) {
      throw new NotFoundError("District not found");
    }

    res.json(district);
  });

  // Create a new district
  create = asyncHandler(async (req: Request, res: Response) => {
    const { name, description, location } = req.body;

    // Check if district with same name exists
    const existingDistrict = await this.repository.findOne({
      where: { name },
    });

    if (existingDistrict) {
      throw new BadRequestError("District with this name already exists");
    }

    const district = this.repository.create({
      name,
      description,
      location,
    });

    await this.repository.save(district);
    res.status(201).json(district);
  });

  // Update a district
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, location } = req.body;

    const district = await this.repository.findOne({
      where: { id: Number(id) },
    });

    if (!district) {
      throw new NotFoundError("District not found");
    }

    // If name is being updated, check for duplicates
    if (name && name !== district.name) {
      const existingDistrict = await this.repository.findOne({
        where: { name },
      });

      if (existingDistrict) {
        throw new BadRequestError("District with this name already exists");
      }
    }

    Object.assign(district, {
      name: name || district.name,
      description: description || district.description,
      location: location || district.location,
    });

    await this.repository.save(district);
    res.json(district);
  });

  // Delete a district
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const district = await this.repository.findOne({
      where: { id: Number(id) },
      relations: ["branches"],
    });

    if (!district) {
      throw new NotFoundError("District not found");
    }

    // Check if district has any branches
    if (district.branches && district.branches.length > 0) {
      throw new BadRequestError(
        "Cannot delete district with associated branches. Please remove or reassign branches first."
      );
    }

    await this.repository.remove(district);
    res.status(204).send();
  });
} 