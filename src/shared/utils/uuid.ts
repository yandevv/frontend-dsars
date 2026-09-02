/**
 * Identificador UUID versão 7 (RFC 9562).
 *
 * Os primeiros 48 bits são o instante em milissegundos, o que deixa os
 * identificadores ordenáveis pela data de criação; o resto é aleatório. É o
 * formato que a requisição usa nas URLs, separado do protocolo: o protocolo é o
 * que a pessoa lê e cita, o identificador é o que o sistema referencia.
 *
 * Quando houver servidor, é ele quem gera — esta função cobre o protótipo.
 */
export function uuidv7(now: number = Date.now()): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // 48 bits de timestamp, do byte mais significativo ao menos.
  let time = now
  for (let index = 5; index >= 0; index--) {
    bytes[index] = time % 256
    time = Math.floor(time / 256)
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x70 // versão 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80 // variante RFC 9562

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export function isUuidV7(value: string): boolean {
  return UUID_V7.test(value)
}
