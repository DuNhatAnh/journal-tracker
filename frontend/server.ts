import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy to Laravel Backend
  app.use("/api", express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
    const backendUrl = process.env.VITE_API_URL || "http://backend:8000";
    // Construct target URL including route parameters and query parameters
    const query = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
    const targetUrl = `${backendUrl}/api${req.path}${query}`;

    console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${targetUrl}`);

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value && typeof value === "string") {
        headers[key] = value;
      }
    }

    // Force Host header to target backend
    headers["host"] = new URL(backendUrl).host;

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: req.method !== "GET" && req.method !== "HEAD" && req.body && req.body.length > 0 ? req.body : undefined,
      });

      res.status(response.status);
      response.headers.forEach((value, key) => {
        // Do not copy content-encoding to avoid issues with compression
        if (key.toLowerCase() !== "content-encoding") {
          res.setHeader(key, value);
        }
      });

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("[Proxy Error]:", error);
      res.status(502).json({ error: "Bad Gateway - Could not connect to backend API" });
    }
  });

  // Vite middleware for development
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
    console.log(`SciTrend Server running on http://localhost:${PORT}`);
  });
}

startServer();
