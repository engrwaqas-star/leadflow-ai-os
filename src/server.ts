import express from "express";
import path from "path";
import fs from "fs";
import { app } from "./server-app.ts";

const currentDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Determine dist directory location
  const candidates = [
    path.join(process.cwd(), "dist"),
    currentDir,
    path.resolve(currentDir, "dist"),
    path.resolve(currentDir, "..", "dist"),
  ];
  const distPath = candidates.find((dir) => fs.existsSync(path.join(dir, "index.html")));

  // Only run Vite dev middleware if NO built bundle was found or explicitly in dev mode
  const isDev = process.env.VITE_DEV === "true" || (!distPath && process.env.NODE_ENV !== "production");

  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (distPath) {
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LeadFlow AI OS Server running on http://localhost:${PORT}`);
  });
}

startServer();
