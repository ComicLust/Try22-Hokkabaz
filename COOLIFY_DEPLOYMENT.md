# Coolify Deployment Rehberi

Bu proje Coolify üzerinde deploy edilmek için optimize edilmiştir.

## 🚀 Deployment Adımları

### 1. Environment Variables
Coolify'da aşağıdaki environment variable'ları ayarlayın:

```env
DATABASE_URL=your_database_url
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id
NODE_ENV=production
```

### 2. Volume Mount (ÖNEMLİ!)
Görsel yüklemelerinin kalıcı olması için Coolify'da volume mount ayarlamanız gerekiyor:

**Coolify Dashboard'da:**
1. Service Settings > Storage sekmesine gidin
2. "Add Volume" butonuna tıklayın
3. Aşağıdaki ayarları yapın:
   - **Source**: `uploads_data` (volume adı)
   - **Destination**: `/app/public/uploads`
   - **Type**: `volume`

### 3. Port Ayarları
- **Container Port**: `3000`
- **Public Port**: İstediğiniz port (örn: 80, 443)

### 4. Build Settings
Coolify otomatik olarak `Dockerfile`'ı kullanacaktır. Ek ayar gerekmez.

## 🔧 Özellikler

### Görsel Yükleme Sistemi
- Yüklenen görseller `/app/public/uploads` klasöründe saklanır
- Volume mount sayesinde container yeniden başlatıldığında görseller kaybolmaz
- Desteklenen formatlar: PNG, JPG, WebP, GIF
- Maksimum dosya boyutu: 10MB

### Health Check
- Endpoint: `/api/health`
- Uploads klasörünün erişilebilirliğini kontrol eder
- Docker health check için kullanılır

### Logging
- Upload işlemleri console'a loglanır
- Hata durumları detaylı şekilde raporlanır

## 🐛 Sorun Giderme

### Görsel Yükleme Çalışmıyor
1. Volume mount'un doğru yapıldığını kontrol edin
2. `/api/health` endpoint'ini kontrol edin
3. Container loglarını inceleyin

### Container Başlamıyor
1. Environment variable'ların doğru ayarlandığını kontrol edin
2. Database bağlantısını kontrol edin
3. Build loglarını inceleyin

## 📝 Notlar

- Bu proje Next.js standalone output kullanır
- Prisma client otomatik olarak generate edilir
- Socket.IO desteği mevcuttur
- OneSignal push notification entegrasyonu hazırdır

## 🔗 Faydalı Linkler

- [Coolify Documentation](https://coolify.io/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Volumes](https://docs.docker.com/storage/volumes/)