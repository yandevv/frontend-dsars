<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseDialog from '@/shared/ui/BaseDialog.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import { INVITE_VALIDITY_DAYS } from '@/features/auth/constants/invitePolicy'
import { JOB_TITLES } from '@/features/team/constants/teamPolicy'
import { TeamRuleError, inviteMember, type TeamRule } from '@/features/team/services/teamService'
import { messageOf } from '@/shared/api/ApiError'
import type { Account } from '@/features/auth/types/auth'
import type { Invite } from '@/features/auth/types/invite'

/**
 * Convidar alguém para atender pela organização. Duas fases na mesma janela:
 * o formulário e, depois do envio, a confirmação.
 */
const { by } = defineProps<{ by: Pick<Account, 'name' | 'email'> }>()

const emit = defineEmits<{ invited: [Invite] }>()

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
  'ja-e-membro': 'Esta pessoa já faz parte da equipe.',
}
const failure = ref('')

const emailError = computed(() => {
  if (refusal.value) return REFUSALS[refusal.value]
  if (failure.value) return failure.value
  if (attempted.value && email.value.trim() === '') return 'Informe o e-mail de quem será convidado.'
  return undefined
})

const jobOptions = JOB_TITLES.map((title) => ({ value: title, label: title }))

async function send() {
  if (sending.value) return
  attempted.value = true
  refusal.value = null
  failure.value = ''
  if (email.value.trim() === '') return

  sending.value = true
  try {
    created.value = await inviteMember({ email: email.value, jobTitle: jobTitle.value }, by)
    emit('invited', created.value)
  } catch (error) {
    if (error instanceof TeamRuleError) refusal.value = error.rule
    else failure.value = messageOf(error)
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
        por {{ INVITE_VALIDITY_DAYS }} dias. O link nominal chega por e-mail; para aceitar, a
        pessoa entra com a conta desse endereço.
      </p>
    </template>

    <form
      v-else
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="send"
    >
      <p class="text-[15px] leading-relaxed text-ink-body">
        A pessoa recebe um link nominal e, ao aceitá-lo com a conta desse endereço, passa a
        responder como encarregado desta organização. Ninguém consegue esse perfil pelo cadastro
        comum.
      </p>
      <BaseField
        v-model="email"
        label="E-mail institucional"
        type="email"
        autocomplete="off"
        required
        placeholder="nome@organizacao.com.br"
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
      O envio de convites fica registrado na trilha de auditoria.
    </template>
    <template #actions>
      <template v-if="created">
        <BaseButton @click="open = false">
          Fechar
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
