import app from "../../backend/server.js";

export default function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", "PUT");
    return res.status(405).json({ message: "Metodo nao permitido" });
  }

  req.url = "/api/usuario/dados";
  return app(req, res);
}
