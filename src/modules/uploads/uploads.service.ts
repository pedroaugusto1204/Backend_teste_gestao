import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';

export class UploadsService {
  private uploadDir = path.resolve(env.UPLOAD_DIR);

  /**
   * List all files currently stored in the upload directory.
   */
  listFiles(): { filename: string; size: number; url: string }[] {
    if (!fs.existsSync(this.uploadDir)) {
      return [];
    }

    const files = fs.readdirSync(this.uploadDir);
    return files.map((filename) => {
      const filePath = path.join(this.uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        url: `/uploads/${filename}`,
      };
    });
  }

  /**
   * Delete a specific file by filename.
   * Returns true if deleted, false if not found.
   */
  deleteFile(filename: string): boolean {
    // Prevent path traversal attacks
    const safeName = path.basename(filename);
    const filePath = path.join(this.uploadDir, safeName);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  }
}
