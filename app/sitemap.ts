import { MetadataRoute } from "next";

const BASE_URL = "https://imobiliariaportoiguacu.com.br";

async function getImoveis() {
  try {
    const res = await fetch(`${BASE_URL}/api/imoveis`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const imoveis = await getImoveis();

  const imoveisUrls = imoveis
    .filter((i: any) => i.ativo)
    .map((imovel: any) => {
      const slugBase = `${imovel.tipo}-${imovel.cidade}-${imovel.bairro}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      return {
        url: `${BASE_URL}/imovel/${slugBase}/${imovel.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

  return [
    { url: BASE_URL,                        lastModified: new Date(), changeFrequency: "daily" as const,   priority: 1.0 },
    { url: `${BASE_URL}/imoveis/venda`,     lastModified: new Date(), changeFrequency: "daily" as const,   priority: 0.9 },
    { url: `${BASE_URL}/imoveis/aluguel`,   lastModified: new Date(), changeFrequency: "daily" as const,   priority: 0.9 },
    { url: `${BASE_URL}/sobre`,             lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/contato`,           lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    ...imoveisUrls,
  ];
}