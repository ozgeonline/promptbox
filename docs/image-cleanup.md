# Prompt ve görsel silme kurulumu

Uygulama artık prompt/klasör silme işlemini `delete-content` Supabase Edge
Function üzerinden yapar. Bu fonksiyon yayınlanmadan yeni uygulama sürümündeki
silme düğmeleri kayıt silmez. Önce aşağıdaki kurulumu tamamlayın, sonra siteyi
yeniden yayınlayın.

## 1. Veritabanı

Supabase projesinin SQL Editor bölümünde
`supabase/migrations/20261024000000_prompt_image_cleanup.sql` dosyasını çalıştırın.
Bu işlem mevcut promptları/görselleri silmez. Silinen promptların görsel adresini,
aynı veritabanı işlemi içinde `prompt_image_cleanup` kuyruğuna kaydeder. Klasör
silme için mevcut `prompts.folder_id → folders.id ON DELETE CASCADE` ilişkisi
korunmalıdır. Kuyruk tarayıcı kullanıcılarına açık değildir.

## 2. Sunucu sırları

Supabase Dashboard → Edge Functions → Secrets bölümünde tanımlayın:

| İsim | Değer |
| --- | --- |
| `UPLOADTHING_TOKEN` | Eski dosyaların bulunduğu UploadThing uygulamasının v7 token'ı |
| `ADMIN_EMAILS` | Yönetici Google hesaplarının e-posta adresleri, virgülle ayrılmış |

UploadThing token'ını UploadThing panelindeki ilgili uygulamanın API Keys
bölümünden alın. `ADMIN_EMAILS`, arayüzdeki `VITE_ADMIN_EMAILS` ile aynı yöneticileri
içermelidir; ancak sunucu bu listeyi bağımsız olarak doğrular. Token'ı `VITE_`
değişkenine veya React koduna koymayın. Supabase kendi URL ve service-role
değerlerini fonksiyona sağlar; bunları tarayıcıya eklemeyin.

## 3. Fonksiyonu yayınlama

Supabase CLI ile, proje kökünde:

```powershell
npx supabase login
npx supabase functions deploy delete-content --project-ref PROJE_REFERANSI
```

`PROJE_REFERANSI`, Supabase projesinin Settings → General bölümündeki Reference
ID değeridir. Fonksiyonun JWT doğrulamasını açık tutun. Dosyalar
`supabase/functions/delete-content/` ve ortak modül
`supabase/functions/_shared/imageReferences.ts` içindedir; Deno bağımlılıkları
fonksiyonun `deno.json` dosyasında tanımlıdır.

Ardından `npm run build` ile siteyi yeniden yayınlayın. Yeni fonksiyon yayınlanana
kadar eski site sürümünde silme yapmayın: eski sürüm dosya temizliğini çağırmaz.

## Davranış ve tekrar deneme

- İstek sadece kayıt kimlikleri alır. Kullanıcı sunucu tarafında doğrulanır;
  yönetici tüm kayıtları, diğer kullanıcılar kendi kayıtlarını silebilir.
- Prompt silinmeden hiçbir dosya silinmez. Kuyruk kurulmamışsa silme durdurulur.
- Base64 görsel prompt ile birlikte silinir; ayrı bir depolama işlemi yapılmaz.
- UploadThing dosyaları yalnızca sunucuda doğrulanmış yönetici tarafından silinir.
  Diğer kullanıcıların eski UploadThing görselleri yöneticinin temizliği için
  kuyrukta kalır. Bu sınır, dış görsel URL'sinin yükleyenin kimliğini
  kanıtlamamasından kaynaklanır.
- Yeni Supabase görselleri `prompt-images/<kayıt sahibi>/...` yolunda olmalıdır.
- Bilinen varsayılan görsel, başka promptların kullandığı dosyalar ve diğer
  harici URL'ler silinmez. Ortak dosyanın son promptu silinirse yeniden kuyruğa girer.
- Her çağrı en fazla 10 kuyruk kaydını işler. Hata veya daha fazla kayıt varsa
  kullanıcıya bekleyen temizlik bildirilir. Yönetim panelindeki **Bekleyen
  görselleri temizle** düğmesiyle tekrar denenir. Otomatik zamanlayıcı yoktur.
- UploadThing token'ı dosyanın bulunduğu uygulamaya ait olmalıdır. Dosya sunucusu
  işlemi başarısız olursa kayıt kuyrukta kalır; prompt zaten silinmiştir.
- Kuyruk yalnızca bu kurulumdan sonraki silmeleri yakalar. Daha önce silinen
  promptların sahipsiz dosyalarını kendiliğinden bulmaz.

## Doğrulama

Gerçek dosya silme işlemlerini önce deneme promptlarıyla kontrol edin:

1. Yönetici hesabıyla, yalnızca test promptunun kullandığı bir UploadThing
   görselini silin; hem prompt kaydını hem UploadThing dosyasını kontrol edin.
2. Aynı görseli kullanan iki test promptundan birini silin; görsel kalmalıdır.
3. Varsayılan görselli ve Base64 görselli test promptlarını silin.
4. Yeni yüklenmiş Supabase görselli test promptunu silin; dosya temizlenmelidir.
5. Dosya servisi başarısız olursa kuyruk kaydının kaldığını ve tekrar deneme
   düğmesinin çalıştığını kontrol edin.

Yerel otomatik kontroller gerçek Supabase/UploadThing verisi silmez:

```powershell
npm test -- --run src/__tests__/imageCleanup.test.ts
npx deno check --config supabase/functions/delete-content/deno.json supabase/functions/delete-content/index.ts
npm run build
```

Kaynaklar: [UploadThing UTApi](https://docs.uploadthing.com/api-reference/ut-api),
[Supabase function secrets](https://supabase.com/docs/guides/functions/secrets).
