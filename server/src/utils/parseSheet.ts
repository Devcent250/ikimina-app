import { BadRequestError } from "../errors/http.errors";
import parseCsv from "./parseCsv";
import { parseExcel } from "./parseExcel";
import path from "path";

const parseSheet = async (file: any) => {
  let data: any;

  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (fileExtension === ".xlsx" || fileExtension === ".xls") {
    data = parseExcel(file.path);
  } else if (fileExtension === ".csv") {
    data = await parseCsv(file.path);
  } else {
    throw new BadRequestError("Invalid file type");
  }

  return data;
};

export default parseSheet;
