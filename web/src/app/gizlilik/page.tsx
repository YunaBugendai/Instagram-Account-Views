export default function PrivacyPage() {
  return (
    <main className="flex-1 py-6 text-sm leading-relaxed text-textSecondary">
      <h1 className="mb-4 text-xl font-semibold text-textPrimary">Gizlilik Politikası</h1>

      <p className="mb-4">
        Instagram Account Views ("uygulama", "site"), Instagram hesaplarına bağlanmaz ve
        Instagram şifresi istemez. Hesaplama tamamen senin girdiğin takipçi, takip edilen ve
        gönderi sayılarına dayanır.
      </p>

      <h2 className="mb-2 mt-6 font-medium text-textPrimary">Ne topluyoruz</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Anonim bir cihaz kimliği (çerez) — yalnızca günlük ücretsiz kullanım hakkını takip
          etmek için, kimliğini tespit etmek için değil.
        </li>
        <li>IP adresin — kötüye kullanımı (aynı anda çok sayıda sahte istek) önlemek için.</li>
        <li>Girdiğin kullanıcı adı, takipçi/takip edilen/gönderi sayıları — sunucuda kalıcı olarak saklanmaz, yalnızca hesaplama anında kullanılır.</li>
      </ul>

      <h2 className="mb-2 mt-6 font-medium text-textPrimary">Ne toplamıyoruz</h2>
      <p>
        İsim, e-posta, telefon numarası, Instagram şifresi veya herhangi bir Instagram hesap
        verisi istemiyoruz ve toplamıyoruz.
      </p>

      <h2 className="mb-2 mt-6 font-medium text-textPrimary">Reklamlar</h2>
      <p>
        Bu site Google AdSense üzerinden reklam gösterebilir. Google ve reklam ortakları, kendi
        gizlilik politikalarına göre çerez kullanabilir ve ilgi alanına dayalı reklam
        gösterebilir. Bu konuda daha fazla bilgiyi{" "}
        <a
          className="underline"
          href="https://policies.google.com/technologies/ads"
          target="_blank"
          rel="noreferrer"
        >
          Google'ın reklam politikaları sayfasında
        </a>{" "}
        bulabilirsin.
      </p>

      <p className="mt-6 text-xs text-textMuted">
        Bu metin genel bir taslaktır, hukuki tavsiye niteliği taşımaz — siteni yayına almadan
        önce bir uzmana kontrol ettirmen önerilir.
      </p>
    </main>
  );
}
