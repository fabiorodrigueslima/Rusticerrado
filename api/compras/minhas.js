import app from "../../backend/server.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Metodo nao permitido" });
  }

  req.url = "/api/compras/minhas";
  return app(req, res);
}
