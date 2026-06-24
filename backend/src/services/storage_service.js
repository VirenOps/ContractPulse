import { createClient } from '@supabase/supabase-js'
 

console.log('SUPABASE_URL:', process.env.SUPABASE_URL)
console.log('SUPABASE_BUCKET:', process.env.SUPABASE_BUCKET)


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const BUCKET = process.env.SUPABASE_BUCKET

export const uploadPDF = async (buffer, filename) => {
  const path = `pdfs/${Date.now()}-${filename}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'application/pdf' })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export const downloadPDF = async (pdfUrl) => {
  const path = pdfUrl.split(`/storage/v1/object/public/${BUCKET}/`)[1]

  const { data, error } = await supabase.storage.from(BUCKET).download(path)
  if (error) throw new Error(`Download failed: ${error.message}`)

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}