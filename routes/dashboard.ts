import { PrismaClient, Tipos } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count()
    const produtos = await prisma.produto.count()
    const vendas = await prisma.venda.count()
    res.status(200).json({ clientes, produtos, vendas })
  } catch (error) {
    res.status(400).json(error)
  }
})

type ClienteGroupByCidade = {
  cidade: string
  _count: {
    cidade: number
  }
}

router.get("/clientesCidade", async (req, res) => {
  try {
    const clientes = await prisma.cliente.groupBy({
      by: ['cidade'],
      _count: {
        cidade: true,
      },
    })

    const clientes2 = clientes.map((cliente: ClienteGroupByCidade) => ({
      cidade: cliente.cidade,
      num: cliente._count.cidade
    }))

    res.status(200).json(clientes2)
  } catch (error) {
    res.status(400).json(error)
  }
})

type ProdutoGroupByTipo = {
  tipo: Tipos 
  _count: {
    id: number 
  }
}

router.get("/produtosTipo", async (req, res) => {
  try {
    const produtos = await prisma.produto.groupBy({
      by: ['tipo'],
      _count: {
        id: true,
      },
    })

    const produtos2 = produtos.map((produto: ProdutoGroupByTipo) => ({
      tipo: produto.tipo,
      num: produto._count.id 
    }))

    res.status(200).json(produtos2)
  } catch (error) {
    console.error("Erro em /produtosTipo:", error)
    res.status(400).json(error)
  }
})

export default router