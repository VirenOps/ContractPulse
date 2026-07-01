import express from 'express'
import multer from 'multer'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/auth.js'
import { contractQueue } from '../lib/queue.js'
import { uploadPDF } from '../services/storage_service.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDFs allowed' });

    const fileHeader = req.file.buffer.toString('ascii', 0, 4);

    if (fileHeader !== '%PDF') {
      return res.status(403).json({ 
        error: 'Security Threat: File contents do not match genuine PDF magic bytes.' 
      });
    }

    const pdfUrl = await uploadPDF(req.file.buffer, req.file.originalname)

    const contract = await prisma.contract.create({
      data: {
        companyId: req.user.companyId,
        ownerId: req.user.id,
        pdfUrl,
        processingStatus: 'PENDING'
      }
    })

    await contractQueue.add('process', { contractId: contract.id })

    res.status(202).json({ contractId: contract.id, status: 'processing' })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', authenticate, async (req, res) => {
  try {
    const contracts = await prisma.contract.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(contracts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', authenticate, async (req, res) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
      include: { milestones: true, penaltyClauses: true, auditLogs: true }
    })
    if (!contract) return res.status(404).json({ error: 'Contract not found' })
    res.json(contract)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


router.patch('/:id/decision', authenticate, async (req, res) => {
  try {
    const { renewalDecision } = req.body
    const contractId = req.params.id

    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        renewalDecision: renewalDecision ?? null,
        alertState: renewalDecision ? 'ACKNOWLEDGED' : 'MONITORING'
      }
    })

    await prisma.auditLog.create({
      data: {
        contractId,
        eventType: 'decision_updated',
        metadata: { renewalDecision }
      }
    })

    res.json(contract)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router