import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import RequestTimeline from "../RequestTimeline.vue";
import type { RequestTimelineEntry } from "@/features/requests/types/request";

const entries: RequestTimelineEntry[] = [
  {
    at: "2026-09-10T15:20:00.000Z",
    title: "Nota interna registrada",
    detail: "Comunicação liberou a exclusão.",
    author: "Beatriz Falcão",
    internal: true,
  },
  {
    at: "2026-08-27T09:41:00.000Z",
    title: "Requisição registrada",
    detail: "Protocolo gerado pelo portal do titular.",
    author: "Titular",
  },
];

describe("RequestTimeline", () => {
  it("mostra ao encarregado a trilha inteira, com autor e exportação", () => {
    const wrapper = mount(RequestTimeline, { props: { entries } });

    expect(wrapper.findAll("li")).toHaveLength(2);
    expect(wrapper.text()).toContain("Beatriz Falcão");
    expect(wrapper.text()).toContain("Exportar trilha");
  });

  it("mostra ao titular só o que é dele, sem autor nem exportação", () => {
    const wrapper = mount(RequestTimeline, { props: { entries, audience: "titular" } });

    expect(wrapper.text()).toContain("Histórico da requisição");
    expect(wrapper.findAll("li")).toHaveLength(1);
    expect(wrapper.text()).not.toContain("Nota interna registrada");
    expect(wrapper.text()).not.toContain("Beatriz Falcão");
    expect(wrapper.text()).not.toContain("Exportar trilha");
  });
});
