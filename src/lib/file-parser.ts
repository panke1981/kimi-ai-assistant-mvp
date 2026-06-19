import * as XLSX from "xlsx";

export interface ParsedFile {
  headers: string[];
  previewRows: Record<string, unknown>[];
  rowCount: number;
}

export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
export const SUPPORTED_FILE_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

export function isSupportedDataFile(filename: string) {
  const lower = filename.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

export async function parseDataFile(file: File): Promise<ParsedFile> {
  if (file.size === 0) {
    throw new Error("文件为空，请上传有效文件");
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    throw new Error("文件过大，请上传小于 10MB 的文件");
  }

  if (!isSupportedDataFile(file.name)) {
    throw new Error("仅支持 Excel (.xlsx, .xls) 或 CSV 文件");
  }

  const isCsv = file.name.toLowerCase().endsWith(".csv");
  const workbook = isCsv
    ? XLSX.read(await file.text(), { type: "string", raw: false })
    : XLSX.read(await file.arrayBuffer(), { type: "array", raw: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("文件内容为空或格式不正确");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const [rawHeaders, ...dataRows] = rows;
  if (!rawHeaders || dataRows.length === 0) {
    throw new Error("文件至少需要包含表头和一行数据");
  }

  const headers = rawHeaders.map((header) => String(header).trim());
  if (headers.length === 0 || headers.every((header) => !header)) {
    throw new Error("未识别到有效表头");
  }

  const previewRows = dataRows.slice(0, 50).map((row) => {
    const item: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (header) {
        item[header] = row[index] ?? null;
      }
    });
    return item;
  });

  return { headers: headers.filter(Boolean), previewRows, rowCount: dataRows.length };
}
