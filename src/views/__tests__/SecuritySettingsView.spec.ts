import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import SecuritySettingsView from "../SecuritySettingsView.vue";
import { mockApi, problem, route } from "@/test/api";
import type { ApiSession } from "@/shared/api/contracts";

const AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
];

/** Quatro sessões, a primeira a atual; trocar a senha deixa só ela. */
function server() {
  let sessions: ApiSession[] = AGENTS.map((userAgent, index) => ({
    id: `sessao-${index}`,
    familyId: `familia-${index}`,
    ipAddress: `177.44.12.${index}`,
    userAgent,
    createdAt: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
    lastUsedAt: new Date(Date.now() - index * 3_600_000).toISOString(),
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    current: index === 0,
  }));

  mockApi([
    route("GET", "/me/security", () => ({
      passwordSet: true,
      passwordChangedAt: "2026-06-02T12:00:00.000Z",
      sessions,
    })),
    route("PUT", "/me/password", (call) => {
      if ((call.body as { currentPassword: string }).currentPassword !== "SenhaSegura!123") {
        return problem(400, "A senha atual não confere.");
      }
      const revoked = sessions.length - 1;
      sessions = sessions.filter((session) => session.current);
      return { revokedSessions: revoked };
    }),
  ]);
}

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
    server();
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

  it("mostra a recusa do servidor quando a senha atual não confere", async () => {
    const wrapper = await render();

    await wrapper.findAll("button").find((b) => b.text() === "Alterar senha")!.trigger("click");
    await nextTick();
    fill("Senha atual", "errada");
    fill("Nova senha", "OutraSenhaForte#2026");
    fill("Repetir a nova senha", "OutraSenhaForte#2026");
    dialogButton("Salvar e encerrar sessões").click();
    await flushPromises();

    expect(dialog().textContent).toContain("A senha atual não confere.");
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
