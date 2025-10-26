import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'

const prisma = new PrismaClient();

const router = Router();

const clienteSchema = z.object({
  nome: z.string().min(10,
    { message: "Nome deve possuir, no mínimo, 10 caracteres" }),
  email: z.string().email().min(10,
    { message: "E-mail, no mínimo, 10 caracteres" }),
  senha: z.string(),
  cidade: z.string().min(1,
    { message: "Nome deve possuir, no mínimo, 1 caractere" }),
  telefone: z.string().min(15,
    { message: "Telefone deve possuir, no mínimo 15 caracteres, exemplo: (53) 99177-8732" }),
  endereco: z.string().min(2,
    { message: "Endereço deve possuir, no mínimo 5 caracteres" }).optional()
})

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(400).json(error)
  }
})

function validaSenha(senha: string) {

  const mensa: string[] = []

  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  for (const letra of senha) {

    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) {
    mensa.push("Erro... senha deve possuir letra(s) minúscula(s)")
  }

  if (grandes == 0) {
    mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  }

  if (numeros == 0) {
    mensa.push("Erro... senha deve possuir número(s)")
  }

  if (simbolos == 0) {
    mensa.push("Erro... senha deve possuir símbolo(s)")
  }

  return mensa
}

router.post("/", async (req, res) => {

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const erros = validaSenha(valida.data.senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  const salt = bcrypt.genSaltSync(12)

  const hash = bcrypt.hashSync(valida.data.senha, salt)

  const { nome, email, cidade, telefone, endereco } = valida.data

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, senha: hash, cidade, telefone, endereco }
    })
    res.status(201).json(cliente)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router