import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import NotificationsView from "../NotificationsView.vue";
import { resetNotifications } from "@/features/notifications/composables/useNotifications";
import { mockApi, problem, route as apiRoute } from "@/test/api";
import { isoFromNow } from "@/test/factories";
import type { ApiNotification } from "@/shared/api/contracts";

const HOUR = 3_600_000;

function notification(
  id: string,
  title: string,
  read: boolean,
  hoursAgo: number,
  eventType: ApiNotification["eventType"] = "REQUEST_MESSAGE_RECEIVED",
): ApiNotification {
  return {
    id,
    eventType,
    title,
    body: "Abra a requisição para ver os detalhes.",
    resourceType: "Request",
    resourceId: `r-${id}`,
    read,
    readAt: read ? isoFromNow(-hoursAgo * HOUR) : null,
    createdAt: isoFromNow(-hoursAgo * HOUR),
  };
}

/** Uma caixa com seis avisos, dois não lidos; o de 2026-000301 leva a recurso que sumiu. */
function inbox() {
  let items = [
    notification("n1", "O prazo de resposta da 2026-000418 venceu", false, 1, "REQUEST_DEADLINE_EXPIRED"),
    notification("n2", "A equipe escreveu na requisição 2026-000447", false, 2),
    notification("n3", "Cancelamento do 2026-000301 confirmado", true, 30, "REQUEST_CANCELLED"),
    notification("n4", "A resposta à 2026-000392 está disponível", true, 60, "REQUEST_COMPLETED"),
    notification("n5", "Como foi o atendimento da 2026-000392?", true, 61, "SATISFACTION_SURVEY_AVAILABLE"),
    notification("n6", "Sua senha foi alterada", true, 200, "ACCOUNT_SECURITY_ALERT"),
  ];
  const unread = () => items.filter((item) => !item.read).length;
  const markRead = (id: string) => {
    items = items.map((item) => (item.id === id ? { ...item, read: true } : item));
  };

  return mockApi([
    apiRoute("GET", "/me/notifications", () => ({ items, page: 1, pageSize: 20, total: items.length })),
    apiRoute("GET", "/me/notifications/unread-count", () => ({ unreadCount: unread() })),
    apiRoute("POST", "/me/notifications/read-all", () => {
      items = items.map((item) => ({ ...item, read: true }));
      return {};
    }),
    apiRoute("DELETE", "/me/notifications", () => {
      items = [];
      return { cleared: 6, unreadCount: 0 };
    }),
    apiRoute("POST", "/me/notifications/n3/open", () => {
      markRead("n3");
      return problem(410, "Este recurso não está mais disponível.");
    }),
    apiRoute("POST", /^\/me\/notifications\/n\d\/open$/, (call) => {
      const id = call.path.split("/")[3]!;
      markRead(id);
      return { resourceType: "Request", resourceId: `r-${id}`, path: null };
    }),
  ]);
}

const push = vi.fn<(to: unknown) => void>();
const route = { query: {} as Record<string, string>, fullPath: "/notificacoes" };
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => route,
  useRouter: () => ({ push }),
}));

async function render() {
  const wrapper = mount(NotificationsView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await flushPromises();
  return wrapper;
}

function button(wrapper: Awaited<ReturnType<typeof render>>, text: string) {
  return wrapper.findAll("button").find((item) => item.text().startsWith(text))!;
}

describe("NotificationsView", () => {
  beforeEach(() => {
    resetNotifications();
    push.mockClear();
    route.query = {};
    document.body.innerHTML = "";
    inbox();
  });

  it("agrupa os avisos do titular e resume quantos faltam ler", async () => {
    const wrapper = await render();

    expect(wrapper.get("h1").text()).toBe("Notificações");
    expect(wrapper.text()).toMatch(/6 notificações, 2 não lidas/);
    expect(wrapper.text()).toContain("Hoje");
  });

  it("filtra por não lidas e lidas, com os contadores nas abas", async () => {
    const wrapper = await render();

    await button(wrapper, "Não lidas").trigger("click");
    expect(wrapper.get("main").findAll("ul > li")).toHaveLength(2);

    await button(wrapper, "Lidas").trigger("click");
    expect(wrapper.get("main").findAll("ul > li")).toHaveLength(4);
  });

  it("acionar leva ao recurso e marca como lido", async () => {
    const wrapper = await render();

    await button(wrapper, "O prazo de resposta da 2026-000418 venceu").trigger("click");
    await flushPromises();

    expect(push).toHaveBeenCalledWith({ name: "my-request-detail", params: { id: "r-n1" } });
    expect(wrapper.text()).toMatch(/1 não lida/);
  });

  it("explica o recurso indisponível no próprio aviso, sem navegar", async () => {
    const wrapper = await render();

    await button(wrapper, "Cancelamento do 2026-000301 confirmado").trigger("click");
    await flushPromises();

    expect(push).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Recurso indisponível");
    expect(wrapper.text()).toContain("Este recurso não está mais disponível.");
  });

  it("marca todas como lidas e trava o botão", async () => {
    const wrapper = await render();

    await button(wrapper, "Marcar todas como lidas").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toMatch(/0 não lidas/);
    expect(button(wrapper, "Marcar todas como lidas").attributes("disabled")).toBeDefined();
  });

  it("só limpa a listagem depois da confirmação", async () => {
    const wrapper = await render();

    await button(wrapper, "Limpar listagem").trigger("click");
    await nextTick();
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain("Limpar a listagem de notificações?");
    expect(wrapper.get("main").findAll("ul > li").length).toBeGreaterThan(0);

    Array.from(dialog.querySelectorAll("button"))
      .find((item) => item.textContent?.trim() === "Limpar listagem")!
      .click();
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("Sua listagem está vazia");
    expect(wrapper.text()).toContain("Listagem limpa.");
  });
});
