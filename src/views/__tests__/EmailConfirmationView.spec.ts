import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";

import EmailConfirmationView from "../EmailConfirmationView.vue";
import { recordConfirmationSent } from "@/features/auth/services/emailConfirmationService";
import { endSession, startSession } from "@/features/auth/composables/useSession";
import { mockApi, problem, route as apiRoute } from "@/test/api";

const replace = vi.fn<(to: unknown) => Promise<void>>();
const route: {
  name?: string;
  params: Record<string, string>;
  query: Record<string, string>;
} = {
  params: {},
  query: {},
};

const INVALID = "Este link de confirmação não é mais válido. Solicite o envio de um novo.";
vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => route,
  useRouter: () => ({ replace }),
}));

async function render(
  params: Record<string, string>,
  query: Record<string, string> = {},
  name = "email-confirmation",
) {
  route.name = name;
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
    endSession();
    mockApi([
      apiRoute("POST", "/auth/confirm-email", (call) =>
        (call.body as { token: string }).token === "ficha-valida"
          ? { message: "ok" }
          : problem(400, INVALID),
      ),
      apiRoute("POST", "/me/email-change/confirm", {
        message: "Endereço de e-mail alterado.",
        email: "nova@exemplo.com.br",
      }),
      apiRoute("GET", "/me", problem(401, "Sem sessão")),
      apiRoute("POST", "/auth/refresh", problem(401, "Sem sessão")),
    ]);
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

  it("confirma o cadastro pelo link que chega com a ficha na query", async () => {
    const wrapper = await render({}, { token: "ficha-valida" });

    expect(wrapper.get("h1").text()).toBe("E-mail confirmado. Conta ativada.");
    expect(wrapper.text()).toContain("Entrar no portal");
  });

  it("aceita também a ficha no caminho, a forma antiga do link", async () => {
    const wrapper = await render({ token: "ficha-valida" });

    expect(wrapper.get("h1").text()).toBe("E-mail confirmado. Conta ativada.");
  });

  it("confirma a troca mostrando o endereço novo e o substituído", async () => {
    startSession({
      id: "conta-1",
      name: "Marina Torres de Almeida",
      email: "antiga@exemplo.com.br",
      role: "titular",
      emailConfirmed: true,
    });
    const wrapper = await render({}, { token: "ficha" }, "email-change-confirmation");

    expect(wrapper.get("h1").text()).toBe("Novo e-mail em vigor");
    expect(wrapper.text()).toContain("nova@exemplo.com.br");
    expect(wrapper.text()).toContain("antiga@exemplo.com.br");
  });

  it("trata link vencido, usado ou inexistente sem dizer se existe conta", async () => {
    const wrapper = await render({}, { token: "nao-existe" });

    expect(wrapper.get("h1").text()).toBe("Não conseguimos usar este link");
    expect(wrapper.text()).toContain("ter vencido");
    expect(wrapper.text()).not.toContain("@");
  });
});
