const KB = 1024
const MB = KB * 1024

/**
 * Tamanho de arquivo em português — "860 KB", "1,2 MB".
 *
 * O separador decimal vem do locale, e não de um `replace`: é a mesma vírgula
 * que o resto do portal usa para números.
 */
export function formatBytes(bytes: number): string {
  if (bytes >= MB) {
    return `${(bytes / MB).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
  }
  return `${Math.max(1, Math.round(bytes / KB)).toLocaleString('pt-BR')} KB`
}
