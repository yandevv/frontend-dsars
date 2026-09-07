import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import NotificationsView from "../NotificationsView.vue";
import { resetNotifications } from "@/features/notifications/composables/useNotifications";

const push = vi.fn<(to: unknown) => void>();
const route = { query: {} as Record<string, string>, fullPath: "/notificacoes" };
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => route,
  useRouter: () => ({ push }),
}));

function render() {
  return mount(NotificationsView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
}

function button(wrapper: ReturnType<typeof render>, text: string) {
  return wrapper.findAll("button").find((item) => item.text().startsWith(text))!;
}

describe("NotificationsView", () => {
  beforeEach(() => {
    resetNotifications();
    push.mockClear();
    route.query = {};
    document.body.innerHTML = "";
  });

  it("agrupa os avisos do titular e resume quantos faltam ler", () => {
    const wrapper = render();

    expect(wrapper.get("h1").text()).toBe("Notificações");
    expect(wrapper.text()).toMatch(/6 notificações, 2 não lidas/);
    expect(wrapper.text()).toContain("Hoje");
  });

  it("filtra por não lidas e lidas, com os contadores nas abas", async () => {
    const wrapper = render();

    await button(wrapper, "Não lidas").trigger("click");
    expect(wrapper.get("main").findAll("ul > li")).toHaveLength(2);

    await button(wrapper, "Lidas").trigger("click");
    expect(wrapper.get("main").findAll("ul > li")).toHaveLength(4);
  });

  it("acionar leva ao recurso e marca como lido", async () => {
    const wrapper = render();

    await button(wrapper, "O prazo de resposta da 2026-000418 venceu").trigger("click");

    expect(push).toHaveBeenCalledWith(expect.objectContaining({ name: "my-request-detail" }));
    expect(wrapper.text()).toMatch(/1 não lida/);
  });

  it("explica o recurso indisponível no próprio aviso, sem navegar", async () => {
    const wrapper = render();

    expect(wrapper.text()).toContain("Recurso indisponível");
    await button(wrapper, "Cancelamento do 2026-000301 confirmado").trigger("click");

    expect(push).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Este recurso não está mais disponível");
    expect(wrapper.text()).toContain("O prazo de retenção da requisição venceu");
  });

  it("marca todas como lidas e trava o botão", async () => {
    const wrapper = render();

    await button(wrapper, "Marcar todas como lidas").trigger("click");

    expect(wrapper.text()).toMatch(/0 não lidas/);
    expect(button(wrapper, "Marcar todas como lidas").attributes("disabled")).toBeDefined();
  });

  it("só limpa a listagem depois da confirmação", async () => {
    const wrapper = render();

    await button(wrapper, "Limpar listagem").trigger("click");
    await nextTick();
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain("Limpar a listagem de notificações?");
    expect(wrapper.get("main").findAll("ul > li").length).toBeGreaterThan(0);

    Array.from(dialog.querySelectorAll("button"))
      .find((item) => item.textContent?.trim() === "Limpar listagem")!
      .click();
    await nextTick();

    expect(wrapper.text()).toContain("Sua listagem está vazia");
    expect(wrapper.text()).toContain("Listagem limpa.");
  });
});
