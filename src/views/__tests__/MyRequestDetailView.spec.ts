import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import MyRequestDetailView from "../MyRequestDetailView.vue";
import { DEMO_REQUESTS } from "@/features/requests/data/requests";

vi.mock("@/features/auth/services/fakeNetwork", () => ({ delay: () => Promise.resolve() }));

const route: { params: { id: string }; query: Record<string, string> } = {
  params: { id: "" },
  query: {},
};
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => route,
  useRouter: () => ({ push: vi.fn<() => void>(), resolve: vi.fn<() => void>() }),
}));

const TITULAR = "titular@exemplo.com.br";
const byProtocol = (protocol: string) => DEMO_REQUESTS.find((item) => item.protocol === protocol)!;

async function render(protocol: string, query: Record<string, string> = {}) {
  route.params.id = byProtocol(protocol).id;
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
  });

  it("abre a requisição do próprio titular, com protocolo e identificador", async () => {
    const wrapper = await render("2026-000418");
    const request = byProtocol("2026-000418");

    expect(request.subject.email).toBe(TITULAR);
    expect(wrapper.get("h1").text()).toBe("Eliminação de dados");
    expect(wrapper.text()).toContain("Seu pedido");
    expect(wrapper.text()).toContain(request.id);
    expect(wrapper.text()).toContain("Cancelar requisição");
  });

  it("esconde do titular o trabalho interno da equipe", async () => {
    const wrapper = await render("2026-000418");

    expect(wrapper.text()).toContain("Histórico da requisição");
    expect(wrapper.text()).not.toContain("Nota interna registrada");
    expect(wrapper.text()).not.toContain("Consulta enviada à área de comunicação");
    expect(wrapper.text()).not.toContain("Exportar trilha");
  });

  it("responde como inexistente a requisição de outro titular", async () => {
    const other = DEMO_REQUESTS.find((item) => item.subject.email !== TITULAR)!;
    const wrapper = await render(other.protocol);

    expect(wrapper.get("h1").text()).toBe("Não encontramos esta requisição");
    expect(wrapper.text()).not.toContain(other.description);
  });

  it("oferece baixar a resposta de uma requisição concluída, sem cancelar", async () => {
    const wrapper = await render("2026-000392");

    expect(wrapper.text()).toContain("Resposta da organização");
    expect(wrapper.text()).toContain("Baixar a resposta");
    expect(wrapper.text()).not.toContain("Cancelar requisição");
  });

  it("cancela pela própria página e troca as ações pelo aviso", async () => {
    const wrapper = await render("2026-000447");

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

  // Antes do teste que responde: o armazenamento em memória é o mesmo no arquivo.
  it("abre o formulário direto quando chega pelo link da pesquisa", async () => {
    const wrapper = await render("2026-000392", { pesquisa: "1" });

    expect(wrapper.text()).toContain("Sua avaliação do atendimento");
  });

  it("convida para a pesquisa na requisição concluída e registra a avaliação", async () => {
    const wrapper = await render("2026-000392");

    expect(wrapper.text()).toContain("Como foi o atendimento desta requisição?");
    await wrapper.findAll("button").find((b) => b.text() === "Avaliar atendimento")!.trigger("click");

    await wrapper.find('input[value="5"]').setValue();
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("Avaliação registrada. Agradecemos a resposta.");
    expect(wrapper.text()).toContain("Respondida");
    expect(wrapper.text()).not.toContain("Avaliar atendimento");
  });

  it("explica que a pesquisa ainda não abriu numa requisição em andamento", async () => {
    const wrapper = await render("2026-000444", { pesquisa: "1" });

    expect(wrapper.text()).toContain("A pesquisa abre quando a requisição for finalizada");
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false);
  });
});
