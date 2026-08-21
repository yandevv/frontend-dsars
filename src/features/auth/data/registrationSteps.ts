/** Etapa do "O que acontece depois", ao lado do formulário de cadastro. */
export interface RegistrationStep {
  number: string
  description: string
}

export const REGISTRATION_STEPS: readonly RegistrationStep[] = [
  {
    number: '01',
    description:
      'Enviamos um link de confirmação para o seu e-mail. A conta fica pendente até você abrir esse link.',
  },
  {
    number: '02',
    description:
      'Com o e-mail confirmado, você já pode registrar um pedido e acompanhar o prazo de resposta.',
  },
  {
    number: '03',
    description:
      'Documento de identificação e telefone são opcionais e ficam nas configurações da sua conta, quando você quiser.',
  },
]
