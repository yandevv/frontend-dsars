import type { AccountRole } from '@/features/auth/types/auth'
import type { AppArea } from '@/shared/layout/types'

/**
 * As duas áreas autenticadas, transcritas dos cabeçalhos do design.
 *
 * Os rótulos de perfil são neutros de propósito: "encarregada de dados" no
 * mockup descreve a pessoa que ocupava o cargo naquele quadro, e o sistema não
 * tem como saber quem o ocupará.
 */
export const APP_AREAS: Record<AccountRole, AppArea> = {
  titular: {
    subtitle: 'Portal do titular de dados',
    roleLabel: 'Titular de dados',
    nav: [
      { label: 'Minhas requisições', to: { name: 'my-requests' } },
      { label: 'Meus dados', to: { name: 'my-data' } },
      { label: 'Ajuda', to: { name: 'help' } },
    ],
    accountLinks: [
      { label: 'Dados pessoais', to: { name: 'my-data' } },
      { label: 'Configurações da conta', to: { name: 'settings' } },
      { label: 'Preferências de notificação', to: { name: 'notification-settings' } },
    ],
  },
  encarregado: {
    subtitle: 'Área do encarregado de proteção de dados',
    roleLabel: 'Encarregado de proteção de dados',
    nav: [
      { label: 'Fila de atendimento', to: { name: 'request-queue' } },
      { label: 'Relatórios', to: { name: 'management-report' } },
      { label: 'Registros de auditoria', to: { name: 'audit-log' } },
      { label: 'Ajuda', to: { name: 'help' } },
    ],
    accountLinks: [
      { label: 'Minha conta', to: { name: 'settings' } },
      { label: 'Equipe e permissões', to: { name: 'team' } },
      { label: 'Preferências de notificação', to: { name: 'notification-settings' } },
    ],
  },
}
