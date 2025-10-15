import { PrismaClient } from "@prisma/client"
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

type ProdutoGroupByMarca = {
  marca: string | null
  _count: {
    marca: number
  }
}
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

router.get("/produtosMarca", async (req, res) => {
  try {
    const produtos = await prisma.produto.groupBy({
      by: ['marca'],
      _count: {
        marca: true,
      }
    })

    const produtos2 = produtos.map((produto: ProdutoGroupByMarca) => ({
      marca: produto.marca ?? "Sem Marca",
      num: produto._count.marca
    }))

    res.status(200).json(produtos2)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
