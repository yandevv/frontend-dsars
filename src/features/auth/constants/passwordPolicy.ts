import type { PasswordRule, PasswordStrength } from '@/features/auth/types/auth'

/** Comprimento mínimo exigido pelo RN002. */
export const PASSWORD_MIN_LENGTH = 12

/**
 * Os três critérios do RN002, na ordem em que o design os lista.
 *
 * Ficam aqui, e não dentro do formulário, porque a mesma regra vale para a
 * redefinição de senha e para o cadastro por convite.
 */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'comprimento',
    label: `Ao menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'maiuscula',
    label: 'Uma letra maiúscula',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'especial',
    label: 'Um caractere especial, como ! ? @ #',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

/** Estado da barra antes de a pessoa digitar qualquer coisa. */
export const PASSWORD_STRENGTH_EMPTY: PasswordStrength = {
  label: 'Ainda em branco',
  width: '0%',
  tone: 'idle',
}

/** Faixas de força, indexadas pelo número de critérios atendidos. */
export const PASSWORD_STRENGTH_LEVELS: readonly PasswordStrength[] = [
  { label: 'Muito fraca', width: '8%', tone: 'danger' },
  { label: 'Fraca', width: '33%', tone: 'danger' },
  { label: 'Média', width: '66%', tone: 'warning' },
  { label: 'Forte', width: '100%', tone: 'brand' },
]
