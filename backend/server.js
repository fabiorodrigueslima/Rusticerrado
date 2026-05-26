import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-this-secret";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

if (IS_PRODUCTION && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET deve ser definido em producao.");
}

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (IS_PRODUCTION) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origem nao permitida pelo CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));

const rateLimitStore = new Map();
function rateLimit({ windowMs = 15 * 60 * 1000, max = 120 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const current = rateLimitStore.get(ip) || { count: 0, resetAt: now + windowMs };

    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    rateLimitStore.set(ip, current);

    if (current.count > max) {
      return res.status(429).json({ message: "Muitas tentativas. Tente novamente em instantes." });
    }

    return next();
  };
}

app.use(rateLimit());

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function requiredString(value, max = 255) {
  const text = String(value || "").trim();
  if (!text || text.length > max) return null;
  return text;
}

function optionalString(value, max = 255) {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).trim();
  return text.length <= max ? text : null;
}

function parsePositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function signToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      role: ADMIN_EMAILS.includes(String(usuario.email).toLowerCase()) ? "admin" : "cliente",
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    cpf: row.cpf,
    foto: row.foto,
    criado_em: row.criado_em,
  };
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Autenticacao obrigatoria" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Sessao expirada ou invalida" });
  }
}

function requireOwnerParam(paramName) {
  return (req, res, next) => {
    const requestedId = parsePositiveInt(req.params[paramName]);
    if (!requestedId) {
      return res.status(400).json({ message: "ID invalido" });
    }
    if (req.user.role !== "admin" && requestedId !== Number(req.user.id)) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    req.params[paramName] = requestedId;
    return next();
  };
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acesso restrito" });
  }
  return next();
}

app.get("/", (req, res) => {
  res.json({ message: "API RustiCerrado funcionando" });
});

/* ================= PRODUTOS ================= */

app.get("/api/produtos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM produtos WHERE ativo = true ORDER BY id DESC",
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ message: "Erro ao buscar produtos" });
  }
});

app.get("/api/produtos/:id", async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) return res.status(400).json({ message: "ID invalido" });

    const result = await pool.query("SELECT * FROM produtos WHERE id = $1 AND ativo = true", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produto nao encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ message: "Erro ao buscar produto" });
  }
});

app.post("/api/produtos", authenticate, requireAdmin, async (req, res) => {
  try {
    const nome = requiredString(req.body.nome, 120);
    const descricao = optionalString(req.body.descricao, 2000);
    const imagem = optionalString(req.body.imagem, 500);
    const categoria = optionalString(req.body.categoria, 80);
    const preco = Number(req.body.preco);
    const estoque = Number(req.body.estoque);

    if (!nome || !Number.isFinite(preco) || preco < 0 || !Number.isInteger(estoque) || estoque < 0) {
      return res.status(400).json({ message: "Dados do produto invalidos" });
    }

    const result = await pool.query(
      `INSERT INTO produtos (nome, descricao, preco, imagem, estoque, categoria)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nome, descricao, preco, imagem, estoque, categoria],
    );

    res.status(201).json({
      message: "Produto cadastrado com sucesso",
      produto: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao cadastrar produto:", error);
    res.status(500).json({ message: "Erro ao cadastrar produto" });
  }
});

/* ================= USUARIOS / AUTH ================= */

async function cadastrarUsuario(req, res) {
  try {
    const nome = requiredString(req.body.nome, 120);
    const email = normalizeEmail(req.body.email);
    const senha = String(req.body.senha || "");
    const telefone = optionalString(req.body.telefone, 30);
    const cpf = optionalString(req.body.cpf, 20);

    if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || senha.length < 8) {
      return res.status(400).json({ message: "Nome, email valido e senha com 8 caracteres sao obrigatorios" });
    }

    const existe = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);

    if (existe.rows.length > 0) {
      return res.status(400).json({ message: "Email ja cadastrado" });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, telefone, cpf)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, email, telefone, cpf, foto, criado_em`,
      [nome, email, senhaHash, telefone, cpf],
    );

    const usuario = publicUser(result.rows[0]);

    res.status(201).json({
      message: "Usuario cadastrado com sucesso",
      usuario,
      user: usuario,
      token: signToken(usuario),
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    res.status(500).json({ message: "Erro ao cadastrar usuario" });
  }
}

async function loginUsuario(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const senha = String(req.body.senha || "");

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha sao obrigatorios" });
    }

    const result = await pool.query(
      `SELECT id, nome, email, senha, telefone, cpf, foto, criado_em
       FROM usuarios
       WHERE email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Email ou senha invalidos" });
    }

    const row = result.rows[0];
    const senhaSalva = String(row.senha || "");
    const isHash = senhaSalva.startsWith("$2a$") || senhaSalva.startsWith("$2b$") || senhaSalva.startsWith("$2y$");
    const senhaValida = isHash ? await bcrypt.compare(senha, senhaSalva) : senha === senhaSalva;

    if (!senhaValida) {
      return res.status(401).json({ message: "Email ou senha invalidos" });
    }

    if (!isHash) {
      const senhaHash = await bcrypt.hash(senha, 12);
      await pool.query("UPDATE usuarios SET senha = $1 WHERE id = $2", [senhaHash, row.id]);
    }

    const usuario = publicUser(row);

    res.json({
      message: "Login realizado com sucesso",
      usuario,
      user: usuario,
      token: signToken(usuario),
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro ao fazer login" });
  }
}

app.post("/api/usuarios/cadastro", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), cadastrarUsuario);
app.post("/api/auth/cadastro", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), cadastrarUsuario);
app.post("/api/usuarios/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), loginUsuario);
app.post("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), loginUsuario);

app.get("/api/usuarios/me", authenticate, async (req, res) => {
  req.params.id = Number(req.user.id);
  return buscarUsuario(req, res);
});

async function buscarUsuario(req, res) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) return res.status(400).json({ message: "ID invalido" });

    const usuario = await pool.query(
      `SELECT id, nome, email, telefone, cpf, foto, criado_em
       FROM usuarios
       WHERE id = $1`,
      [id],
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado" });
    }

    const endereco = await pool.query(
      "SELECT * FROM enderecos WHERE usuario_id = $1 ORDER BY id DESC LIMIT 1",
      [id],
    );

    res.json({
      usuario: publicUser(usuario.rows[0]),
      user: publicUser(usuario.rows[0]),
      endereco: endereco.rows[0] || null,
    });
  } catch (error) {
    console.error("Erro ao buscar usuario:", error);
    res.status(500).json({ message: "Erro ao buscar usuario" });
  }
}

app.get("/api/usuario/perfil", authenticate, async (req, res) => {
  req.params.id = Number(req.user.id);
  return buscarUsuario(req, res);
});

app.get("/api/usuarios/:id", authenticate, requireOwnerParam("id"), buscarUsuario);

async function atualizarPerfil(req, res) {
  try {
    const id = Number(req.user.id);
    const nome = requiredString(req.body.nome, 120);
    const email = normalizeEmail(req.body.email);
    const telefone = optionalString(req.body.telefone, 30);
    const cpf = optionalString(req.body.cpf, 20);
    const endereco = optionalString(req.body.endereco, 255);
    const numero = optionalString(req.body.numero, 30);
    const complemento = optionalString(req.body.complemento, 120);
    const bairro = optionalString(req.body.bairro, 120);
    const cidade = optionalString(req.body.cidade, 120);
    const estado = optionalString(req.body.estado, 2);
    const cep = optionalString(req.body.cep, 20);

    if (!nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Nome e email valido sao obrigatorios" });
    }

    const usuarioAtualizado = await pool.query(
      `UPDATE usuarios
       SET nome = $1, email = $2, telefone = $3, cpf = $4
       WHERE id = $5
       RETURNING id, nome, email, telefone, cpf, foto, criado_em`,
      [nome, email, telefone, cpf, id],
    );

    if (usuarioAtualizado.rows.length === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado" });
    }

    let enderecoAtualizado = null;
    if (endereco || numero || bairro || cidade || estado || cep) {
      const enderecoExistente = await pool.query(
        "SELECT id FROM enderecos WHERE usuario_id = $1 LIMIT 1",
        [id],
      );

      if (enderecoExistente.rows.length > 0) {
        const enderecoId = enderecoExistente.rows[0].id;
        const result = await pool.query(
          `UPDATE enderecos
           SET endereco = $1, numero = $2, complemento = $3, bairro = $4,
               cidade = $5, estado = $6, cep = $7
           WHERE id = $8 AND usuario_id = $9
           RETURNING *`,
          [endereco, numero, complemento, bairro, cidade, estado, cep, enderecoId, id],
        );

        enderecoAtualizado = result.rows[0];
      } else {
        const result = await pool.query(
          `INSERT INTO enderecos
           (usuario_id, endereco, numero, complemento, bairro, cidade, estado, cep)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [id, endereco, numero, complemento, bairro, cidade, estado, cep],
        );

        enderecoAtualizado = result.rows[0];
      }
    }

    res.json({
      message: "Perfil atualizado com sucesso",
      usuario: publicUser(usuarioAtualizado.rows[0]),
      user: publicUser(usuarioAtualizado.rows[0]),
      endereco: enderecoAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ message: "Erro ao atualizar perfil" });
  }
}

app.put("/api/usuario/dados", authenticate, atualizarPerfil);
app.put("/api/usuarios/:id", authenticate, requireOwnerParam("id"), atualizarPerfil);

/* ================= PEDIDOS / COMPRAS ================= */

app.post("/api/pedidos", authenticate, async (req, res) => {
  const client = await pool.connect();

  try {
    const itens = Array.isArray(req.body.itens) ? req.body.itens : [];
    const enderecoId = req.body.endereco_id ? parsePositiveInt(req.body.endereco_id) : null;
    const frete = Number(req.body.frete || 0);

    if (itens.length === 0 || itens.length > 50 || !Number.isFinite(frete) || frete < 0) {
      return res.status(400).json({ message: "Pedido invalido" });
    }

    await client.query("BEGIN");

    const pedidoItens = [];
    let subtotal = 0;

    for (const item of itens) {
      const produtoId = parsePositiveInt(item.id || item.produto_id);
      const quantidade = parsePositiveInt(item.quantidade);

      if (!produtoId || !quantidade || quantidade > 100) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Item de pedido invalido" });
      }

      const produto = await client.query(
        "SELECT id, preco, estoque FROM produtos WHERE id = $1 AND ativo = true",
        [produtoId],
      );

      if (produto.rows.length === 0 || Number(produto.rows[0].estoque) < quantidade) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Produto indisponivel" });
      }

      const preco = Number(produto.rows[0].preco);
      subtotal += preco * quantidade;
      pedidoItens.push({ produtoId, quantidade, preco });
    }

    const total = subtotal + frete;
    const pedido = await client.query(
      `INSERT INTO pedidos (usuario_id, endereco_id, total, frete, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, enderecoId, total, frete, "pendente"],
    );

    const pedidoId = pedido.rows[0].id;

    for (const item of pedidoItens) {
      await client.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco)
         VALUES ($1, $2, $3, $4)`,
        [pedidoId, item.produtoId, item.quantidade, item.preco],
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Pedido criado com sucesso",
      pedido: pedido.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar pedido:", error);
    res.status(500).json({ message: "Erro ao criar pedido" });
  } finally {
    client.release();
  }
});

async function buscarCompras(req, res) {
  try {
    const usuarioId = req.params.usuario_id ? Number(req.params.usuario_id) : Number(req.user.id);

    const result = await pool.query(
      `SELECT
        p.id,
        p.total,
        p.total AS valor,
        p.frete,
        p.status,
        p.criado_em
       FROM pedidos p
       WHERE p.usuario_id = $1
       ORDER BY p.criado_em DESC`,
      [usuarioId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar compras:", error);
    res.status(500).json({ message: "Erro ao buscar compras" });
  }
}

app.get("/api/minhas-compras", authenticate, buscarCompras);
app.get("/api/compras/minhas", authenticate, buscarCompras);
app.get("/api/minhas-compras/:usuario_id", authenticate, requireOwnerParam("usuario_id"), buscarCompras);

app.get("/api/pedidos/:id", authenticate, async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) return res.status(400).json({ message: "ID invalido" });

    const pedido = await pool.query("SELECT * FROM pedidos WHERE id = $1", [id]);

    if (pedido.rows.length === 0) {
      return res.status(404).json({ message: "Pedido nao encontrado" });
    }

    if (req.user.role !== "admin" && Number(pedido.rows[0].usuario_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const itens = await pool.query(
      `SELECT
        ip.id,
        ip.quantidade,
        ip.preco,
        pr.nome,
        pr.descricao,
        pr.imagem
       FROM itens_pedido ip
       LEFT JOIN produtos pr ON pr.id = ip.produto_id
       WHERE ip.pedido_id = $1`,
      [id],
    );

    res.json({
      pedido: pedido.rows[0],
      itens: itens.rows,
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    res.status(500).json({ message: "Erro ao buscar pedido" });
  }
});

/* ================= PAGAMENTO MERCADO PAGO FUTURO ================= */

app.post("/api/pagamento/mercado-pago", authenticate, async (req, res) => {
  res.status(501).json({
    message: "Integracao Mercado Pago ainda sera configurada",
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error("Erro inesperado:", err);
  return res.status(500).json({ message: "Erro interno do servidor" });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
