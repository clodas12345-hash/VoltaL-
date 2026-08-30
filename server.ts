import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API para upload do ícone exato enviado pelo usuário
  app.post("/api/update-icon", (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }

      // Limpar prefixo data:image/...;base64,
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Salvar nos locais corretos
      const paths = [
        path.join(process.cwd(), "assets", "icon.png"),
        path.join(process.cwd(), "assets", "splash.png"),
        path.join(process.cwd(), "public", "icon.png"),
        path.join(process.cwd(), "public", "favicon.png"),
        path.join(process.cwd(), "dist", "icon.png"),
        path.join(process.cwd(), "dist", "favicon.png"),
      ];

      paths.forEach((p) => {
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(p, buffer);
      });

      return res.json({ success: true, message: "Ícone atualizado com sucesso com o arquivo original!" });
    } catch (err: any) {
      console.error("Erro ao salvar ícone:", err);
      return res.status(500).json({ error: err.message });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
