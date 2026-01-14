export const REGEX = {
  EMAIL        : /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
  PASSWORD     : /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).{8,}$/,
  PHONE        : /^[0-9]{10,11}$/,
  URL          : /^(http|https):\/\/[^ "]+$/,
  DATE         : /\d{4}-\d{2}-\d{2}/,
  NUM          : /\d+/,
  ALL_CAPS     : /[A-Z]/,
  ALL_LOWERCASE: /[a-z]/,
  NON_ALPHA_NUM: /[^A_Za-z0-9]/
} as const

export type RegexKey = keyof typeof REGEX
