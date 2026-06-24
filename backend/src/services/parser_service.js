export const runRegexParser = (text) => {
  const results = {}

  // Notice period — catches "90 days prior", "60 days before"
  const noticeMatch = text.match(
    /(\d+)\s*(?:\(\d+\))?\s*days?\s*(?:prior\s+to|before|in\s+advance)/i
  )
  if (noticeMatch) results.noticeRequiredDays = parseInt(noticeMatch[1])

  // Auto renewal
  if (/automatically\s+renew|auto[\s-]?renew/i.test(text)) {
    results.autoRenews = true
  }

  // Currency amounts
  const amounts = text.match(/(?:₹|INR\s*|USD\s*|\$)\s*[\d,]+(?:\.\d{2})?/g)
  if (amounts) results.amountsFound = amounts

  return results
}