import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { config } from '../config/index.js';

export interface StorageUploadInput {
  organizationId: string;
  filename: string;
  sourcePath: string;
}

export interface StorageUploadResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

function resolveStorageRoot() {
  return path.resolve(process.cwd(), config.storage.localRoot);
}

function assertSafeStoragePath(root: string, target: string) {
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Unsafe storage path');
  }
}

export class LocalStorageProvider implements StorageProvider {
  private root = resolveStorageRoot();

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const organizationSegment = path.basename(input.organizationId);
    const filename = path.basename(input.filename);
    const key = `${organizationSegment}/${filename}`;
    const destinationDir = path.join(this.root, organizationSegment);
    const destinationPath = path.join(destinationDir, filename);

    assertSafeStoragePath(this.root, destinationPath);
    await fs.promises.mkdir(destinationDir, { recursive: true });
    await pipeline(fs.createReadStream(input.sourcePath), fs.createWriteStream(destinationPath));

    return {
      key,
      url: this.getUrl(key),
    };
  }

  async delete(key: string): Promise<void> {
    const safeKey = key
      .split(/[\\/]+/)
      .filter(Boolean)
      .map((segment) => path.basename(segment))
      .join(path.sep);
    const targetPath = path.join(this.root, safeKey);

    assertSafeStoragePath(this.root, targetPath);
    await fs.promises.rm(targetPath, { force: true });
  }

  getUrl(key: string): string {
    return `/uploads/${key.replaceAll('\\', '/')}`;
  }
}

export class DisabledCloudStorageProvider implements StorageProvider {
  async upload(): Promise<StorageUploadResult> {
    throw new Error('Cloud storage provider is not configured');
  }

  async delete(): Promise<void> {
    throw new Error('Cloud storage provider is not configured');
  }

  getUrl(): string {
    throw new Error('Cloud storage provider is not configured');
  }
}

export function createStorageProvider(): StorageProvider {
  if (config.storage.provider === 'local' || config.storage.provider === 'dummy') {
    return new LocalStorageProvider();
  }

  return new DisabledCloudStorageProvider();
}
