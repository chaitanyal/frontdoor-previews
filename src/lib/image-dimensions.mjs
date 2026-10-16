import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { imageMetadata } from 'astro/assets/utils';

/** Read intrinsic dimensions at build time without changing the published asset URL. */
export async function imageDimensions(sourcePath) {
  const file = path.resolve(sourcePath);
  const { width, height } = await imageMetadata(await readFile(file), file);
  return { width, height };
}
