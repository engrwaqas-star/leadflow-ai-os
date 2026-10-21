import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundledServerPath = path.resolve(__dirname, "dist", "server.cjs");

// In production / deployment, execute the pre-bundled dist/server.cjs if present
if (fs.existsSync(bundledServerPath) && process.env.VITE_DEV !== "true") {
  await import(pathToFileURL(bundledServerPath).href);
} else {
  // In development, load src/server.ts via tsx with Vite middleware
  process.env.VITE_DEV = "true";
  await import("./src/server.ts");
}
