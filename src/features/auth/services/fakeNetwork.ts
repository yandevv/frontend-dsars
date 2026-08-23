/**
 * Espera curta que representa a ida ao servidor, enquanto não há servidor.
 *
 * Sem ela os estados "Entrando…" e "Criando conta…" apareceriam e sumiriam no
 * mesmo quadro, e o design trata esses estados como parte do fluxo: são eles
 * que travam os campos e impedem um segundo envio.
 */
export const NETWORK_DELAY_MS = 900

export function delay(ms: number = NETWORK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
