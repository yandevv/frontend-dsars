import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'

import {
  PASSWORD_RULES,
  PASSWORD_STRENGTH_EMPTY,
  PASSWORD_STRENGTH_LEVELS,
} from '@/features/auth/constants/passwordPolicy'
import type { PasswordCheck, PasswordStrength } from '@/features/auth/types/auth'

interface PasswordPolicy {
  /** Um item por critério do RN002, já com o resultado da conferência. */
  checks: ComputedRef<readonly PasswordCheck[]>
  /** Verdadeiro quando todos os critérios foram atendidos. */
  isValid: ComputedRef<boolean>
  strength: ComputedRef<PasswordStrength>
}

/**
 * Confere uma senha contra os critérios do RN002 enquanto ela é digitada.
 *
 * O design é explícito sobre isso: os critérios aparecem desde o início, e não
 * como erro depois do envio. Quem digita vê o que falta antes de tentar.
 */
export function usePasswordPolicy(password: MaybeRefOrGetter<string>): PasswordPolicy {
  const checks = computed<readonly PasswordCheck[]>(() => {
    const value = toValue(password)
    return PASSWORD_RULES.map(({ id, label, test }) => ({ id, label, met: test(value) }))
  })

  const isValid = computed(() => checks.value.every((check) => check.met))

  const strength = computed<PasswordStrength>(() => {
    if (toValue(password).length === 0) return PASSWORD_STRENGTH_EMPTY

    const met = checks.value.filter((check) => check.met).length
    // `met` vai de 0 a PASSWORD_RULES.length, e há uma faixa para cada valor.
    return PASSWORD_STRENGTH_LEVELS[met] ?? PASSWORD_STRENGTH_EMPTY
  })

  return { checks, isValid, strength }
}
