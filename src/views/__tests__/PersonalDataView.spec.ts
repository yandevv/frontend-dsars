import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import PersonalDataView from "../PersonalDataView.vue";
import { mockApi, problem, route } from "@/test/api";
import type { ApiAccountView } from "@/shared/api/contracts";

/** A conta de Marina, com o que o servidor devolve e aceita. */
function server() {
  let account: ApiAccountView = {
    id: "conta-1",
    fullName: "Marina Torres de Almeida",
    email: "titular@exemplo.com.br",
    emailVerified: true,
    memberships: [],
    passwordSet: true,
    createdAt: "2026-01-10T12:00:00.000Z",
    document: { type: "CPF", masked: "•••.•••.789-••", verified: true },
    phone: { masked: "(••) •••••-3071" },
    pendingEmailChange: null,
  };

  mockApi([
    route("GET", "/me", () => account),
    route("PATCH", "/me", (call) => {
      const body = call.body as { fullName?: string; phone?: string };
      if (body.phone && body.phone.replace(/\D/g, "").length < 10) {
        return problem(400, "Informe o DDD e o número do telefone.");
      }
      if (body.fullName) account = { ...account, fullName: body.fullName };
      return account;
    }),
    route("POST", "/me/email-change", (call) => {
      const { newEmail } = call.body as { newEmail: string };
      account = { ...account, pendingEmailChange: { newEmail, expiresAt: "2026-09-27T12:00:00Z" } };
      return { status: 202, body: {} };
    }),
    route("POST", "/me/personal-data/reveal", {
      document: { type: "CPF", value: "476.201.789-04" },
      phone: null,
    }),
  ]);
}

vi.mock("vue-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vue-router")>()),
  useRoute: () => ({ fullPath: "/configuracoes/dados-pessoais", query: {}, params: {} }),
  useRouter: () => ({ push: vi.fn<() => void>() }),
}));

async function render() {
  const wrapper = mount(PersonalDataView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await flushPromises();
  return wrapper;
}

function row(wrapper: Awaited<ReturnType<typeof render>>, label: string) {
  return wrapper.findAll("dl > div").find((item) => item.text().includes(label))!;
}

function dialog(): HTMLElement {
  return document.body.querySelector('[role="dialog"]') as HTMLElement;
}

function dialogButton(text: string): HTMLButtonElement {
  return Array.from(dialog().querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  ) as HTMLButtonElement;
}

describe("PersonalDataView", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    server();
  });

  it("mostra documento e telefone mascarados, e o documento só para leitura", async () => {
    const wrapper = await render();

    expect(row(wrapper, "Documento de identificação").text()).toContain("•••.•••.789-••");
    expect(row(wrapper, "Documento de identificação").text()).toContain("Somente leitura");
    expect(row(wrapper, "Telefone").text()).toContain("-3071");
    expect(wrapper.text()).not.toContain("476.201.789-04");
  });

  it("revela o documento por ação explícita", async () => {
    const wrapper = await render();

    expect(wrapper.text()).not.toContain("476.201.789-04");
    await row(wrapper, "Documento de identificação")
      .findAll("button")
      .find((b) => b.text() === "Revelar")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("476.201.789-04");
  });

  it("só altera o nome depois da confirmação, mostrando o valor atual e o novo", async () => {
    const wrapper = await render();

    await row(wrapper, "Nome completo").findAll("button").find((b) => b.text().startsWith("Editar"))!.trigger("click");
    await row(wrapper, "Nome completo").find("input").setValue("Marina Torres Almeida");
    await row(wrapper, "Nome completo").findAll("button").find((b) => b.text() === "Salvar")!.trigger("click");
    await nextTick();

    expect(dialog().textContent).toContain("Confirmar alteração do nome");
    expect(dialog().textContent).toContain("Marina Torres de Almeida");
    expect(dialog().textContent).toContain("Marina Torres Almeida");

    dialogButton("Salvar alteração").click();
    await flushPromises();

    expect(wrapper.text()).toContain("Nome atualizado.");
    expect(row(wrapper, "Nome completo").text()).toContain("Marina Torres Almeida");
  });

  it("troca o e-mail depois da confirmação e deixa a troca pendente", async () => {
    const wrapper = await render();

    await row(wrapper, "E-mail").findAll("button").find((b) => b.text().startsWith("Editar"))!.trigger("click");
    await row(wrapper, "E-mail").find("input").setValue("marina.nova@exemplo.com.br");
    await row(wrapper, "E-mail").findAll("button").find((b) => b.text() === "Salvar")!.trigger("click");
    await nextTick();

    expect(dialog().textContent).toContain("Confirmar troca de e-mail");
    dialogButton("Enviar confirmação").click();
    await flushPromises();

    expect(wrapper.text()).toContain("Confirme o novo e-mail para concluir a troca");
    expect(wrapper.text()).toContain("marina.nova@exemplo.com.br");
    expect(row(wrapper, "E-mail").text()).toContain("Troca pendente");
    expect(row(wrapper, "E-mail").text()).toContain("titular@exemplo.com.br");
  });

  it("mostra a recusa do servidor para um telefone sem DDD", async () => {
    const wrapper = await render();

    await row(wrapper, "Telefone").findAll("button").find((b) => b.text().startsWith("Editar"))!.trigger("click");
    await row(wrapper, "Telefone").find("input").setValue("9999-1234");
    await row(wrapper, "Telefone").findAll("button").find((b) => b.text() === "Salvar")!.trigger("click");
    await nextTick();
    dialogButton("Salvar alteração").click();
    await flushPromises();

    expect(dialog().textContent).toContain("Informe o DDD e o número");
  });
});
