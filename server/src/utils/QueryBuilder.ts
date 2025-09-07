import {
  Repository,
  SelectQueryBuilder,
  ObjectLiteral,
  Brackets,
  Between,
} from "typeorm";
import { QueryParams } from "../types/QueryParams";

export interface QueryOptions {
  defaultLimit?: number;
  maxLimit?: number;
  defaultSortBy?: string;
  defaultOrder?: "ASC" | "DESC";
  searchableFields?: string[];
  allowedSortFields?: string[];
  filterableFields?: string[];
  alias: string;
  nestedJoins?: NestedJoin[];
}

export interface NestedJoin {
  path: string;
  alias?: string;
  type?: "leftJoin" | "innerJoin";
  select?: string[];
  conditions?: CustomCondition[];
}

export interface CustomCondition {
  where: string;
  parameters?: ObjectLiteral;
}

export class QueryBuilder<T extends ObjectLiteral> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly options: QueryOptions
  ) {
    this.options = {
      defaultLimit: 10,
      maxLimit: 100,
      defaultOrder: "DESC",
      nestedJoins: [],
      ...options,
    };
  }

  async buildAndExecute(
    params: QueryParams,
    customConditions: CustomCondition[] = [],
    customJoins: string[] = [],
    nestedJoins?: any[]
  ) {
    const queryBuilder = this.repository.createQueryBuilder(this.options.alias);

    // Apply custom joins
    customJoins.forEach((joinPath) => {
      queryBuilder.leftJoinAndSelect(joinPath, joinPath.split(".")[1]);
    });

    // Apply nested joins
    this.applyNestedJoins(queryBuilder, nestedJoins);

    const built = this.build(queryBuilder, params, customConditions);

    // Log the generated SQL for debugging
    console.log("[QueryBuilder] SQL:", built.getSql());

    const [items, total] = await built.getManyAndCount();
    console.log(`[QueryBuilder] Results: ${items.length}, Total: ${total}`);
    if (items.length === 0) {
      console.log("[QueryBuilder] No items found.");
    } else {
      console.log("[QueryBuilder] First item:", items[0]);
    }

    if (params.page || params.cursor) {
      const lastItem = items[items.length - 1];
      const nextCursor = lastItem
        ? Buffer.from((lastItem as any)["id"].toString()).toString("base64")
        : null;

      return {
        results: items,
        total,
        page: params.page || 1,
        limit: params.limit || this.options.defaultLimit,
        hasMore: params.cursor
          ? items.length === params.limit
          : (params.page || 1) * (params.limit || this.options.defaultLimit || 10) <
          total,
        nextCursor,
      };
    }
    {
      return {
        results: items,
      };
    }
  }

  private applyNestedJoins(queryBuilder: SelectQueryBuilder<T>, nestedJoins: any) {
    // Ensure nested joins are defined
    if (!nestedJoins || nestedJoins.length === 0) {
      return;
    }

    nestedJoins.forEach((join: any) => {
      const joinAlias = join.alias || join.path.split(".").pop();
      const joinType = join.type || "leftJoin";

      // Apply the join
      if (joinType === "leftJoin") {
        queryBuilder.leftJoinAndSelect(join.path, joinAlias);
      } else {
        queryBuilder.innerJoinAndSelect(join.path, joinAlias);
      }

      // Apply select for specific fields if provided
      if (join.select && join.select.length > 0) {
        const selection = join.select.map((field: any) => `${joinAlias}.${field}`);
        queryBuilder.addSelect(selection);
      }

      // Apply additional conditions for the join if provided
      if (join.conditions && join.conditions.length > 0) {
        join.conditions.forEach((condition: any) => {
          queryBuilder.andWhere(
            new Brackets((qb) => {
              qb.andWhere(condition.where, condition.parameters);
            })
          );
        });
      }
    });
  }

  private build(
    queryBuilder: SelectQueryBuilder<T>,
    params: QueryParams,
    customConditions: CustomCondition[] = []
  ): SelectQueryBuilder<T> {
    const {
      page,
      limit = this.options.defaultLimit,
      sortBy = this.options.defaultSortBy,
      order = this.options.defaultOrder,
      search,
      cursor,
      select,
      filters,
    } = params;

    const { alias } = this.options;

    // Apply select fields
    if (select?.length) {
      const selection = select.map((field) => `${alias}.${field}`);
      queryBuilder.select(selection);
    }

    // Apply search with brackets (also support custom search conditions)
    if (search && this.options.searchableFields?.length) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          this.options.searchableFields!.forEach((field, i) => {
            qb.orWhere(`${alias}.${field} ILIKE :search`, {
              search: `%${search}%`,
            });
          });
        })
      );
    }
    // Apply custom search conditions (Google-like search)
    if (customConditions && customConditions.length > 0) {
      customConditions.forEach((condition) => {
        queryBuilder.andWhere(new Brackets((qb) => {
          qb.andWhere(condition.where, condition.parameters);
        }));
      });
    }

    // Apply filters with brackets
    if (filters?.length && this.options.filterableFields?.length) {
      filters.forEach((filter, index) => {
        if (this.options.filterableFields!.includes(filter.field)) {
          const paramName = `filter${index}`;

          switch (filter.operator) {
            case "eq":
              queryBuilder.andWhere(
                new Brackets((qb) => {
                  qb.andWhere(`${alias}.${filter.field} = :${paramName}`, {
                    [paramName]: filter.value,
                  });
                })
              );
              break;
            case "gt":
              queryBuilder.andWhere(
                new Brackets((qb) => {
                  qb.andWhere(`${alias}.${filter.field} > :${paramName}`, {
                    [paramName]: filter.value,
                  });
                })
              );
              break;
            case "gte":
              queryBuilder.andWhere(
                new Brackets((qb) => {
                  qb.andWhere(`${alias}.${filter.field} >= :${paramName}`, {
                    [paramName]: filter.value,
                  });
                })
              );
              break;
            case "lt":
              queryBuilder.andWhere(
                new Brackets((qb) => {
                  qb.andWhere(`${alias}.${filter.field} < :${paramName}`, {
                    [paramName]: filter.value,
                  });
                })
              );
              break;
            case "lte":
              queryBuilder.andWhere(
                new Brackets((qb) => {
                  qb.andWhere(`${alias}.${filter.field} <= :${paramName}`, {
                    [paramName]: filter.value,
                  });
                })
              );
              break;
            case "like":
              queryBuilder.andWhere(
                new Brackets((qb) => {
                  qb.andWhere(`${alias}.${filter.field} ILIKE :${paramName}`, {
                    [paramName]: `%${filter.value}%`,
                  });
                })
              );
              break;
            case "in":
              queryBuilder.andWhere(
                new Brackets((qb) => {
                  qb.andWhere(
                    `${alias}.${filter.field} IN (:...${paramName})`,
                    {
                      [paramName]: filter.value,
                    }
                  );
                })
              );
              break;

            case "between":
              console.log(`${alias}.date BETWEEN :from AND :to`);
              queryBuilder.andWhere(
                new Brackets((qb) => {
                  qb.andWhere(`${alias}.date BETWEEN :from AND :to`, {
                    from: new Date(filter.value[0]),
                    to: new Date(filter.value[1]),
                  });
                })
              );
              break;
          }
        }
      });
    }

    // (Removed duplicate application of customConditions)

    // Apply sorting
    if (sortBy && this.options.allowedSortFields?.includes(sortBy)) {
      queryBuilder.orderBy(`${alias}.${sortBy}`, order);
    }

    // Apply pagination
    if (cursor) {
      const decodedCursor = Buffer.from(cursor, "base64").toString("ascii");
      queryBuilder.andWhere(`${alias}.id > :cursor`, { cursor: decodedCursor });
    } else if (page) {
      queryBuilder.skip((page - 1) * limit!);
    }

    // Apply limit
    const finalLimit = Math.min(limit!, this.options.maxLimit || 100);
    queryBuilder.take(finalLimit);

    return queryBuilder;
  }
}
