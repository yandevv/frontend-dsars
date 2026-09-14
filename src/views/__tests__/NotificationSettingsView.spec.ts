import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import NotificationSettingsView from "../NotificationSettingsView.vue";
import { mockApi, route } from "@/test/api";
import type { ApiEventPreference } from "@/shared/api/contracts";

vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => ({ fullPath: "/configuracoes/notificacoes", query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn<() => void>() }),
  onBeforeRouteLeave: vi.fn<() => void>(),
}));

/** O catálogo do titular: segurança obrigatória, pesquisa opcional, mensagem meio a meio. */
function server() {
  let catalog: ApiEventPreference[] = [
    {
      eventType: "ACCOUNT_SECURITY_ALERT",
      label: "Segurança da conta",
      description: "Troca de senha, novo acesso e demais eventos de segurança da conta.",
      channels: [
        { channel: "IN_APP", enabled: true, mandatory: true },
        { channel: "EMAIL", enabled: true, mandatory: true },
      ],
    },
    {
      eventType: "REQUEST_MESSAGE_RECEIVED",
      label: "Nova mensagem na requisição",
      description: "Quando a outra parte envia uma mensagem na requisição.",
      channels: [
        { channel: "IN_APP", enabled: true, mandatory: true },
        { channel: "EMAIL", enabled: true, mandatory: false },
      ],
    },
    {
      eventType: "SATISFACTION_SURVEY_AVAILABLE",
      label: "Pesquisa de satisfação disponível",
      description: "Quando a pesquisa é liberada após a finalização.",
      channels: [
        { channel: "IN_APP", enabled: true, mandatory: false },
        { channel: "EMAIL", enabled: false, mandatory: false },
      ],
    },
  ];

  return mockApi([
    route("GET", "/me/notification-preferences", () => ({ events: catalog })),
    route("PUT", "/me/notification-preferences", (call) => {
      const { preferences } = call.body as {
        preferences: { eventType: string; channel: string; enabled: boolean }[];
      };
      catalog = catalog.map((event) => ({
        ...event,
        channels: event.channels.map((channel) => {
          const change = preferences.find(
            (item) => item.eventType === event.eventType && item.channel === channel.channel,
          );
          return change ? { ...channel, enabled: change.enabled } : channel;
        }),
      }));
      return { events: catalog };
    }),
  ]);
}

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
    server();
  });

  it("mostra o catálogo do servidor, com os canais obrigatórios travados", async () => {
    const wrapper = await render();

    expect(wrapper.text()).toContain("Pesquisa de satisfação disponível");
    expect(wrapper.text()).not.toContain("SMS");
    expect(switchFor(wrapper, "E-mail para Segurança da conta").attributes("aria-disabled")).toBe("true");
    expect(
      switchFor(wrapper, "E-mail para Nova mensagem na requisição").attributes("aria-disabled"),
    ).toBeUndefined();
  });

  it("só habilita salvar depois de uma mudança e conta o que falta salvar", async () => {
    const wrapper = await render();

    expect(button(wrapper, "Salvar preferências").attributes("disabled")).toBeDefined();
    await switchFor(wrapper, "E-mail para Nova mensagem na requisição").trigger("click");

    expect(wrapper.text()).toContain("1 alteração ainda não salva.");
    expect(button(wrapper, "Salvar preferências").attributes("disabled")).toBeUndefined();
  });

  it("salva depois da confirmação e mostra o que o servidor gravou", async () => {
    const wrapper = await render();

    await switchFor(wrapper, "E-mail para Pesquisa de satisfação disponível").trigger("click");
    await button(wrapper, "Salvar preferências").trigger("click");
    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain("1 canal muda de estado.");
    Array.from(dialog.querySelectorAll("button"))
      .find((b) => b.textContent?.includes("Salvar preferências"))!
      .click();
    await flushPromises();

    expect(wrapper.text()).toContain("Preferências de notificação salvas.");
    expect(
      switchFor(wrapper, "E-mail para Pesquisa de satisfação disponível").attributes("aria-checked"),
    ).toBe("true");
  });

  it("restaurar o padrão liga tudo, mas só vale ao salvar", async () => {
    const wrapper = await render();

    await button(wrapper, "Restaurar padrão").trigger("click");

    expect(wrapper.text()).toContain("Salve para que passe a valer.");
    expect(
      switchFor(wrapper, "E-mail para Pesquisa de satisfação disponível").attributes("aria-checked"),
    ).toBe("true");
    expect(wrapper.text()).toContain("1 alteração ainda não salva.");
  });
});
