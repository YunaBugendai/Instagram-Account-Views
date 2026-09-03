# Instagram Account Views

Kullanıcının kendi girdiği takipçi / takip edilen / gönderi sayısından eğlence amaçlı bir
"tahmini profil ziyareti" hesaplayan, reklam gelirli ürün.

**Bu gerçek Instagram verisi göstermez ve Instagram'a hiç bağlanmaz** — hiçbir dış API
çağrısı veya scraping yok, dolayısıyla ToS/Meta App Review riski de yok.

## Klasör yapısı

```
web/        Next.js + TypeScript - ŞU AN ÖNCELİKLİ. Vercel + Upstash'te tamamen ücretsiz çalışır.
backend/    Node.js + Fastify - mobil uygulama için ayrı API. Store hesapları alındığında devreye girecek.
mobile/     Expo + React Native - iOS/Android uygulaması. Kod hazır, yayınlamak store hesabı gerektiriyor.
```

Web ve mobil aynı hesaplama mantığını (`estimateFormula.ts`) birebir aynı şekilde
kullanıyor — ileride mobile geçtiğinde davranış tutarlı kalır.

## Neden web önce

Play Store tek seferlik $25, App Store yıllık $99. Google AdSense ise tamamen ücretsiz,
ve web hosting (Vercel) + Redis (Upstash) küçük trafikte ücretsiz tier'da kalıyor. Yani web
sürümünü **sıfır bütçeyle** canlıya alabilirsin; mobil için para biriktiğinde `backend/` ve
`mobile/` zaten hazır bekliyor.

## Web sürümünü çalıştırma

```bash
cd web
cp .env.example .env          # Upstash bilgilerini gireceksin, aşağıya bak
npm install
npm run dev                   # http://localhost:3000
```

### Ücretsiz kuruluma dair adımlar

1. **Upstash Redis (ücretsiz):** console.upstash.com → yeni Redis veritabanı oluştur →
   "REST API" sekmesindeki URL ve TOKEN'ı `.env`'e yapıştır.
2. **Vercel'e deploy (ücretsiz):** Bu `web/` klasörünü bir GitHub reposuna at, Vercel'de
   "Import Project" ile bağla. Vercel'in ayarlarından aynı Upstash env değişkenlerini gir.
   Deploy sonrası `senin-projen.vercel.app` gibi bir adresin olur — kendi alan adını bağlamak
   istersen o ayrı (~yıllık 200-400₺), ama zorunlu değil.
3. **Google AdSense (ücretsiz):** Site birkaç günlük yayında ve gerçek trafik aldıktan sonra
   adsense.google.com üzerinden başvur. Onay gelince: `web/public/ads.txt`'i AdSense
   panelindeki gerçek satırla değiştir, `AdSlot.tsx` bileşenlerindeki yer tutucuları
   AdSense'in verdiği `<ins>` koduyla değiştir.
   Not: "reklam izle → +1 hak" gibi ödüllü reklamlar (Ad Manager) yeni/düşük trafikli
   sitelerde başta açık olmayabilir — o yüzden web sürümünde bu mekanik yok, sadece standart
   gösterim reklamları var. Site büyüyünce eklenebilir.
4. **Cloudflare Turnstile (opsiyonel, ücretsiz):** Bot/script istismarını fark edersen
   dash.cloudflare.com → Turnstile → site ekle → secret key'i `.env`'e gir. Girmezsen bu
   kontrol otomatik atlanır, siteyi bloklamaz.

Bunların dışında (form doğrulama, günlük hak mantığı, hesaplama formülü, tüm arayüz) tam
ve çalışır kod — sadece yukarıdaki iki-üç kimlik bilgisini yapıştırman yeterli.

Doğrulama: `npm run build` ile production build'i burada denedim, sıfır hata/uyarıyla
başarıyla tamamlandı.

---

## Backend + Mobil (mobil store hesapların olduğunda)

```bash
cd backend
cp .env.example .env
docker compose up -d          # Redis + Postgres
npm install
psql "$DATABASE_URL" -f migrations/001_init.sql
npm run dev                   # http://localhost:3000
```

```bash
cd mobile
npm install
npx expo start
```

Sende kalan tek adımlar (kod eksiği değil, hesap/kimlik bilgisi gerektirdiği için):

| Neye ihtiyaç var | Nereden alınır |
|---|---|
| AdMob uygulama/reklam birimi ID'leri | AdMob konsolu |
| Google Cloud proje numarası + Play Integrity servis hesabı | Google Cloud Console |
| Apple Team ID + App Attest capability | Apple Developer hesabı ($99/yıl) |
| Play Store geliştirici hesabı ($25 tek seferlik) | play.google.com/console |

**Bu ortamda yapamadıklarım** (Xcode/Android Studio yok): native build almak, store'a
yayınlamak. Kod EAS Build veya kendi Mac'inde derlenmeye hazır.

## Sıradaki adım

Web sürümü MVP olarak tam. İstersen ekleyebileceklerim: SEO için birkaç içerik sayfası
(AdSense onayını kolaylaştırır), sonuç ekranını sosyal medyada paylaşılabilir görsele
çevirme, ya da mobil tarafta kaldığımız Aşama 9/10 (build süreçleri, eksik production
listesi). Söyle, devam edeyim.
