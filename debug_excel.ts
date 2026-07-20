import ExcelJS from 'exceljs';
import fs from 'fs';

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.csv.readFile('C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\import_arsip.csv');
  const worksheet = workbook.worksheets[0];

  worksheet.eachRow((row, rowNumber) => {
    console.log(`Row ${rowNumber}:`, row.values);
  });
}

main().catch(console.error);
