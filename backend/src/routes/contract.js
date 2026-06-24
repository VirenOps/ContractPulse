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


router.patch('/:id/decision', async (req, res) => {
  const { renewalDecision } = req.body; // could be 'RENEW', 'TERMINATE', or null
  const contractId = req.params.id;

  // 1. Update the record field in your SQL/Supabase database
  const { data, error } = await supabase
    .from('contracts')
    .update({ renewalDecision })
    .eq('id', contractId)
    .select()
    .single();

  // 2. 🧠 CRITICAL BACKGROUND ENGINE LOOP RESTORATION
  if (renewalDecision === null) {
    // If the operator changed their mind and wiped the decision,
    // you must recreate the BullMQ delayed background cron warning alert!
    await alertQueue.add('send-deadline-warning', 
      { contractId }, 
      { delay: calculateTargetDelay(data.noticeDeadline) }
    );
  } else {
    // If they picked an option, remove any active delayed warning jobs
    await removeActiveDelayedJobs(contractId);
  }

  res.json(data);
});

export default router