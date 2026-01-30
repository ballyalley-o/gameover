
export const toNumber = (value: number | null | undefined) => (typeof value === 'number' ? value : 0)

export const stringToNumber = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value)
  return 0
}
