import fs from "fs";
import path from "path";
import axios from "axios";

const TEMP_DIR = path.join(process.cwd(), "temp");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function downloadFile(fileUrl: string, fileType: string): Promise<string> {
  try {
    const uniqueFileName = generateUniqueFileName(fileType);
    const outputPath = path.join(TEMP_DIR, uniqueFileName);

    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "arraybuffer",
    });

    fs.writeFileSync(outputPath, response.data);
    return outputPath;
  } catch (error: any) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

export function generateUniqueFileName(fileType: string): string {
  return `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileType}`;
}


export function cleanupTempFiles(): void {
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) {
      console.error("Error reading temp directory:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(TEMP_DIR, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", filePath, err);
        } else {
          console.log("Deleted file:", filePath);
        }
      });
    });
  });
}


export function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}