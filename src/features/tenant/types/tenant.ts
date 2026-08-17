/** Pessoa encarregada pelo tratamento de dados pessoais (art. 41 da LGPD). */
export interface DataProtectionOfficer {
  name: string
  role: string
  blurb: string
  email: string
  phone: string
  officeHours: string
}

/**
 * Organização que opera um portal público na plataforma.
 *
 * Todo o conteúdo variável da página inicial vem daqui: é o que permite que
 * cada empresa cliente tenha o mesmo portal com a sua própria identificação.
 */
export interface Tenant {
  name: string
  /** Versão curta do nome, usada no cabeçalho em telas estreitas. */
  shortName: string
  tagline: string
  /** CNPJ, já formatado para exibição. */
  registrationId: string
  address: string
  dpo: DataProtectionOfficer
  /**
   * Exibe referências à legislação (ex.: "art. 18 da LGPD") junto às seções.
   * Corresponde ao `mostrarReferenciasLegais` do design.
   */
  showLegalReferences: boolean
}
