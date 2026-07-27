export default function BoletoBarras({ codigo }: { codigo: string }) {
  const digitos = (codigo || "").split("").map((c) => parseInt(c, 10) || 0);

  return (
    <div className="flex items-end h-14 gap-[1.5px] w-full overflow-hidden" aria-hidden="true">
      {digitos.map((d, i) => (
        <div
          key={i}
          className="bg-gray-900"
          style={{ width: `${1 + (d % 3)}px`, height: `${55 + (d % 5) * 9}%` }}
        />
      ))}
    </div>
  );
}
