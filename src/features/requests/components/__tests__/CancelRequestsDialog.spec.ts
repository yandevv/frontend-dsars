import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import CancelRequestsDialog from "../CancelRequestsDialog.vue";
import { titularRequests } from "@/test/factories";

const open = titularRequests().filter((request) => request.status === "aberta");

async function render(props: { mode: "individual" | "lote"; count?: number; sending?: boolean }) {
  const wrapper = mount(CancelRequestsDialog, {
    attachTo: document.body,
    props: {
      open: false,
      "onUpdate:open": () => {},
      requests: open.slice(0, props.count ?? (props.mode === "lote" ? 3 : 1)),
      mode: props.mode,
      sending: props.sending ?? false,
    },
  });
  // Abre depois de montar, como a tela faz: é a abertura que zera o formulário.
  await wrapper.setProps({ open: true });
  await nextTick();
  return wrapper;
}

function dialog(): HTMLElement {
  return document.body.querySelector('[role="dialog"]') as HTMLElement;
}

function button(label: string): HTMLButtonElement {
  return Array.from(dialog().querySelectorAll("button")).find((item) =>
    item.textContent?.includes(label),
  ) as HTMLButtonElement;
}

async function type(text: string) {
  const textarea = dialog().querySelector("textarea")!;
  textarea.value = text;
  textarea.dispatchEvent(new Event("input"));
  await nextTick();
}

async function acknowledge() {
  const box = dialog().querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  box.click();
  await nextTick();
}

describe("CancelRequestsDialog", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("no lote, lista as requisições e conta quantas serão canceladas", async () => {
    await render({ mode: "lote" });

    expect(dialog().textContent).toContain("Cancelamento em lote");
    expect(dialog().textContent).toContain("Cancelar 3 requisições?");
    for (const request of open) expect(dialog().textContent).toContain(request.protocol);
    expect(button("Confirmar cancelamento das 3")).toBeDefined();
  });

  it("no individual, cita o protocolo no título", async () => {
    await render({ mode: "individual" });

    expect(dialog().textContent).toContain("Cancelamento individual");
    expect(dialog().textContent).toContain(`Cancelar a requisição ${open[0]!.protocol}?`);
  });

  it("não confirma sem motivo e sem a ciência de que é definitivo", async () => {
    const wrapper = await render({ mode: "lote" });

    button("Confirmar cancelamento").click();
    await nextTick();

    expect(wrapper.emitted("confirm")).toBeUndefined();
    expect(dialog().textContent).toContain("Escreva pelo menos 10 caracteres.");
    expect(dialog().textContent).toContain("A confirmação é obrigatória.");
  });

  it("recusa um motivo curto demais mesmo com a ciência marcada", async () => {
    const wrapper = await render({ mode: "individual" });

    await type("não quero");
    await acknowledge();
    button("Confirmar cancelamento").click();
    await nextTick();

    expect(wrapper.emitted("confirm")).toBeUndefined();
  });

  it("entrega o motivo sem espaços nas pontas", async () => {
    const wrapper = await render({ mode: "lote" });

    await type("  Consegui os documentos direto na unidade Centro.  ");
    await acknowledge();
    button("Confirmar cancelamento").click();
    await nextTick();

    expect(wrapper.emitted("confirm")?.[0]).toEqual([
      "Consegui os documentos direto na unidade Centro.",
    ]);
  });

  it("começa em branco a cada abertura", async () => {
    const wrapper = await render({ mode: "individual" });
    await type("Um motivo que foi desistido.");

    await wrapper.setProps({ open: false });
    await wrapper.setProps({ open: true });
    await nextTick();

    expect(dialog().querySelector("textarea")!.value).toBe("");
  });

  it("durante o envio mostra o progresso e trava o fechar", async () => {
    await render({ mode: "lote", sending: true });

    expect(button("Cancelando 3…")).toBeDefined();
    expect(button("Manter requisição").disabled).toBe(true);
  });
});
