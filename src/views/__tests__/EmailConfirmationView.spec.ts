import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";

import EmailConfirmationView from "../EmailConfirmationView.vue";
import { recordConfirmationSent } from "@/features/auth/services/emailConfirmationService";

vi.mock("@/features/auth/services/fakeNetwork", () => ({ delay: () => Promise.resolve() }));

const replace = vi.fn<(to: unknown) => Promise<void>>();
const route: { params: Record<string, string>; query: Record<string, string> } = {
  params: {},
  query: {},
};
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => route,
  useRouter: () => ({ replace }),
}));

async function render(params: Record<string, string>, query: Record<string, string> = {}) {
  route.params = params;
  route.query = query;
  const wrapper = mount(EmailConfirmationView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await flushPromises();
  return wrapper;
}

describe("EmailConfirmationView", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("na espera do cadastro, diz para onde o link foi e trava o reenvio no intervalo", async () => {
    recordConfirmationSent("nova@exemplo.com.br");
    const wrapper = await render({}, { origem: "cadastro", email: "nova@exemplo.com.br" });

    expect(wrapper.get("h1").text()).toBe("Confirme seu e-mail para ativar a conta");
    expect(wrapper.text()).toContain("nova@exemplo.com.br");
    expect(wrapper.text()).toContain("Válido por 24 horas");
    const resend = wrapper.findAll("button").find((b) => b.text().startsWith("Novo envio em"))!;
    expect(resend.attributes("disabled")).toBeDefined();
  });

  it("na espera da troca, explica que o e-mail atual continua valendo", async () => {
    const wrapper = await render({}, { origem: "troca", email: "novo@exemplo.com.br" });

    expect(wrapper.text()).toContain("Alteração de e-mail");
    expect(wrapper.text()).toContain("seu e-mail atual continua valendo");
  });

  it("não expõe códigos de requisito nem artigos de lei", async () => {
    const wrapper = await render({}, { origem: "cadastro", email: "x@exemplo.com.br" });

    expect(wrapper.text()).not.toMatch(/\b(RF|RN)\d{3}\b|art\.\s*\d/);
  });

  it("confirma o cadastro pelo link", async () => {
    const wrapper = await render({ token: "demo-cadastro" });

    expect(wrapper.get("h1").text()).toBe("E-mail confirmado. Conta ativada.");
    expect(wrapper.text()).toContain("Entrar no portal");
  });

  it("confirma a troca mostrando o endereço novo e o substituído", async () => {
    const wrapper = await render({ token: "demo-troca" });

    expect(wrapper.get("h1").text()).toBe("Novo e-mail em vigor");
    expect(wrapper.text()).toContain("Substitui");
  });

  it("no link vencido, pede outro e volta à espera", async () => {
    const wrapper = await render({ token: "demo-expirado" });

    expect(wrapper.get("h1").text()).toBe("Este link venceu");
    await wrapper.findAll("button").find((b) => b.text() === "Enviar novo link")!.trigger("click");
    await flushPromises();

    expect(replace).toHaveBeenCalledWith({
      name: "email-confirmation",
      query: { origem: "cadastro", email: "pendente@exemplo.com.br" },
    });
  });

  it("trata link inexistente sem dizer se existe conta", async () => {
    const wrapper = await render({ token: "nao-existe" });

    expect(wrapper.get("h1").text()).toBe("Não conseguimos usar este link");
    expect(wrapper.text()).not.toContain("@");
  });
});
