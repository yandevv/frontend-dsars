import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import MyRequestDetailView from "../MyRequestDetailView.vue";
import { mockApi, problem, route as apiRoute } from "@/test/api";
import { apiDetails, apiMessage, isoFromNow } from "@/test/factories";
import type { ApiRequestStatus, ApiSurveyState } from "@/shared/api/contracts";

const route: { params: { id: string }; query: Record<string, string> } = {
  params: { id: "" },
  query: {},
};
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn<() => void>(), resolve: vi.fn<() => void>() }),
}));

const DAY = 86_400_000;

/** Um servidor pequeno com três requisições do titular: aberta, concluída e em andamento. */
function server() {
  const status: Record<string, ApiRequestStatus> = { r447: "OPEN", r444: "OPEN", r392: "COMPLETED" };
  let survey: ApiSurveyState = { available: true, answered: false, response: null };

  const details = (id: string) =>
    apiDetails({
      id,
      protocolNumber: { r447: "2026-000447", r444: "2026-000444", r392: "2026-000392" }[id],
      rights: id === "r392" ? ["DATA_PORTABILITY"] : ["ANONYMIZATION_BLOCKING_OR_DELETION"],
      status: status[id],
      deadlineStatus: status[id] === "OPEN" ? "ON_TIME" : "CLOSED",
      closedAt: status[id] === "OPEN" ? null : isoFromNow(-DAY),
      cancellationReason: status[id] === "CANCELLED" ? "Consegui a declaração pelo balcão." : null,
    });

  return mockApi([
    apiRoute("GET", /^\/requests\/r(447|444|392)$/, (call) => details(call.path.split("/")[2]!)),
    apiRoute("GET", /^\/requests\/r\d+\/messages$/, (call) =>
      call.path.includes("r392")
        ? {
            items: [
              apiMessage({
                id: "parecer",
                isConclusive: true,
                mine: false,
                editableUntil: null,
                body: "Seguem seus dados em formato estruturado.",
                author: { id: "dpo", fullName: "Helena Prado Vasconcelos", role: "DPO" },
                attachments: [
                  {
                    id: "anexo-resultado",
                    kind: "OUTCOME_DOCUMENT",
                    fileName: "portabilidade.pdf",
                    contentType: "application/pdf",
                    sizeBytes: 20_000,
                    createdAt: isoFromNow(-DAY),
                  },
                ],
              }),
            ],
          }
        : { items: [] },
    ),
    apiRoute("GET", "/requests/r392/survey", () => survey),
    apiRoute("POST", "/requests/r392/survey", (call) => {
      const { rating } = call.body as { rating: number };
      survey = {
        available: true,
        answered: true,
        response: { rating, comment: null, respondedAt: isoFromNow(0) },
      };
      return survey.response;
    }),
    apiRoute("POST", "/me/requests/cancel", (call) => {
      const [id] = (call.body as { ids: string[] }).ids;
      status[id!] = "CANCELLED";
      return {
        cancelled: [
          {
            id,
            protocolNumber: "2026-000447",
            status: "CANCELLED",
            closedAt: isoFromNow(0),
            dueAt: isoFromNow(DAY),
            onTime: true,
          },
        ],
        rejected: [],
      };
    }),
    apiRoute("GET", /^\/requests\/.+$/, problem(404, "Não encontrada.")),
  ]);
}

async function render(id: string, query: Record<string, string> = {}) {
  route.params.id = id;
  route.query = query;
  const wrapper = mount(MyRequestDetailView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await flushPromises();
  return wrapper;
}

describe("MyRequestDetailView", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    server();
  });

  it("abre a requisição do próprio titular, com protocolo e identificador", async () => {
    const wrapper = await render("r447");

    expect(wrapper.get("h1").text()).toBe("Anonimização, bloqueio ou eliminação");
    expect(wrapper.text()).toContain("Seu pedido");
    expect(wrapper.text()).toContain("2026-000447");
    expect(wrapper.text()).toContain("Cancelar requisição");
    expect(wrapper.text()).toContain("Histórico da requisição");
    expect(wrapper.text()).not.toContain("Exportar trilha");
  });

  it("responde como inexistente a requisição que o servidor não entrega", async () => {
    const wrapper = await render("r999");

    expect(wrapper.get("h1").text()).toBe("Não encontramos esta requisição");
  });

  it("oferece baixar a resposta de uma requisição concluída, sem cancelar", async () => {
    const wrapper = await render("r392");

    expect(wrapper.text()).toContain("Resposta da organização");
    expect(wrapper.text()).toContain("Seguem seus dados em formato estruturado.");
    expect(wrapper.text()).toContain("Baixar a resposta");
    expect(wrapper.text()).not.toContain("Cancelar requisição");
  });

  it("cancela pela própria página e troca as ações pelo aviso", async () => {
    const wrapper = await render("r447");

    const cancel = wrapper.findAll("button").find((b) => b.text() === "Cancelar requisição")!;
    await cancel.trigger("click");
    await nextTick();

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const textarea = dialog.querySelector("textarea")!;
    textarea.value = "Consegui a declaração pelo balcão da unidade.";
    textarea.dispatchEvent(new Event("input"));
    dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await nextTick();
    Array.from(dialog.querySelectorAll("button"))
      .find((b) => b.textContent?.includes("Confirmar cancelamento"))!
      .click();
    await flushPromises();

    expect(wrapper.text()).toContain("Requisição cancelada");
    expect(wrapper.text()).toContain("Cancelada");
    expect(wrapper.text()).not.toContain("Cancelar requisição");
  });

  it("abre o formulário direto quando chega pelo link da pesquisa", async () => {
    const wrapper = await render("r392", { pesquisa: "1" });

    expect(wrapper.text()).toContain("Sua avaliação do atendimento");
  });

  it("convida para a pesquisa na requisição concluída e registra a avaliação", async () => {
    const wrapper = await render("r392");

    expect(wrapper.text()).toContain("Como foi o atendimento desta requisição?");
    await wrapper.findAll("button").find((b) => b.text() === "Avaliar atendimento")!.trigger("click");

    await wrapper.find('input[value="5"]').setValue();
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("Avaliação registrada. Agradecemos a resposta.");
    expect(wrapper.text()).not.toContain("Avaliar atendimento");
  });

  it("explica que a pesquisa ainda não abriu numa requisição em andamento", async () => {
    const wrapper = await render("r444", { pesquisa: "1" });

    expect(wrapper.text()).toContain("A pesquisa abre quando a requisição for finalizada");
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false);
  });
});
