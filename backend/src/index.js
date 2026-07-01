import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth_route.js'
import contractRoutes from './routes/contract.js'
import { createServer } from 'http';
import './workers/contract_worker.js'





const app = express()


app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes) 

app.use('/api/contracts', contractRoutes)

const httpserver = createServer(app);



app.get('/', (req, res) => {
  res.json({ message: 'ContractPulse API running' })
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

