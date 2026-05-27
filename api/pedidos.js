import app from "../backend/server.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Metodo nao permitido" });
  }

  req.url = "/api/pedidos";
  return app(req, res);
}
