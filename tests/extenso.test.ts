import { describe, expect, it } from "vitest";
import {
  numeroPorExtenso, reaisPorExtenso, moedaComExtenso, dataPorExtenso, dataCurta, dataPontos, somarMeses, numeroComExtenso,
} from "../lib/modelos/extenso";

describe("números por extenso", () => {
  it.each([
    [0, "zero"], [1, "um"], [16, "dezesseis"], [21, "vinte e um"], [100, "cem"], [101, "cento e um"],
    [109, "cento e nove"], [200, "duzentos"], [999, "novecentos e noventa e nove"], [1000, "mil"],
    [1001, "mil e um"], [1200, "mil e duzentos"], [1250, "mil duzentos e cinquenta"], [2005, "dois mil e cinco"],
    [2500, "dois mil e quinhentos"], [260000, "duzentos e sessenta mil"], [1000000, "um milhão"],
    [2300000, "dois milhões e trezentos mil"],
  ])("%i -> %s", (n, esperado) => {
    expect(numeroPorExtenso(n)).toBe(esperado);
  });
});

describe("valores em reais (como nos modelos)", () => {
  it("bate com os exemplos dos contratos", () => {
    expect(reaisPorExtenso(1200)).toBe("mil e duzentos reais");
    expect(reaisPorExtenso(109.09)).toBe("cento e nove reais e nove centavos");
    expect(reaisPorExtenso(2500)).toBe("dois mil e quinhentos reais");
    expect(reaisPorExtenso(260000)).toBe("duzentos e sessenta mil reais");
    expect(reaisPorExtenso(1)).toBe("um real");
    expect(reaisPorExtenso(0.5)).toBe("cinquenta centavos");
    expect(reaisPorExtenso(1000000)).toBe("um milhão de reais");
    expect(moedaComExtenso(1200)).toBe("R$ 1.200,00 (mil e duzentos reais)");
  });
});

describe("datas", () => {
  it("formata como nos modelos", () => {
    expect(dataPorExtenso("2026-11-18")).toBe("18 de Novembro de 2026");
    expect(dataPorExtenso("2026-11-16", { minusculo: true })).toBe("16 de novembro de 2026");
    expect(dataCurta("2026-03-04")).toBe("04/03/2026");
    expect(dataPontos("2027-11-18")).toBe("18.11.27");
  });
  it("soma meses sem escorregar o dia", () => {
    expect(somarMeses("2026-11-18", 12)).toBe("2027-11-18");
    expect(somarMeses("2026-01-31", 1)).toBe("2026-02-28");
  });
  it("prazo com extenso", () => {
    expect(numeroComExtenso(12)).toBe("12 (doze)");
    expect(numeroComExtenso(24, { maiusculas: true })).toBe("24 (VINTE E QUATRO)");
  });
});
