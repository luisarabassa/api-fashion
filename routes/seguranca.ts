import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const router = Router()

router.get('/backup', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    const produtos = await prisma.produto.findMany()
    const vendas = await prisma.venda.findMany()
    const logs = await prisma.log.findMany()

    const dadosBackup = {
      clientes,
      produtos,
      vendas,
      logs,
      dataBackup: new Date().toISOString()
    }

    const caminho = path.resolve(__dirname, '../../backup.json')
    fs.writeFileSync(caminho, JSON.stringify(dadosBackup, null, 2))

    res.json({ mensagem: 'Backup gerado com sucesso!', arquivo: 'backup.json' })
  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao gerar o backup.' })
  }
})

router.post('/restore', async (req, res) => {
  try {
    const caminho = path.resolve(__dirname, '../../backup.json')
    if (!fs.existsSync(caminho)) {
      return res.status(404).json({ erro: 'Arquivo de backup.json não encontrado.' })
    }

    const conteudo = fs.readFileSync(caminho, 'utf8')
    const dados = JSON.parse(conteudo)

    await prisma.venda.deleteMany()
    await prisma.produto.deleteMany()
    await prisma.log.deleteMany()
    await prisma.cliente.deleteMany()

    for (const cliente of dados.clientes) {
      await prisma.cliente.create({ data: cliente })
    }

    for (const produto of dados.produtos) {
      await prisma.produto.create({ data: produto })
    }

    for (const venda of dados.vendas) {
      await prisma.venda.create({ data: venda })
    }

    for (const log of dados.logs) {
      await prisma.log.create({ data: log })
    }

    res.json({ mensagem: 'Dados restaurados com sucesso a partir do backup' })

  } catch (erro) {
    console.error(erro)
    res.status(500).json({ erro: 'Erro ao restaurar os dados.' })
  }
})

export default router