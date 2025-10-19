import { Pagamentos, PrismaClient, StatusPedido } from "@prisma/client"
import { Router } from "express"
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { verificaToken } from '../middewares/verificaToken'

const prisma = new PrismaClient()
const router = Router()

const vendaSchema = z.object({
  clienteId: z.string(),
  produtoId: z.number(),
  pagamento: z.nativeEnum(Pagamentos),
  valor: z.number(),
  status: z.nativeEnum(StatusPedido)
})

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

  const info = await transporter.sendMail({
    from: '"Avenida Fashion" <naoresponda@avenidafashion.com>',
    to: emailCliente,
    subject: `Atualização sobre seu Pedido #${vendaId}`,
    text: `Olá, ${nomeCliente}. O status do seu pedido foi atualizado para: ${novoStatus}.`,
    html: `<h3>Olá, ${nomeCliente}!</h3>
           <p>Temos uma novidade sobre o seu pedido <strong>#${vendaId}</strong>.</p>
           <p>O status da sua compra do item "<strong>${produtoNome}</strong>" foi atualizado para: <strong>${novoStatus}</strong>.</p>
           <p>Obrigado por comprar conosco!</p>
           <p>Atenciosamente,<br>Equipe Avenida Fashion</p>`
  });

  console.log("Message sent: %s", info.messageId);
}

router.get("/", verificaToken, async (req, res) => {
  try {
    const vendas = await prisma.venda.findMany({
      include: {
        cliente: true,
        produto: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json(vendas)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", async (req, res) => {

  const valida = vendaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }
  const { clienteId, produtoId, pagamento, valor } = valida.data

  try {
    const venda = await prisma.venda.create({
      data: { clienteId, produtoId, pagamento, valor }
    })
    res.status(201).json(venda)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:clienteId", async (req, res) => {
  const { clienteId } = req.params
  try {
    const vendas = await prisma.venda.findMany({
      where: { clienteId },
      include: {
        produto: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json(vendas)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.patch("/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  const valida = vendaSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erros: valida.error.issues })
  }

  const { status } = valida.data

  try {
    const dados = await prisma.venda.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true,
        produto: true
      }
    });

    if (!dados || !dados.cliente || !dados.produto) {
      return res.status(404).json({ erro: "Venda, cliente ou produto associado não encontrado." });
    }

    const venda = await prisma.venda.update({
      where: { id: Number(id) },
      data: { status }
    })

    enviaEmail(
      dados.cliente.nome,
      dados.cliente.email,
      dados.id,
      `${dados.produto.tipo} ${dados.produto.cor}`,
      status
    ).catch(err => {
      console.error("Falha ao enviar e-mail de atualização de status:", err);
    });

    res.status(200).json(venda)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router