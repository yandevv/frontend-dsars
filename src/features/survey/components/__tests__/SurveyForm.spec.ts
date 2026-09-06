import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import SurveyForm from "../SurveyForm.vue";

describe("SurveyForm", () => {
  it("oferece as cinco notas com rótulos que descrevem o atendimento", () => {
    const wrapper = mount(SurveyForm);

    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(5);
    expect(wrapper.text()).toContain("Muito insatisfatório");
    expect(wrapper.text()).toContain("Muito satisfatório");
  });

  it("não envia sem nota", async () => {
    const wrapper = mount(SurveyForm);

    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeUndefined();
    expect(wrapper.text()).toContain("Escolha uma nota para enviar a avaliação.");
  });

  it("envia a nota com o comentário opcional, sem espaços nas pontas", async () => {
    const wrapper = mount(SurveyForm);

    await wrapper.find('input[value="4"]').setValue();
    expect(wrapper.text()).toContain("Sua nota: 4 · satisfatório");

    await wrapper.find("textarea").setValue("  Recebi antes do prazo.  ");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({
      rating: 4,
      comment: "Recebi antes do prazo.",
    });
  });

  it("aceita enviar sem comentário", async () => {
    const wrapper = mount(SurveyForm);

    await wrapper.find('input[value="2"]').setValue();
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]?.[0]).toEqual({ rating: 2, comment: "" });
  });

  it("durante o envio trava o botão e mostra o progresso", () => {
    const wrapper = mount(SurveyForm, { props: { sending: true } });

    expect(wrapper.text()).toContain("Enviando…");
  });
});
