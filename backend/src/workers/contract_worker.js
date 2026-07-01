import { Worker } from 'bullmq'
import { connection } from '../lib/queue.js'
import prisma from '../lib/prisma.js'
import { extractPdfText } from '../services/pdf_service.js'
import { runRegexParser } from '../services/parser_service.js'
import { runLLMParser } from '../services/llm_service.js'
import { scheduleAlertJobs } from './escalation_worker.js'

new Worker('contract-processing', async (job) => {
  const { contractId } = job.data
  console.log(`Processing contract ${contractId}`)

  await prisma.contract.update({
    where: { id: contractId },
    data: { processingStatus: 'PROCESSING' }
  })

  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId }
    })

    // Step 1 — Extract text from PDF
    const rawText = await extractPdfText(contract.pdfUrl)

    // Step 2 — Regex pass (fast, free)
    const regexResults = runRegexParser(rawText)
    console.log('Regex results:', regexResults)

    // Step 3 — LLM pass (fills everything regex missed)
    const llmResults = await runLLMParser(rawText, regexResults)
    console.log('LLM results:', llmResults)

    // Step 4 — Merge — regex wins on fields it found
    const final = {
      ...llmResults,
      ...(regexResults.noticeRequiredDays && { noticeRequiredDays: regexResults.noticeRequiredDays }),
      ...(regexResults.autoRenews !== undefined && { autoRenews: regexResults.autoRenews })
    }
    console.log('Final merged results:', final)

    // Step 5 — Compute notice deadline
    let noticeDeadline = null
    if (final.endDate && final.noticeRequiredDays) {
      noticeDeadline = new Date(final.endDate)
      noticeDeadline.setDate(noticeDeadline.getDate() - final.noticeRequiredDays)
    }
    console.log('Notice deadline:', noticeDeadline)

    // Step 6 — Save everything to DB
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        rawText,
        extractedData: final,
        title: final.title ?? null,
        vendorName: final.vendorName ?? null,
        contractType: final.contractType ?? null,
        totalValue: final.totalValue ?? null,
        currency: final.currency ?? 'INR',
        startDate: final.startDate ? new Date(final.startDate) : null,
        endDate: final.endDate ? new Date(final.endDate) : null,
        autoRenews: final.autoRenews ?? false,
        noticeRequiredDays: final.noticeRequiredDays ?? null,
        noticeDeadline,
        processingStatus: 'PROCESSED'
      }
    })

    // Step 7 — Write to audit log
    await prisma.auditLog.create({
      data: {
        contractId,
        eventType: 'contract_processed',
        metadata: { fieldsExtracted: Object.keys(final) }
      }
    })

    // Step 8 — Schedule escalation alert jobs
    if (noticeDeadline) {
      await scheduleAlertJobs(contractId, noticeDeadline)
    } else {
      console.warn(`No noticeDeadline computed for contract ${contractId} — skipping alert scheduling`)
    }

    console.log(`Contract ${contractId} processed successfully`)

  } catch (err) {
    console.error(`Failed to process contract ${contractId}:`, err)

    await prisma.contract.update({
      where: { id: contractId },
      data: { processingStatus: 'FAILED' }
    })

    await prisma.auditLog.create({
      data: {
        contractId,
        eventType: 'processing_failed',
        metadata: { error: err.message }
      }
    })

    throw err
  }

}, { connection })

console.log('Contract worker started')