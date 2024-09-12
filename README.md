# Discord.js v14 Çekiliş Botu

Bu proje, Discord.js v14 kullanılarak oluşturulmuş gelişmiş bir çekiliş botudur. Sunucunuzda kolayca çekilişler düzenleyebilir, yönetebilir ve sonuçlandırabilirsiniz.

## Özellikler

- Discord.js v14 ile geliştirilmiş
- Slash komutları desteği
- Çekiliş başlatma, düzenleme, bitirme ve yeniden çekme özellikleri
- Katılımcı sayısını gerçek zamanlı güncelleme
- Esnek süre formatı (örn: 1d 6h 30m)
- Çoklu sunucu desteği
- Otomatik çekiliş bitirme

## Kurulum

1. Repoyu klonlayın veya ZIP olarak indirin
2. Proje dizinine gidin ve `npm install` komutunu çalıştırarak bağımlılıkları yükleyin
3. `config.json` dosyasını oluşturun ve bot tokeninizi ekleyin:
   ```json
   {
     "token": "YOUR_BOT_TOKEN_HERE"
   }
   ```
4. `node index.js` komutu ile botu başlatın

## Kullanım

Bot aşağıdaki slash komutlarını destekler:

- `/start`: Yeni bir çekiliş başlatır
- `/edit`: Mevcut bir çekilişi düzenler
- `/end`: Bir çekilişi sonlandırır
- `/reroll`: Bir çekilişi yeniden çeker
- `/list`: Aktif çekilişleri listeler

## Destek

Herhangi bir sorunuz veya öneriniz varsa, doğrudan benimle iletişime geçin.

[![Discord Profilim](https://img.shields.io/badge/Discord-Profilim-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/users/657241749579759616)

## Topluluk

Discord sunucumuzdan diğer altyapılarımıza ulaşabilirsiniz!

[![Discord Banner](https://api.weblutions.com/discord/invite/msidev/)](https://discord.gg/msidev)

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın.
