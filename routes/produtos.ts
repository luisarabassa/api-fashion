import { PrismaClient, Tamanhos, Tipos } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken } from '../middewares/verificaToken'

const prisma = new PrismaClient()

const router = Router()

const produtoSchema = z.object({
  cor: z.string().min(4,
    { message: "Nome da cor deve possuir, no mínimo, 4 caracteres" }),
  marca: z.string().min(2,
    { message: "Nome da marca deve possuir, no mínimo, 2 caracteres" }).optional(),
  material: z.string().min(2,
    { message: "Nome do material deve possuir, no mínimo, 2 caracteres" }).optional(),
  valor: z.number().positive({ message: "Valor deve ser um valor positivo" }),
  foto: z.string(),
  favorito: z.boolean().optional(),
  tamanho: z.nativeEnum(Tamanhos),
  tipo: z.nativeEnum(Tipos),
  adminId: z.string().uuid()
})

router.get("/", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        id: 'desc'
      }
    })
    res.status(200).json(produtos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/favoritos", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
        favorito: true
      },
      orderBy: {
        id: 'desc'
      }
    })
    res.status(200).json(produtos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const produto = await prisma.produto.findFirst({
      where: { id: Number(id) }
    })
    res.status(200).json(produto)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", verificaToken, async (req, res) => {

  const valida = produtoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { cor, marca, material, valor, foto, favorito, tamanho, tipo, adminId } = valida.data

  try {
    const produto = await prisma.produto.create({
      data: { cor, marca, material, valor, foto, favorito, tamanho, tipo, adminId }
    })
    res.status(201).json(produto)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  try {
    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: { ativo: false }
    })

    const adminId = req.userLogadoId as string
    const adminNome = req.userLogadoNome as string

    const descricao = `Exclusão de: ${produto}`
    const complemento = `Admin: ${adminNome}`

    const log = await prisma.log.create({
      data: { descricao, complemento, adminId }
    })

    res.status(200).json(produto)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = produtoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { cor, marca, material, valor, foto, favorito, tamanho, tipo, adminId } = valida.data

  try {
    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: { cor, marca, material, valor, foto, favorito, tamanho, tipo, adminId }
    })
    res.status(200).json(produto)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;

  const termoNumero = Number(termo);

  if (isNaN(termoNumero)) {
    try {
      const produtos = await prisma.produto.findMany({
        where: {
          ativo: true,
          OR: [
            { tipo: termo.toUpperCase() as Tipos },
            { marca: { contains: termo, mode: "insensitive" } },
            { cor: { contains: termo, mode: "insensitive" } },
            { material: { contains: termo, mode: "insensitive" } },
          ]
        }
      });
      res.status(200).json(produtos);
    } catch (error) {
      res.status(500).json({ erro: error });
    }

  } else {
    if (termoNumero <= 3000) {
      try {
        const produtos = await prisma.produto.findMany({
          where: {
            ativo: true,
          }
        })
        res.status(200).json(produtos)
      } catch (error) {
        res.status(500).json({ erro: error })
      }
    } else {
      try {
        const produtos = await prisma.produto.findMany({
          where: {
            ativo: true,
            valor: { lte: termoNumero }
          }
        })
        res.status(200).json(produtos)
      } catch (error) {
        res.status(500).json({ erro: error })
      }
    }
  }
});

export default router
