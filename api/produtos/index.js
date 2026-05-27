import app from "../../backend/server.js";

export default function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "Metodo nao permitido" });
  }

  req.url = "/api/produtos";
  return app(req, res);
}
