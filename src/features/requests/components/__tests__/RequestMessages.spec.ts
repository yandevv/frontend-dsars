import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";

import RequestMessages from "../RequestMessages.vue";
import type { MessageActor, RequestMessage } from "@/features/requests/types/request";

/** O último item — `Array.prototype.at` fica fora da versão da biblioteca do projeto. */
const last = <T>(list: readonly T[]): T | undefined => list[list.length - 1]


const MARINA: MessageActor = { name: "Marina Torres de Almeida", role: "titular" };

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const messages: RequestMessage[] = [
  {
    id: "m2",
    kind: "mensagem",
    author: MARINA.name,
    authorRole: "titular",
    text: "Só as campanhas.",
    attachments: [],
    sentAt: minutesAgo(5),
  },
  {
    id: "m1",
    kind: "complemento",
    author: "Beatriz Falcão Ribeiro",
    authorRole: "encarregado",
    text: "Precisamos saber se os lembretes também devem parar.",
    attachments: [],
    sentAt: minutesAgo(60),
  },
  {
    id: "m0",
    kind: "mensagem",
    author: MARINA.name,
    authorRole: "titular",
    text: "Mensagem excluída antes.",
    attachments: [],
    sentAt: minutesAgo(90),
    deletedAt: minutesAgo(80),
  },
  {
    id: "m3",
    kind: "mensagem",
    author: MARINA.name,
    authorRole: "titular",
    text: "Enviada há mais de meia hora.",
    attachments: [],
    sentAt: minutesAgo(45),
    editedAt: minutesAgo(40),
  },
];

function render(props: { open?: boolean; mode?: "mensagem" | "complemento" } = {}) {
  return mount(RequestMessages, {
    attachTo: document.body,
    props: { messages, viewer: MARINA, open: props.open ?? true, mode: props.mode },
  });
}

function item(wrapper: ReturnType<typeof render>, text: string) {
  return wrapper.findAll("ol > li").find((li) => li.text().includes(text))!;
}

describe("RequestMessages", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mostra a conversa em ordem cronológica, sem as excluídas", () => {
    const wrapper = render();

    const texts = wrapper.findAll("ol > li").map((li) => li.text());
    expect(texts).toHaveLength(3);
    expect(texts[0]).toContain("Precisamos saber");
    expect(texts[2]).toContain("Só as campanhas.");
    expect(wrapper.text()).not.toContain("Mensagem excluída antes.");
  });

  it("sinaliza pedido de complemento e mensagem editada", () => {
    const wrapper = render();

    expect(item(wrapper, "Precisamos saber").text()).toContain("Pedido de complemento");
    expect(item(wrapper, "Enviada há mais de meia hora.").text()).toContain("editada");
  });

  it("oferece editar só a própria mensagem dentro da meia hora; excluir, a própria sempre", () => {
    const wrapper = render();

    const recent = item(wrapper, "Só as campanhas.");
    expect(recent.text()).toContain("Você");
    expect(recent.text()).toContain("Editar");
    expect(recent.text()).toContain("Excluir");

    const old = item(wrapper, "Enviada há mais de meia hora.");
    expect(old.text()).not.toContain("Editar");
    expect(old.text()).toContain("Excluir");

    const others = item(wrapper, "Precisamos saber");
    expect(others.text()).not.toContain("Editar");
    expect(others.text()).not.toContain("Excluir");
  });

  it("não envia mensagem sem texto nem anexo", async () => {
    const wrapper = render();

    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("send")).toBeUndefined();
    expect(wrapper.text()).toContain("Escreva a mensagem ou anexe um arquivo.");
  });

  it("envia o texto sem espaços nas pontas", async () => {
    const wrapper = render();

    await wrapper.find("form textarea").setValue("  Obrigada pelo retorno.  ");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("send")?.[0]?.[0]).toEqual({
      text: "Obrigada pelo retorno.",
      attachments: [],
    });
  });

  it("exclui só depois da confirmação", async () => {
    const wrapper = render();

    await item(wrapper, "Só as campanhas.")
      .findAll("button")
      .find((b) => b.text() === "Excluir")!
      .trigger("click");
    await nextTick();

    expect(wrapper.emitted("remove")).toBeUndefined();
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain("Excluir esta mensagem?");

    Array.from(dialog.querySelectorAll("button"))
      .find((b) => b.textContent?.includes("Excluir mensagem"))!
      .click();
    await nextTick();

    expect(wrapper.emitted("remove")?.[0]).toEqual(["m2"]);
  });

  it("edita só depois de confirmar o novo texto", async () => {
    const wrapper = render();

    await item(wrapper, "Só as campanhas.")
      .findAll("button")
      .find((b) => b.text() === "Editar")!
      .trigger("click");
    // Em edição o texto vira campo: a linha passa a ser achada pela posição.
    const editing = () => last(wrapper.findAll("ol > li"))!;
    await editing().find("textarea").setValue("Só as campanhas, por favor.");
    await editing()
      .findAll("button")
      .find((b) => b.text() === "Salvar alteração")!
      .trigger("click");
    await nextTick();

    expect(wrapper.emitted("edit")).toBeUndefined();
    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    Array.from(dialog.querySelectorAll("button"))
      .find((b) => b.textContent?.includes("Salvar alteração"))!
      .click();
    await nextTick();

    expect(wrapper.emitted("edit")?.[0]?.[0]).toEqual({ id: "m2", text: "Só as campanhas, por favor." });
  });

  it("encerrada: mantém a leitura e tira envio, edição e exclusão", () => {
    const wrapper = render({ open: false });

    expect(wrapper.find("form").exists()).toBe(false);
    expect(wrapper.text()).toContain("não recebe novas mensagens");
    expect(wrapper.text()).not.toContain("Editar");
    expect(wrapper.text()).not.toContain("Excluir");
  });

  it("no modo complemento, o campo vira pedido ao titular", () => {
    const wrapper = render({ mode: "complemento" });

    expect(wrapper.text()).toContain("Pedido de complemento ao titular");
    expect(wrapper.text()).toContain("Enviar pedido de complemento");
    expect(wrapper.text()).toContain("Voltar à mensagem comum");
  });
});
