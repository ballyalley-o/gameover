import { transl } from "./transl"


export const normalize = (text: string) => {
    if (!text) throw new Error(transl('validation.default.required', { field: 'text' }))
    const cleanedText = String(text.trim().toLowerCase())
    return cleanedText
}