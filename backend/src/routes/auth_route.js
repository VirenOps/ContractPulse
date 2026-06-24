import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  const { companyName, name, email, password } = req.body

  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName }
      })
      const user = await tx.user.create({
        data: { companyId: company.id, name, email, password: hashedPassword, role: 'ADMIN' }
      })
      return { company, user }
    })

    const token = jwt.sign({ userId: result.user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({ token, user: { id: result.user.id, name, email, role: 'ADMIN' } })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', authenticate, (req, res) => {
  const { password, ...user } = req.user
  res.json(user)
})

export default router