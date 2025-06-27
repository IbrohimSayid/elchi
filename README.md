# 🎭 Anonim Chat Bot

Bu Telegram bot ikki foydalanuvchini anonim bog'lab, ular o'rtasida maxfiy suhbat yaratadi.

## 🚀 Xususiyatlar

- ✅ Anonim suhbat (foydalanuvchilar bir-birlarini ko'rmaydi)
- 🔄 Avtomatik hamkor qidirish
- 💬 Barcha turdagi xabarlarni qo'llab-quvvatlaydi (matn, rasm, video, audio, voice, sticker, fayl)
- 🛑 Suhbatni istalgan vaqtda tugatish imkoniyati
- 👑 Admin panel - foydalanuvchilarni boshqarish
- 📊 Foydalanuvchilar statistikasi
- 🎨 Welcome rasm bilan chiroyli interface
- ⚡ Tez va oson ishlatish

## 📋 Foydalanuvchi komandalar

- `/start` - Botni ishga tushirish va avtomatik chat tizimi
- `/stop` - Joriy suhbatni tugatish
- `/exit` - Navbatdan chiqish

## 👑 Admin komandalar

- `/admin` - Admin panelga kirish va foydalanuvchilar ro'yxatini ko'rish
- `/adminexit` - Admin rejimidan chiqish
- `/delete_[USER_ID]` - Foydalanuvchini tizimdan o'chirish

## 🛠️ O'rnatish va ishga tushirish

1. Loyihani klonlash:
```bash
git clone <repository-url>
cd elchi
```

2. Bog'liqliklarni o'rnatish:
```bash
npm install
```

3. Welcome rasm qo'shish (ixtiyoriy):
   - `images/gul.jpeg` fayli allaqachon qo'shilgan
   - Agar rasm bo'lmasa, oddiy text xabar yuboriladi

4. Botni ishga tushirish:
```bash
npm start
```

yoki development rejimida:
```bash
npm run dev
```

## ⚙️ Konfiguratsiya

Bot tokeni `bot.js` faylida ko'rsatilgan. Admin ID larini qo'shish uchun `adminIds` massiviga ID larni qo'shing.

## 🎯 Qanday ishlaydi

### Oddiy foydalanuvchilar uchun:
1. **Botga kirish** - `/start` buyrug'i (welcome rasm va xabar)
2. **Hamkor qidirish** - `/find` buyrug'i
3. **Kutish** - "Ikkinchi odamni kutib turing" xabari
4. **Bog'lanish** - "Aloqada! Suhbat boshlandi!" xabari
5. **Anonim suhbat** - barcha xabarlar "🎭 Anonim: (xabar)" formatida
6. **Suhbatni tugatish** - `/stop` buyrug'i

### Admin uchun:
1. **Admin panelga kirish** - `/admin` buyrug'i
2. **Foydalanuvchilar ro'yxati** - ID, ism, familiya, username ko'rish
3. **Foydalanuvchini o'chirish** - `/delete_[USER_ID]` buyrug'i
4. **Admin rejimidan chiqish** - `/adminexit` buyrug'i

## 💬 Xabar formatlari

- **Text xabar:** `🎭 Anonim: Salom!`
- **Rasm:** `🎭 Anonim: 📷 Rasm yubordi`
- **Video:** `🎭 Anonim: 🎥 Video yubordi`
- **Ovozli xabar:** `🎭 Anonim: 🎤 Ovozli xabar yubordi`
- **Fayl:** `🎭 Anonim: 📎 Fayl yubordi`
- **Sticker:** `🎭 Anonim: 😄 Sticker yubordi`

## ⚠️ Qoidalar

- Hurmatli munosabatda bo'ling
- Shaxsiy ma'lumotlarni bo'lishmang
- Qonunga zid harakatlar qilmang

## 🔧 Texnik ma'lumotlar

- **Node.js** - JavaScript runtime
- **node-telegram-bot-api** - Telegram Bot API uchun kutubxona
- **fs & path** - Fayl tizimi bilan ishlash
- **Xotira bazasi** - Ma'lumotlar faqat xotirada saqlanadi

## 📂 Fayl strukturasi

```
elchi/
├── bot.js              # Asosiy bot kodi
├── package.json        # Bog'liqliklar
├── README.md          # Dokumentatsiya
├── images/            # Rasmlar papkasi
│   └── gul.jpeg       # Welcome rasm
└── node_modules/      # Node.js paketlari
```

## 📝 Litsenziya

MIT License 