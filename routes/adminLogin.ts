import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const router = Router()

router.post("/", async (req, res) => {
  const { email, senha } = req.body

  const mensaPadrao = "Login ou senha incorretos"

  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao })
    return
  }

  try {
    const admin = await prisma.admin.findFirst({
      where: { email }
    })

    if (admin == null) {
      // res.status(400).json({ erro: "E-mail inválido" })
      res.status(400).json({ erro: mensaPadrao })
      return
    }

    // se o e-mail existe, faz-se a comparação dos hashs
    if (bcrypt.compareSync(senha, admin.senha)) {
      // se confere, gera e retorna o token
      const token = jwt.sign({
        adminLogadoId: admin.id,
        adminLogadoNome: admin.nome,
        adminLogadoNivel: admin.nivel
      },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      )

      res.status(200).json({
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        nivel: admin.nivel,
        token
      })
    } else {
      res.status(400).json({ erro: mensaPadrao })
    }
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router