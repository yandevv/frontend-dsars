import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import SecuritySettingsView from "../SecuritySettingsView.vue";

vi.mock("@/features/auth/services/fakeNetwork", () => ({ delay: () => Promise.resolve() }));

vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => ({ fullPath: "/configuracoes/seguranca", query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn<() => void>() }),
}));

async function render() {
  const wrapper = mount(SecuritySettingsView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await flushPromises();
  return wrapper;
}

function dialog(): HTMLElement {
  return document.body.querySelector('[role="dialog"]') as HTMLElement;
}

function fill(label: string, value: string) {
  const labelEl = Array.from(dialog().querySelectorAll("label")).find(
    (item) => item.textContent?.trim().startsWith(label),
  )!;
  const input = dialog().querySelector<HTMLInputElement>(`#${labelEl.getAttribute("for")}`)!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

function dialogButton(text: string): HTMLButtonElement {
  return Array.from(dialog().querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  ) as HTMLButtonElement;
}

describe("SecuritySettingsView", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("mostra a última troca de senha e as sessões, com a atual sem botão de encerrar", async () => {
    const wrapper = await render();

    expect(wrapper.text()).toMatch(/Alterada em \d{2}\/\d{2}\/\d{4}/);
    expect(wrapper.text()).toContain("4 dispositivos conectados");
    const current = wrapper.findAll("li").find((li) => li.text().includes("Esta sessão"))!;
    expect(current.text()).toContain("Em uso agora");
    expect(current.find("button").exists()).toBe(false);
  });

  it("não troca a senha sem a atual, com senha fraca ou com a repetição diferente", async () => {
    const wrapper = await render();

    await wrapper.findAll("button").find((b) => b.text() === "Alterar senha")!.trigger("click");
    await nextTick();
    dialogButton("Salvar e encerrar sessões").click();
    await nextTick();

    expect(dialog().textContent).toContain("Informe a senha atual para continuar.");
    expect(dialog().textContent).toContain("A senha ainda não atende");

    fill("Senha atual", "SenhaSegura!123");
    fill("Nova senha", "OutraSenhaForte#2026");
    fill("Repetir a nova senha", "OutraSenhaForte#2025");
    dialogButton("Salvar e encerrar sessões").click();
    await nextTick();

    expect(dialog().textContent).toContain("As duas senhas não coincidem.");
  });

  it("troca a senha e encerra as outras sessões", async () => {
    const wrapper = await render();

    await wrapper.findAll("button").find((b) => b.text() === "Alterar senha")!.trigger("click");
    await nextTick();
    fill("Senha atual", "SenhaSegura!123");
    fill("Nova senha", "OutraSenhaForte#2026");
    fill("Repetir a nova senha", "OutraSenhaForte#2026");
    dialogButton("Salvar e encerrar sessões").click();
    await flushPromises();

    expect(wrapper.text()).toContain("Senha alterada e 3 sessões encerradas.");
    expect(wrapper.text()).toContain("1 dispositivo conectado");
  });
});
