import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from 'express'

type TokenType = {
  userLogadoId: string 
  userLogadoNome: string
  userLogadoNivel: number
}

declare global {
  namespace Express {
    interface Request {
      userLogadoId?: string
      userLogadoNome?: string
      userLogadoNivel?: number 
    }
  }
}

export function verificaToken(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers

  if (!authorization) {

    return res.status(401).json({ error: "Token não informado" })
  }

  const token = authorization.split(" ")[1]
  
  if (!token) {

    return res.status(401).json({ error: "Token mal formatado" })
  }

  try {

    const jwtKey = process.env.JWT_KEY as string;
    if (!jwtKey) {
        throw new Error("Chave JWT não configurada no servidor.");
    }

    const decode = jwt.verify(token, jwtKey)

    const { userLogadoId, userLogadoNome, userLogadoNivel } = decode as TokenType

    if (!userLogadoId) {
      return res.status(401).json({ error: "Token inválido (payload não encontrado)" })
    }

    req.userLogadoId    = userLogadoId
    req.userLogadoNome  = userLogadoNome
    req.userLogadoNivel = userLogadoNivel

    next()
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    res.status(401).json({ error: "Token inválido ou expirado" })
  }
}
