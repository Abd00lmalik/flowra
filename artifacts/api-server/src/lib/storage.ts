import fs from "fs";
import path from "path";

const UPLOAD_DIR = "/tmp/sponsorship-uploads";

export async function saveFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return `/api/files/${safeName}`;
}

export async function getFileBuffer(url: string): Promise<Buffer | null> {
  try {
    const filename = url.split("/").pop();
    if (!filename) return null;
    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}
