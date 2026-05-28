declare const process: {
  env: { [key: string]: string | undefined };
  cwd(): string;
};

declare module 'express';
declare module 'multer';
declare module 'uuid' {
  export function v4(): string;
}
declare module 'fs/promises';
declare module 'mammoth';
declare module 'pdf-parse';
