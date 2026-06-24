import pdfParse from 'pdf-parse'
import { downloadPDF } from './storage_service.js'

export const extractPdfText = async (pdfUrl) => {
  const buffer = await downloadPDF(pdfUrl)
  const data = await pdfParse(buffer)
  return data.text
}