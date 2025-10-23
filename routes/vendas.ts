import { Pagamentos, PrismaClient, StatusPedido } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";
import { verificaToken } from "../middewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const vendaSchema = z.object({
  clienteId: z.string(),
  produtoId: z.number(),
  pagamento: z.nativeEnum(Pagamentos),
  valor: z.number()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(StatusPedido)
});

async function enviaEmail(
  nomeCliente: string,
  emailCliente: string,
  vendaId: number,
  produtoNome: string,
  novoStatus: StatusPedido
) {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  });

  await transporter.sendMail({
    from: '"Avenida Fashion" <naoresponda@avenidafashion.com>',
    to: emailCliente,
    subject: `Atualização sobre seu Pedido #${vendaId}`,
    text: `Olá, ${nomeCliente}. O status do seu pedido foi atualizado para: ${novoStatus}.`,
    html: `<h3>Olá, ${nomeCliente}!</h3>
           <p>O status da sua compra do item "<strong>${produtoNome}</strong>" foi atualizado para: <strong>${novoStatus}</strong>.</p>
           <p>Obrigado por comprar conosco!</p>`
  });
}

router.get("/", verificaToken, async (req, res) => {
  try {
    const vendas = await prisma.venda.findMany({
      include: { cliente: true, produto: true },
      orderBy: { createdAt: "desc" }
    });
    res.status(200).json(vendas);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.post("/tentativa", async (req, res) => {
  const valida = vendaSchema.safeParse(req.body);
  if (!valida.success) return res.status(400).json({ erro: valida.error });

  const { clienteId, produtoId, pagamento, valor } = valida.data;

  try {
    const tentativa = await prisma.tentativaCompra.create({
      data: { clienteId, produtoId, pagamento, valor }
    });
    res.status(201).json(tentativa);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.post("/confirmar/:tentativaId", async (req, res) => {
  const { tentativaId } = req.params;

  try {
    const tentativa = await prisma.tentativaCompra.findUnique({
      where: { id: tentativaId }
    });

    if (!tentativa)
      return res.status(404).json({ erro: "Tentativa de compra não encontrada." });

    const [venda] = await prisma.$transaction([
      prisma.venda.create({
        data: {
          clienteId: tentativa.clienteId,
          produtoId: tentativa.produtoId,
          pagamento: tentativa.pagamento,
          valor: tentativa.valor
        },
        include: { cliente: true, produto: true }
      }),
      prisma.produto.update({
        where: { id: tentativa.produtoId },
        data: { ativo: false }
      }),
      prisma.tentativaCompra.delete({
        where: { id: tentativaId }
      })
    ]);

    enviaEmail(
      venda.cliente.nome,
      venda.cliente.email,
      venda.id,
      `${venda.produto.tipo} ${venda.produto.cor}`,
      venda.status
    ).catch(err => console.error("Erro enviando e-mail:", err));

    res.status(200).json(venda);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.patch("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;
  const valida = updateStatusSchema.safeParse(req.body);
  if (!valida.success) return res.status(400).json({ erros: valida.error.issues });

  const { status } = valida.data;

  try {
    const dados = await prisma.venda.findUnique({
      where: { id: Number(id) },
      include: { cliente: true, produto: true }
    });

    if (!dados)
      return res.status(404).json({ erro: "Venda, cliente ou produto não encontrado." });

    const venda = await prisma.venda.update({
      where: { id: Number(id) },
      data: { status }
    });

    enviaEmail(
      dados.cliente.nome,
      dados.cliente.email,
      dados.id,
      `${dados.produto.tipo} ${dados.produto.cor}`,
      status
    ).catch(err => console.error("Falha no envio de e-mail:", err));

    res.status(200).json(venda);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

export default router;
