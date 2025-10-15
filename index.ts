import express from 'express'
import cors from 'cors'

import routesProdutos from './routes/produtos'
import routesClientes from './routes/clientes'
import routesLogin from './routes/login'
import routesSeguranca from './routes/seguranca'
import routesVendas from './routes/vendas'

const app = express()
const port = 3000

app.use(express.json())
app.use(cors())

app.use("/produtos", routesProdutos)
app.use("/clientes", routesClientes)
app.use("/clientes/login", routesLogin)
app.use("/seguranca", routesSeguranca)
app.use("/vendas", routesVendas)

app.get('/', (req, res) => {
  res.send('API: Avenida Fashion')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})