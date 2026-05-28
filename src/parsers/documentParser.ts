import fs from 'fs/promises';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function parseDocument(filePath: string, fileType: 'docx' | 'pdf' | 'txt'): Promise<string> {
  switch (fileType) {
    case 'docx':
      return parseDocx(filePath);
    case 'pdf':
      return parsePdf(filePath);
    case 'txt':
      return parseText(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

async function parseDocx(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

async function parsePdf(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  return result.text.trim();
}

async function parseText(filePath: string): Promise<string> {
  return (await fs.readFile(filePath, 'utf8')).trim();
}
