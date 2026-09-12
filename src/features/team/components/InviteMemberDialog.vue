<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseDialog from '@/shared/ui/BaseDialog.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import { INVITE_VALIDITY_DAYS } from '@/features/auth/constants/invitePolicy'
import { JOB_TITLES, ORGANIZATION_DOMAIN } from '@/features/team/constants/teamPolicy'
import { TeamRuleError, inviteMember, type TeamRule } from '@/features/team/services/teamService'
import type { Account } from '@/features/auth/types/auth'
import type { Invite } from '@/features/auth/types/invite'

/**
 * Convidar alguém da organização para atender. Duas fases na mesma janela:
 * o formulário e, depois do envio, o link do convite para copiar.
 */
const { by, linkOf } = defineProps<{
  by: Pick<Account, 'name' | 'email'>
  /** O endereço completo do convite — quem monta é a tela, que conhece o roteador. */
  linkOf: (invite: Invite) => string
}>()

const emit = defineEmits<{ invited: [Invite]; copy: [Invite] }>()

const open = defineModel<boolean>('open', { required: true })

const email = ref('')
const jobTitle = ref(JOB_TITLES[0]!)
const sending = ref(false)
const attempted = ref(false)
const refusal = ref<TeamRule | null>(null)
const created = ref<Invite | null>(null)

// Cada abertura começa do zero.
watch(open, (value) => {
  if (!value) return
  email.value = ''
  jobTitle.value = JOB_TITLES[0]!
  attempted.value = false
  refusal.value = null
  created.value = null
})

const REFUSALS: Record<TeamRule, string> = {
  'email-invalido': 'Confira o endereço — ele precisa ter um @ e um domínio.',
  'fora-da-organizacao': `Só endereços @${ORGANIZATION_DOMAIN} recebem convite de encarregado.`,
  'ja-e-membro': 'Esta pessoa já faz parte da equipe.',
  'convite-pendente': 'Já existe um convite válido para este endereço. Copie o link ou revogue-o antes.',
}

const emailError = computed(() => {
  if (refusal.value) return REFUSALS[refusal.value]
  if (attempted.value && email.value.trim() === '') return 'Informe o e-mail de quem será convidado.'
  return undefined
})

const jobOptions = JOB_TITLES.map((title) => ({ value: title, label: title }))

async function send() {
  if (sending.value) return
  attempted.value = true
  refusal.value = null
  if (email.value.trim() === '') return

  sending.value = true
  try {
    created.value = await inviteMember({ email: email.value, jobTitle: jobTitle.value }, by)
    emit('invited', created.value)
  } catch (error) {
    if (!(error instanceof TeamRuleError)) throw error
    refusal.value = error.rule
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    :title="created ? 'Convite enviado' : 'Convidar para a equipe'"
    width="sm"
    :locked="sending"
  >
    <template v-if="created">
      <p class="text-[15px] leading-relaxed text-ink-body">
        O convite foi enviado para <span class="font-semibold">{{ created.email }}</span> e vale
        por {{ INVITE_VALIDITY_DAYS }} dias. Se preferir, envie o link por outro canal interno.
      </p>
      <p
        class="break-all border border-line bg-surface-muted px-3.5 py-3 font-label text-sm text-ink"
        data-convite
      >
        {{ linkOf(created) }}
      </p>
    </template>

    <form
      v-else
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="send"
    >
      <p class="text-[15px] leading-relaxed text-ink-body">
        A pessoa recebe um link nominal e cria a conta com o perfil de encarregado, preso a esta
        organização. Ninguém consegue esse perfil pelo cadastro comum.
      </p>
      <BaseField
        v-model="email"
        label="E-mail institucional"
        type="email"
        autocomplete="off"
        required
        :placeholder="`nome@${ORGANIZATION_DOMAIN}`"
        :disabled="sending"
        :error="emailError"
      />
      <BaseSelect
        v-model="jobTitle"
        label="Função na equipe"
        :options="jobOptions"
        :disabled="sending"
      />
      <button
        type="submit"
        class="sr-only"
        tabindex="-1"
      >
        Enviar
      </button>
    </form>

    <template #note>
      O envio e a revogação de convites ficam registrados na trilha de auditoria.
    </template>
    <template #actions>
      <template v-if="created">
        <BaseButton
          variant="secondary"
          @click="open = false"
        >
          Fechar
        </BaseButton>
        <BaseButton @click="emit('copy', created)">
          Copiar link
        </BaseButton>
      </template>
      <template v-else>
        <BaseButton
          variant="secondary"
          :disabled="sending"
          @click="open = false"
        >
          Cancelar
        </BaseButton>
        <BaseButton
          :busy="sending"
          @click="send"
        >
          {{ sending ? 'Enviando…' : 'Enviar convite' }}
        </BaseButton>
      </template>
    </template>
  </BaseDialog>
</template>
