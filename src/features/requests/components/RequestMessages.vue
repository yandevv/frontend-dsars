<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";

import AttachmentPicker from "@/features/requests/components/AttachmentPicker.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import BasePanel from "@/shared/ui/BasePanel.vue";
import BaseTextarea from "@/shared/ui/BaseTextarea.vue";
import {
  MESSAGE_EDIT_WINDOW_MINUTES,
  MESSAGE_MAX_LENGTH,
} from "@/features/requests/constants/requestPolicy";
import { canEditMessage } from "@/features/requests/utils/messages";
import { formatDateTime } from "@/shared/utils/date";
import type {
  MessageKind,
  RequestAttachment,
  RequestMessage,
} from "@/features/requests/types/request";

/**
 * A conversa da requisição (RF006 / RF012 / RF013 / RF014).
 *
 * É onde a equipe pede esclarecimentos e o titular responde, sem e-mail solto
 * no meio do caminho. Ordem cronológica, do primeiro ao último envio; editada
 * aparece marcada, excluída some — as duas continuam na trilha de auditoria.
 *
 * Quem pode o quê fica todo aqui: editar e excluir só a própria mensagem,
 * editar só na primeira meia hora, e nada disso depois que a requisição fecha.
 */
const {
  messages,
  open,
  mode = "mensagem",
  sending = false,
} = defineProps<{
  messages: readonly RequestMessage[];
  /** Requisição em aberto: aceita mensagens novas, edições e exclusões. */
  open: boolean;
  /**
   * `complemento` prepara o campo para pedir uma informação ao titular. Sai
   * como mensagem comum: a requisição continua aberta e o prazo, correndo.
   */
  mode?: "mensagem" | "complemento";
  sending?: boolean;
}>();

const emit = defineEmits<{
  send: [message: { text: string; attachments: RequestAttachment[] }];
  edit: [change: { id: string; text: string }];
  remove: [id: string];
  download: [attachmentId: string];
  "cancel-complement": [];
}>();

// ── Leitura ──────────────────────────────────────────────────────────────────
const shown = computed(() => [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt)));

/** O relógio anda: o botão de editar some sozinho quando a meia hora acaba. */
const now = ref(new Date());
let clock: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  clock = setInterval(() => (now.value = new Date()), 30_000);
});
onBeforeUnmount(() => clearInterval(clock));

function mine(message: RequestMessage): boolean {
  return message.mine;
}

function authorLabel(message: RequestMessage): string {
  return mine(message) ? "Você" : message.author;
}

function roleLabel(message: RequestMessage): string {
  return message.authorRole === "titular" ? "Titular" : "Equipe de atendimento";
}

const KIND_LABELS: Record<MessageKind, string | null> = {
  mensagem: null,
  parecer: "Parecer final",
};

function canEdit(message: RequestMessage): boolean {
  return open && mine(message) && message.kind !== "parecer" && canEditMessage(message, now.value);
}

function canRemove(message: RequestMessage): boolean {
  return open && mine(message) && message.kind !== "parecer";
}

// ── Edição (confirmada antes de valer) ───────────────────────────────────────
const editing = ref<string | null>(null);
const draft = ref("");
const confirmEdit = ref(false);

const editingMessage = computed(() => shown.value.find((message) => message.id === editing.value));

function startEdit(message: RequestMessage) {
  editing.value = message.id;
  draft.value = message.text;
}

function stopEdit() {
  editing.value = null;
  draft.value = "";
  confirmEdit.value = false;
}

const draftError = computed(() => {
  const text = draft.value.trim();
  if (text.length === 0 && (editingMessage.value?.attachments.length ?? 0) === 0) {
    return "Escreva o novo texto ou exclua a mensagem.";
  }
  return undefined;
});

function askEditConfirmation() {
  if (draftError.value || draft.value.trim() === editingMessage.value?.text) return;
  confirmEdit.value = true;
}

function saveEdit() {
  if (!editing.value) return;
  emit("edit", { id: editing.value, text: draft.value.trim() });
  stopEdit();
}

// Mensagem que saiu da lista enquanto era editada: nada a salvar.
watch(shown, (list) => {
  if (editing.value && !list.some((message) => message.id === editing.value)) stopEdit();
});

// ── Exclusão (sempre confirmada) ─────────────────────────────────────────────
const removing = ref<RequestMessage | null>(null);
const confirmRemove = computed({
  get: () => removing.value !== null,
  set: (value) => {
    if (!value) removing.value = null;
  },
});

function remove() {
  if (!removing.value) return;
  emit("remove", removing.value.id);
  removing.value = null;
}

// ── Composição ───────────────────────────────────────────────────────────────
const text = ref("");
const attachments = ref<RequestAttachment[]>([]);
const attempted = ref(false);
const field = useTemplateRef<InstanceType<typeof BaseTextarea>>("field");

const complement = computed(() => mode === "complemento");
const composeError = computed(() =>
  attempted.value && text.value.trim().length === 0 && attachments.value.length === 0
    ? "Escreva a mensagem ou anexe um arquivo."
    : undefined,
);

function send() {
  if (sending) return;
  attempted.value = true;
  if (composeError.value) return;
  emit("send", { text: text.value.trim(), attachments: [...attachments.value] });
}

/** Chamado pela tela depois que o servidor aceitou a mensagem. */
function reset() {
  text.value = "";
  attachments.value = [];
  attempted.value = false;
}

defineExpose({ focus: () => field.value?.focus(), reset });
</script>

<template>
  <BasePanel eyebrow="Mensagens">
    <p v-if="shown.length === 0" class="px-[22px] py-5 text-[15px] leading-relaxed text-ink-soft">
      Nenhuma mensagem ainda. Dúvidas, pedidos de complemento e respostas aparecem aqui, na ordem em
      que forem enviados.
    </p>

    <ol v-else>
      <li
        v-for="message in shown"
        :key="message.id"
        class="flex flex-col gap-2.5 border-b border-line-soft px-[22px] py-[18px] last:border-b-0"
        :class="[
          message.authorRole === 'encarregado' ? 'bg-surface' : 'bg-surface-subtle',
          message.kind === 'parecer' ? 'border-l-[3px] border-l-brand' : '',
        ]"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span class="text-[15px] font-semibold text-ink">{{ authorLabel(message) }}</span>
            <span class="text-[13px] text-ink-muted">{{ roleLabel(message) }}</span>
            <span
              v-if="KIND_LABELS[message.kind]"
              class="font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-brand"
            >
              {{ KIND_LABELS[message.kind] }}
            </span>
          </p>
          <p class="text-[13px] text-ink-muted">
            <time :datetime="message.sentAt">{{ formatDateTime(message.sentAt) }}</time>
            <span v-if="message.editedAt" class="ml-2 italic">· editada</span>
          </p>
        </div>

        <!-- Editando: o texto vira campo, e salvar ainda passa pela confirmação. -->
        <div v-if="editing === message.id" class="flex flex-col gap-3">
          <BaseTextarea
            v-model="draft"
            label="Novo texto da mensagem"
            :rows="3"
            :maxlength="MESSAGE_MAX_LENGTH"
            :error="draftError"
            :hint="`A edição fica disponível por ${MESSAGE_EDIT_WINDOW_MINUTES} minutos após o envio.`"
          />
          <div class="flex flex-wrap gap-2.5">
            <BaseButton size="sm" @click="askEditConfirmation">Salvar alteração</BaseButton>
            <BaseButton size="sm" variant="secondary" @click="stopEdit">Descartar</BaseButton>
          </div>
        </div>

        <p
          v-else-if="message.text"
          class="max-w-[76ch] whitespace-pre-line text-base leading-relaxed text-ink-body"
        >
          {{ message.text }}
        </p>

        <ul v-if="message.attachments.length > 0" class="flex flex-col gap-2">
          <li
            v-for="attachment in message.attachments"
            :key="attachment.name"
            class="flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-4 py-2.5"
          >
            <span class="flex flex-col gap-0.5">
              <span class="text-[15px] font-semibold text-ink">{{ attachment.name }}</span>
              <span class="text-[13px] text-ink-muted">{{ attachment.meta }}</span>
            </span>
            <button
              v-if="attachment.id"
              type="button"
              class="text-[15px] font-medium text-brand underline-offset-4 hover:underline"
              @click="emit('download', attachment.id)"
            >
              Baixar<span class="sr-only"> {{ attachment.name }}</span>
            </button>
          </li>
        </ul>

        <div
          v-if="editing !== message.id && (canEdit(message) || canRemove(message))"
          class="flex flex-wrap gap-4"
        >
          <button
            v-if="canEdit(message)"
            type="button"
            class="py-1 text-sm font-medium text-brand underline hover:text-brand-strong"
            @click="startEdit(message)"
          >
            Editar
          </button>
          <button
            v-if="canRemove(message)"
            type="button"
            class="py-1 text-sm font-medium text-danger underline hover:text-danger-strong"
            @click="removing = message"
          >
            Excluir
          </button>
        </div>
      </li>
    </ol>

    <!-- Encerrada: a conversa fica, a caixa de envio sai. -->
    <p
      v-if="!open"
      class="border-t border-line bg-surface-muted px-[22px] py-4 text-sm leading-normal text-ink-soft"
    >
      A requisição foi encerrada: a conversa fica disponível para leitura, mas não recebe novas
      mensagens. Para um assunto novo, registre uma nova requisição.
    </p>

    <form
      v-else
      novalidate
      class="flex flex-col gap-4 border-t px-[22px] pb-6 pt-5"
      :class="complement ? 'border-pending-line bg-pending-wash' : 'border-line bg-surface-subtle'"
      @submit.prevent="send"
    >
      <BaseTextarea
        ref="field"
        v-model="text"
        :label="complement ? 'Pedido de complemento ao titular' : 'Nova mensagem'"
        :description="
          complement
            ? 'Diga exatamente o que falta para decidir. O titular recebe a mensagem no portal e pode responder pela própria requisição — o prazo legal continua correndo.'
            : undefined
        "
        :rows="complement ? 4 : 3"
        :maxlength="MESSAGE_MAX_LENGTH"
        :disabled="sending"
        :error="composeError"
        hint="Texto, anexo ou os dois."
        :placeholder="
          complement
            ? 'Ex.: precisamos de uma foto legível do documento de identidade, frente e verso.'
            : 'Escreva sua mensagem.'
        "
      />
      <AttachmentPicker
        v-model="attachments"
        label="Anexos da mensagem"
        prompt="Anexar arquivos"
        empty-hint="Nenhum arquivo anexado."
        :disabled="sending"
      />
      <div class="flex flex-wrap items-center justify-end gap-2.5">
        <BaseButton
          v-if="complement"
          variant="secondary"
          :disabled="sending"
          @click="emit('cancel-complement')"
        >
          Voltar à mensagem comum
        </BaseButton>
        <BaseButton type="submit" :busy="sending">
          {{
            sending ? "Enviando…" : complement ? "Enviar pedido de complemento" : "Enviar mensagem"
          }}
        </BaseButton>
      </div>
    </form>
  </BasePanel>

  <BaseDialog v-model:open="confirmEdit" title="Salvar a alteração da mensagem?" width="sm">
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-1 border-l-[3px] border-line py-1 pl-4">
        <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
          Texto atual
        </p>
        <p class="whitespace-pre-line text-[15px] leading-normal text-ink-soft">
          {{ editingMessage?.text }}
        </p>
      </div>
      <div class="flex flex-col gap-1 border-l-[3px] border-brand py-1 pl-4">
        <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-brand">
          Novo texto
        </p>
        <p class="whitespace-pre-line text-[15px] leading-normal text-ink-body">
          {{ draft.trim() }}
        </p>
      </div>
    </div>
    <template #note>
      A conversa passa a mostrar a mensagem como editada, e o texto anterior fica na trilha de
      auditoria.
    </template>
    <template #actions>
      <BaseButton variant="secondary" @click="confirmEdit = false">Continuar editando</BaseButton>
      <BaseButton @click="saveEdit">Salvar alteração</BaseButton>
    </template>
  </BaseDialog>

  <BaseDialog
    v-model:open="confirmRemove"
    title="Excluir esta mensagem?"
    eyebrow="Exclusão de mensagem"
    tone="danger"
    width="sm"
  >
    <p class="whitespace-pre-line border-l-[3px] border-line py-1 pl-4 text-[15px] text-ink-soft">
      {{ removing?.text || "Mensagem só com anexo." }}
    </p>
    <p class="text-[15px] leading-relaxed text-ink-body">
      A mensagem deixa de aparecer para todos os participantes. O conteúdo continua registrado na
      trilha de auditoria, como exige a prestação de contas.
    </p>
    <template #actions>
      <BaseButton variant="secondary" @click="removing = null">Manter mensagem</BaseButton>
      <BaseButton variant="danger" @click="remove">Excluir mensagem</BaseButton>
    </template>
  </BaseDialog>
</template>
