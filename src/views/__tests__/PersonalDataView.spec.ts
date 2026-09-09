import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { nextTick } from "vue";

import PersonalDataView from "../PersonalDataView.vue";

vi.mock("@/features/auth/services/fakeNetwork", () => ({ delay: () => Promise.resolve() }));

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

    await row(wrapper, "Documento de identificação")
      .findAll("button")
      .find((b) => b.text() === "Revelar")!
      .trigger("click");

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

  it("pede a senha para trocar o e-mail e deixa a troca pendente", async () => {
    const wrapper = await render();

    await row(wrapper, "E-mail").findAll("button").find((b) => b.text().startsWith("Editar"))!.trigger("click");
    await row(wrapper, "E-mail").find("input").setValue("marina.nova@exemplo.com.br");
    await row(wrapper, "E-mail").findAll("button").find((b) => b.text() === "Salvar")!.trigger("click");
    await nextTick();

    const passwordField = dialog().querySelector<HTMLInputElement>('input[type="password"]')!;
    passwordField.value = "errada";
    passwordField.dispatchEvent(new Event("input"));
    dialogButton("Enviar confirmação").click();
    await flushPromises();
    expect(dialog().textContent).toContain("A senha não confere.");

    passwordField.value = "SenhaSegura!123";
    passwordField.dispatchEvent(new Event("input"));
    dialogButton("Enviar confirmação").click();
    await flushPromises();

    expect(wrapper.text()).toContain("Confirme o novo e-mail para concluir a troca");
    expect(row(wrapper, "E-mail").text()).toContain("Troca pendente");
    expect(row(wrapper, "E-mail").text()).toContain("titular@exemplo.com.br");

    await wrapper.findAll("button").find((b) => b.text() === "Cancelar troca")!.trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Troca de e-mail cancelada.");
  });

  it("recusa um telefone sem DDD sem abrir a confirmação", async () => {
    const wrapper = await render();

    await row(wrapper, "Telefone").findAll("button").find((b) => b.text().startsWith("Editar"))!.trigger("click");
    await row(wrapper, "Telefone").find("input").setValue("9999-1234");
    await row(wrapper, "Telefone").findAll("button").find((b) => b.text() === "Salvar")!.trigger("click");
    await nextTick();
    dialogButton("Salvar alteração").click();
    await flushPromises();

    expect(wrapper.text()).toContain("Informe o DDD e o número");
  });
});
