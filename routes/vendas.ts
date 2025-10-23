import { Pagamentos, PrismaClient, StatusPedido } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";

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
      pass: process.env.MAILTRAP_PASS,
    },
  });

  await transporter.sendMail({
    from: '"Avenida Fashion" <naoresponda@avenidafashion.com>',
    to: emailCliente,
    subject: `Atualização sobre seu Pedido #${vendaId}`,
    text: `Olá, ${nomeCliente}. O status do seu pedido foi atualizado para: ${novoStatus}.`,
    html: `<h3>Olá, ${nomeCliente}!</h3>
           <p>Seu pedido <strong>#${vendaId}</strong> foi registrado com sucesso.</p>
           <p>Produto: <strong>${produtoNome}</strong></p>
           <p>Status: <strong>${novoStatus}</strong></p>
           <p>Obrigado por comprar conosco!</p>
           <p>Atenciosamente,<br>Equipe Avenida Fashion</p>`
  });
}

router.post("/", async (req, res) => {
  const valida = vendaSchema.safeParse(req.body);
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error });
  }

  const { clienteId, produtoId, pagamento, valor } = valida.data;

  try {
    const [venda] = await prisma.$transaction([
      prisma.venda.create({
        data: { clienteId, produtoId, pagamento, valor },
        include: { cliente: true, produto: true }
      }),
      prisma.produto.update({
        where: { id: produtoId },
        data: { ativo: false }
      })
    ]);

    enviaEmail(
      venda.cliente.nome,
      venda.cliente.email,
      venda.id,
      `${venda.produto.tipo} ${venda.produto.cor}`,
      venda.status
    ).catch(err => console.error("Erro ao enviar e-mail:", err));

    res.status(201).json(venda);
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(400).json({ message: "Produto já vendido ou não existe." });
    }
    res.status(500).json({ erro: error });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const valida = updateStatusSchema.safeParse(req.body);
  if (!valida.success) return res.status(400).json({ erros: valida.error.issues });

  const { status } = valida.data;

  try {
    const dados = await prisma.venda.findUnique({
      where: { id: Number(id) },
      include: { cliente: true, produto: true }
    });

    if (!dados) return res.status(404).json({ erro: "Venda não encontrada." });

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
    ).catch(err => console.error("Falha ao enviar e-mail de atualização de status:", err));

    res.status(200).json(venda);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

export default router;
