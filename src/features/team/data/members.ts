import { ANALYSTS, DPO_NAME } from '@/features/requests/data/team'
import { daysFromNow } from '@/shared/utils/date'
import type { TeamMember } from '@/features/team/types/team'

const [BEATRIZ, CAIO] = ANALYSTS

/**
 * A equipe de atendimento do Instituto Meridiano. Os nomes são os de
 * `features/requests/data/team.ts`, que a fila usa como responsáveis; os
 * endereços seguem o domínio da organização.
 */
export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    name: DPO_NAME,
    email: 'helena.vasconcelos@meridianosaude.org.br',
    jobTitle: 'Encarregada de proteção de dados (DPO)',
    lead: true,
    joinedAt: daysFromNow(-14),
    lastAccessAt: daysFromNow(0),
  },
  {
    name: BEATRIZ,
    email: 'beatriz.falcao@meridianosaude.org.br',
    jobTitle: 'Analista de atendimento',
    joinedAt: daysFromNow(-13),
    lastAccessAt: daysFromNow(-1),
  },
  {
    name: CAIO,
    email: 'caio.salgado@meridianosaude.org.br',
    jobTitle: 'Analista de atendimento',
    joinedAt: daysFromNow(-10),
    lastAccessAt: daysFromNow(-4),
  },
]
