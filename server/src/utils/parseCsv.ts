import fs from "fs";
import csv from "csv-parser";

function parseCsv(filePath: string) {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      // @ts-ignore
      .pipe(csv({ columns: true, trim: true }))
      .on("data", (data: any) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error: any) => reject(error));
  });
}

export default parseCsv;
