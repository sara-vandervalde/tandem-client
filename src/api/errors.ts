import axios from 'axios'

// The server returns ProblemDetails: { title } for business errors,
// and { errors: { Field: [messages] } } for validation errors (400).
type ProblemDetails = {
  title?: string
  status?: number
  errors?: Record<string, string[]>
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ProblemDetails>(error)) {
    if (!error.response) {
      return 'אין חיבור לשרת. בדקי את החיבור ונסי שוב.'
    }
    const data = error.response.data
    const firstValidation = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    return firstValidation ?? data?.title ?? 'משהו השתבש. נסי שוב.'
  }
  return 'משהו השתבש. נסי שוב.'
}

// Validation messages per field, keys in camelCase to match our form fields
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ProblemDetails>(error) || !error.response?.data?.errors) {
    return {}
  }
  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(error.response.data.errors)) {
    const key = field.charAt(0).toLowerCase() + field.slice(1)
    result[key] = messages[0]
  }
  return result
}
