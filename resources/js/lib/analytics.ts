type LeadGenerationMethod = 'contact_form' | 'consultation_booking'

type GenerateLeadParameters = {
  method: LeadGenerationMethod
}

type Gtag = (
  command: 'event',
  eventName: 'generate_lead',
  parameters: GenerateLeadParameters,
) => void

declare global {
  interface Window {
    gtag?: Gtag
  }
}

export function trackLeadConversion(method: LeadGenerationMethod): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return

  window.gtag('event', 'generate_lead', { method })
}
