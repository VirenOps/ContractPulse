import { Worker } from 'bullmq'
import { connection } from '../lib/queue.js'
import prisma from '../lib/prisma.js'
import { extractPdfText } from '../services/pdf_service.js'
import { runRegexParser } from '../services/parser_service.js'

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

    // Extract text from PDF
    const rawText = await extractPdfText(contract.pdfUrl)

    // Run regex parser
    const regexResults = runRegexParser(rawText)

    // Compute notice deadline if we have the data
    let noticeDeadline = null
    if (contract.endDate && regexResults.noticeRequiredDays) {
      noticeDeadline = new Date(contract.endDate)
      noticeDeadline.setDate(noticeDeadline.getDate() - regexResults.noticeRequiredDays)
    }

    // Save extracted data
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        rawText,
        extractedData: regexResults,
        autoRenews: regexResults.autoRenews ?? false,
        noticeRequiredDays: regexResults.noticeRequiredDays ?? null,
        noticeDeadline,
        processingStatus: 'PROCESSED'
      }
    })

    // Write to audit log
    await prisma.auditLog.create({
      data: {
        contractId,
        eventType: 'contract_processed',
        metadata: { fieldsExtracted: Object.keys(regexResults) }
      }
    })

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