import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { app } from "./src/server-app.js";

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development vs static serve in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LeadFlow AI OS Server running on http://localhost:${PORT}`);
  });
}

startServer();
