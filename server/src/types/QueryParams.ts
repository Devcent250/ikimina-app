import { IsOptional, IsInt, IsString, IsIn, Min } from "class-validator";
import { Type, Transform } from "class-transformer";

export class QueryParams {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  order?: "ASC" | "DESC";

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => value.split(","))
  select?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  filters?: Array<{
    field: string;
    operator: "eq" | "gt" | "gte" | "lt" | "lte" | "like" | "between" | "in";
    value: any;
  }>;
}
