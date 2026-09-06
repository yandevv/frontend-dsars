import { describe, it, expect, vi } from "vitest";

import { DEMO_REQUESTS } from "@/features/requests/data/requests";
import { fetchReportRecords } from "@/features/reports/services/reportService";
import { SurveyError, submitSurvey, surveyAvailable } from "../surveyService";

vi.mock("@/features/auth/services/fakeNetwork", () => ({ delay: () => Promise.resolve() }));

const byProtocol = (protocol: string) => DEMO_REQUESTS.find((item) => item.protocol === protocol)!;

describe("surveyService", () => {
  it("só libera a pesquisa para requisições concluídas", () => {
    expect(surveyAvailable(byProtocol("2026-000392"))).toBe(true);
    expect(surveyAvailable(byProtocol("2026-000418"))).toBe(false);
    expect(surveyAvailable(byProtocol("2026-000377"))).toBe(false);
  });

  it("recusa a pesquisa de uma requisição em andamento ou cancelada", async () => {
    await expect(submitSurvey(byProtocol("2026-000418").id, { rating: 5 })).rejects.toMatchObject({
      refusal: "nao-liberada",
    });
    await expect(submitSurvey(byProtocol("2026-000377").id, { rating: 5 })).rejects.toMatchObject({
      refusal: "nao-liberada",
    });
  });

  it("recusa nota fora da escala e comentário longo demais", async () => {
    const id = byProtocol("2026-000392").id;

    await expect(submitSurvey(id, { rating: 6 })).rejects.toMatchObject({ refusal: "nota-invalida" });
    await expect(submitSurvey(id, { rating: 4, comment: "a".repeat(601) })).rejects.toMatchObject({
      refusal: "comentario-longo",
    });
  });

  it("registra a avaliação uma única vez, sem pôr a nota na trilha", async () => {
    const id = byProtocol("2026-000392").id;

    const answered = await submitSurvey(id, { rating: 4, comment: "  Faltou explicar o formato.  " });

    expect(answered.survey).toMatchObject({ rating: 4, comment: "Faltou explicar o formato." });
    expect(answered.timeline[0]?.title).toBe("Pesquisa de satisfação respondida");
    expect(answered.timeline[0]?.detail).not.toMatch(/\d/);

    await expect(submitSurvey(id, { rating: 1 })).rejects.toBeInstanceOf(SurveyError);
    await expect(submitSurvey(id, { rating: 1 })).rejects.toMatchObject({ refusal: "ja-respondida" });
  });

  it("entrega a nota ao relatório sem protocolo nem titular", async () => {
    const records = await fetchReportRecords();

    const rated = records.filter((record) => record.rating === 4);
    expect(rated.length).toBeGreaterThan(0);
    for (const record of records) {
      expect(record).not.toHaveProperty("protocol");
      expect(record).not.toHaveProperty("subject");
    }
  });
});
