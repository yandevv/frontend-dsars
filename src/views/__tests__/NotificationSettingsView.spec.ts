import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import NotificationSettingsView from "../NotificationSettingsView.vue";

vi.mock("@/features/auth/services/fakeNetwork", () => ({ delay: () => Promise.resolve() }));

vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => ({ fullPath: "/configuracoes/notificacoes", query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn<() => void>() }),
  onBeforeRouteLeave: vi.fn<() => void>(),
}));

async function render() {
  const wrapper = mount(NotificationSettingsView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await flushPromises();
  return wrapper;
}

function switchFor(wrapper: Awaited<ReturnType<typeof render>>, label: string) {
  return wrapper.get(`button[role="switch"][aria-label="${label}"]`);
}

function button(wrapper: Awaited<ReturnType<typeof render>>, text: string) {
  return wrapper.findAll("button").find((b) => b.text() === text)!;
}

describe("NotificationSettingsView", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("mostra os eventos do titular com as linhas obrigatórias travadas no e-mail", async () => {
    const wrapper = await render();

    expect(wrapper.text()).toContain("Pesquisa de satisfação");
    expect(wrapper.text()).not.toContain("Relatório mensal disponível");
    expect(switchFor(wrapper, "E-mail para Segurança da conta").attributes("aria-disabled")).toBe("true");
    expect(switchFor(wrapper, "SMS para Segurança da conta").attributes("aria-disabled")).toBeUndefined();
  });

  it("só habilita salvar depois de uma mudança e conta o que falta salvar", async () => {
    const wrapper = await render();

    expect(button(wrapper, "Salvar preferências").attributes("disabled")).toBeDefined();
    await switchFor(wrapper, "SMS para Prazo próximo do vencimento").trigger("click");

    expect(wrapper.text()).toContain("1 alteração ainda não salva.");
    expect(button(wrapper, "Salvar preferências").attributes("disabled")).toBeUndefined();
  });

  it("salva depois da confirmação", async () => {
    const wrapper = await render();

    await switchFor(wrapper, "E-mail para Pesquisa de satisfação").trigger("click");
    await button(wrapper, "Salvar preferências").trigger("click");
    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain("1 canal muda de estado.");
    Array.from(dialog.querySelectorAll("button"))
      .find((b) => b.textContent?.includes("Salvar preferências"))!
      .click();
    await flushPromises();

    expect(wrapper.text()).toContain("Preferências de notificação salvas.");
    expect(switchFor(wrapper, "E-mail para Pesquisa de satisfação").attributes("aria-checked")).toBe("true");
  });

  it("restaurar o padrão muda a matriz, mas só vale ao salvar", async () => {
    const wrapper = await render();

    await switchFor(wrapper, "No portal para Prazo próximo do vencimento").trigger("click");
    await button(wrapper, "Restaurar padrão").trigger("click");

    expect(wrapper.text()).toContain("Salve para que passe a valer.");
    expect(switchFor(wrapper, "No portal para Prazo próximo do vencimento").attributes("aria-checked")).toBe("true");
  });
});
