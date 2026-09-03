/**
 * AdSense onayı gelene kadar bu bileşen sadece rezerve alan gösterir (layout shift olmasın diye).
 * Onay sonrası: <head>'e AdSense script'ini ekle, aşağıdaki <ins> bloğunu kendi
 * data-ad-client / data-ad-slot değerlerinle değiştir. Detay: README > "AdSense kurulumu".
 */
export function AdSlot({ label = "Reklam alanı" }: { label?: string }) {
  return (
    <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-textMuted">
      {label}
    </div>
  );
}
