const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Bot tokenni o'rnatish
const token = process.env.bot_token || '8291474284:AAFw1WC3UxjxpvWZN6cDhfK4F5m_NgVgrOk';
let bot;

// Muhitni aniqlash (Production yoki Development)
if (process.env.NODE_ENV === 'production') {
    // Production (Railway) - Webhook
    bot = new TelegramBot(token, { polling: false });
    const app = express();
    app.use(express.json());

    // Webhook endpoint
    app.post(`/bot${token}`, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });

    // Health check
    app.get('/', (req, res) => {
        res.send('Anonim Chat Bot is running!');
    });

    const port = process.env.PORT || 3000;
    app.listen(port, async () => {
        console.log(`🚀 Server running on port ${port}`);
        // Webhookni sozlash
        const webhookUrl = `${process.env.WEBHOOK_URL}/bot${token}`;
        try {
            await bot.setWebHook(webhookUrl);
            console.log(`✅ Webhook set to: ${webhookUrl}`);
        } catch (error) {
            console.error('❌ Error setting webhook:', error);
        }
    });
} else {
    // Development (Local) - Polling
    bot = new TelegramBot(token, { polling: true });
    console.log('🔄 Bot started in Polling mode (Local)');
}

// Ma'lumotlar bazasi (xotirada)
let waitingUsers = []; // Kutayotgan foydalanuvchilar
let activeChats = {}; // Faol suhbatlar: {userId1: userId2, userId2: userId1}
let allUsers = {}; // Barcha foydalanuvchilar ma'lumoti
let adminMode = {}; // Admin rejimidagi foydalanuvchilar

// Admin ID-lari (o'zgartirishingiz mumkin)
const adminIds = []; // Bu yerga admin ID larini qo'shing

const registerUser = (chatId, user) => {
    if (!allUsers[chatId]) {
        allUsers[chatId] = {
            id: chatId,
            firstName: user.first_name || 'N/A',
            lastName: user.last_name || 'N/A',
            username: user.username || 'N/A',
            joinDate: new Date().toISOString()
        };
    } else {
        allUsers[chatId].lastSeen = new Date().toISOString();
    }
};

const sendWelcomeSequence = async (chatId) => {
    const imagePath = path.join(__dirname, 'images', 'gul.jpeg');
    if (fs.existsSync(imagePath)) {
        await bot.sendPhoto(chatId, imagePath);
    }

    const waitingMessage = `🌸 <b>Iyye, xush kelibsiz!</b>

🌹 Bu gul sizga. Hozir kelaman, kutib turing 😉
🚫 Ketib qolish yo'q lekin, heeeyy!

⏳ <b>Iltimos kutib turing...</b>`;

    await bot.sendMessage(chatId, waitingMessage, { parse_mode: 'HTML' });
};

// Start komandasi
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;

    // Agar foydalanuvchi allaqachon faol suhbatda bo'lsa
    if (activeChats[chatId]) {
        bot.sendMessage(chatId, '⚠️ Siz allaqachon faol suhbatdasiz! Suhbatni tugatish uchun /stop buyrug\'ini ishlating.');
        return;
    }

    // Agar foydalanuvchi allaqachon kutish navbatida bo'lsa
    if (waitingUsers.includes(chatId)) {
        bot.sendMessage(chatId, '⚠️ Siz allaqachon navbatdasiz! Ikkinchi foydalanuvchi kirishini kutib turing.');
        return;
    }

    // 3-chi user tekshiruvi - faqat 2 ta user bo'lishi kerak
    const totalActiveUsers = Object.keys(activeChats).length + waitingUsers.length;
    if (totalActiveUsers >= 2) {
        bot.sendMessage(chatId, '🚫 Siz ortiqchasiz ko\'zingizni qisib o\'tiring🤌🏽\n\n💡 Bot faqat 2 ta foydalanuvchi uchun mo\'ljallangan. Biror kishi chiqgandan keyin qaytadan urinib ko\'ring.');
        return;
    }

    // Foydalanuvchi ma'lumotlarini saqlash
    registerUser(chatId, user);

    // Har doim welcome rasm va xabar yuborish
    await sendWelcomeSequence(chatId);

    // Agar navbatda kimdir kutayotgan bo'lsa
    if (waitingUsers.length > 0) {
        // Navbatdagi birinchi foydalanuvchini olish
        const partnerId = waitingUsers.shift();

        // Ikkala foydalanuvchini faol chatga qo'shish
        activeChats[chatId] = partnerId;
        activeChats[partnerId] = chatId;

        // Yangi kelgan foydalanuvchiga text xabar
        const joinedMessage = `🎉 <b>Ikkinchi odam qo'shildi suhbat boshlandi!</b> 💬✨

🎭 <b>Anonim Chat Bot</b>ga xush kelibsiz!

✅ Hamkor topildi va suhbat boshlandi
💬 Endi anonim suhbat qilishingiz mumkin
🎪 Barcha xabarlar "Anonim:" prefiksi bilan uzatiladi

📋 <b>Yordam komandalar:</b>
🛑 /stop - Suhbatni tugatish
🚪 /exit - Navbatdan chiqish

🎉 <b>Yaxshi suhbat qiling!</b>`;

        bot.sendMessage(chatId, joinedMessage, { parse_mode: 'HTML' });

        // Kutayotgan foydalanuvchiga text xabar (Bu yer tuzatildi!)
        const partnerMessage = `🎉 <b>Ikkinchi odam qo'shildi suhbat boshlandi!</b> 💬✨

🎭 <b>Anonim Chat Bot</b>da suhbat boshlandi!

✅ Yangi hamkor topildi
💬 Endi anonim suhbat qilishingiz mumkin  
🎪 Barcha xabarlar "Anonim:" prefiksi bilan uzatiladi

📋 <b>Yordam komandalar:</b>
🛑 /stop - Suhbatni tugatish
🚪 /exit - Navbatdan chiqish

🎉 <b>Yaxshi suhbat qiling!</b>`;

        bot.sendMessage(partnerId, partnerMessage, { parse_mode: 'HTML' });

        // Birinchi foydalanuvchiga hamkor kirgani haqida xabar
        const partnerJoinedNotice = `🚀 <b>Gazini bosing!</b>\nHamkoringiz kirdi va suhbat tayyor. 😊`;
        bot.sendMessage(partnerId, partnerJoinedNotice, { parse_mode: 'HTML' });

    } else {
        // Birinchi foydalanuvchi - navbatga qo'shish
        waitingUsers.push(chatId);
    }
});

// Admin komandasi
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;

    // Admin huquqlarini tekshirish (hozircha barcha foydalanuvchilar admin bo'lishi mumkin)
    adminMode[chatId] = true;

    let usersList = "🔧 <b>ADMIN PANEL</b> 🔧\n";
    usersList += "👥 <b>Foydalanuvchilar ro'yxati:</b>\n\n";

    const userCount = Object.keys(allUsers).length;
    if (userCount === 0) {
        usersList += "📭 Hech qanday foydalanuvchi yo'q.\n\n";
    } else {
        let count = 1;
        for (const userId in allUsers) {
            const user = allUsers[userId];
            const isActive = activeChats[userId] ? "🟢 Faol" : "🔴 Nofaol";
            const isWaiting = waitingUsers.includes(parseInt(userId)) ? "⏳ Kutmoqda" : "";

            usersList += `${count}. ${isActive} ${isWaiting}\n`;
            usersList += `🆔 <b>ID:</b> ${user.id}\n`;
            usersList += `👤 <b>Ism:</b> ${user.firstName}\n`;
            usersList += `👥 <b>Familiya:</b> ${user.lastName}\n`;
            usersList += `📝 <b>Username:</b> @${user.username}\n`;
            usersList += `📅 <b>Qo'shilgan:</b> ${new Date(user.joinDate).toLocaleString()}\n`;
            usersList += `🗑️ <b>O'chirish:</b> /del${user.id}\n\n`;
            count++;
        }
    }

    usersList += "📊 <b>Statistika:</b>\n";
    usersList += `👥 Jami foydalanuvchilar: ${userCount}\n`;
    usersList += `💬 Faol suhbatlar: ${Object.keys(activeChats).length / 2}\n`;
    usersList += `⏳ Kutayotganlar: ${waitingUsers.length}\n\n`;

    usersList += "🔧 <b>Admin komandalar:</b>\n";
    usersList += "🚪 /adminexit - Adminlikdan chiqish\n";
    usersList += "🗑️ /del[ID] - Foydalanuvchini o'chirish\n";
    usersList += "📊 /stats - Statistika\n";
    usersList += "🧹 /clear - Barcha ma'lumotlarni tozalash\n";

    bot.sendMessage(chatId, usersList, { parse_mode: 'HTML' });
});

// Adminlikdan chiqish
bot.onText(/\/adminexit/, (msg) => {
    const chatId = msg.chat.id;

    if (adminMode[chatId]) {
        delete adminMode[chatId];
        bot.sendMessage(chatId, '✅ Adminlikdan chiqdingiz. Endi oddiy foydalanuvchi rejimida ishlaysiz. 👤');
    } else {
        bot.sendMessage(chatId, '❗ Siz admin rejimida emassiz.');
    }
});

// Statistika ko'rish
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;

    if (!adminMode[chatId]) {
        bot.sendMessage(chatId, '❗ Bu komanda faqat admin rejimida ishlaydi. 🔒');
        return;
    }

    const userCount = Object.keys(allUsers).length;
    const activeChatCount = Object.keys(activeChats).length / 2;
    const waitingCount = waitingUsers.length;

    let statsMessage = "📊 <b>DETALLI STATISTIKA</b> 📊\n\n";

    statsMessage += "👥 <b>Foydalanuvchilar:</b>\n";
    statsMessage += `├── Jami: ${userCount}\n`;
    statsMessage += `├── Faol suhbatda: ${Object.keys(activeChats).length}\n`;
    statsMessage += `└── Kutayotganlar: ${waitingCount}\n\n`;

    statsMessage += "💬 <b>Suhbatlar:</b>\n";
    statsMessage += `├── Faol chatlar: ${activeChatCount}\n`;
    statsMessage += `└── Navbatda kutuvchilar: ${waitingCount}\n\n`;

    statsMessage += "🕒 <b>Vaqt:</b>\n";
    statsMessage += `└── Hozir: ${new Date().toLocaleString()}\n\n`;

    if (userCount > 0) {
        statsMessage += "👤 <b>Oxirgi foydalanuvchilar:</b>\n";
        const recentUsers = Object.values(allUsers).slice(-3);
        recentUsers.forEach((user, index) => {
            statsMessage += `${index + 1}. ${user.firstName} (ID: ${user.id})\n`;
        });
    }

    bot.sendMessage(chatId, statsMessage, { parse_mode: 'HTML' });
});

// Barcha ma'lumotlarni tozalash
bot.onText(/\/clear/, (msg) => {
    const chatId = msg.chat.id;

    if (!adminMode[chatId]) {
        bot.sendMessage(chatId, '❗ Bu komanda faqat admin rejimida ishlaydi. 🔒');
        return;
    }

    // Barcha faol foydalanuvchilarga xabar yuborish
    Object.keys(activeChats).forEach(userId => {
        bot.sendMessage(userId, '🧹 Admin tomonidan barcha ma\'lumotlar tozalandi. Bot qayta ishga tushirildi.');
    });

    waitingUsers.forEach(userId => {
        bot.sendMessage(userId, '🧹 Admin tomonidan barcha ma\'lumotlar tozalandi. Bot qayta ishga tushirildi.');
    });

    // Ma'lumotlarni tozalash
    const userCount = Object.keys(allUsers).length;
    const chatCount = Object.keys(activeChats).length / 2;
    const waitingCount = waitingUsers.length;

    waitingUsers = [];
    activeChats = {};
    allUsers = {};

    bot.sendMessage(chatId, `🧹 <b>Barcha ma'lumotlar tozalandi!</b>\n\n📊 O'chirilgan:\n├── ${userCount} foydalanuvchi\n├── ${chatCount} faol chat\n└── ${waitingCount} kutuvchi\n\n✅ Tizim tozalandi!`, { parse_mode: 'HTML' });
});

// Foydalanuvchini o'chirish
bot.onText(/\/del(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const targetUserId = match[1].toString();

    if (!adminMode[chatId]) {
        bot.sendMessage(chatId, '❗ Bu komanda faqat admin rejimida ishlaydi. 🔒');
        return;
    }

    // targetUserId ni number va string sifatida tekshirish
    const targetUserIdNum = parseInt(targetUserId);
    const userKey = allUsers[targetUserId] ? targetUserId : (allUsers[targetUserIdNum] ? targetUserIdNum : null);

    if (userKey && allUsers[userKey]) {
        const deletedUser = allUsers[userKey];

        // Foydalanuvchiga o'chirilish haqida xabar yuborish (bot to'xtatilishidan oldin)
        try {
            bot.sendMessage(userKey, '🚫 Admin tomonidan tizimdan o\'chirildingiz. Bot sizni artiq tanimaydida. Qaytadan /start bosib kirish uchun qayta urinishingiz mumkin.');
        } catch (error) {
            console.log(`Foydalanuvchi ${userKey} ga xabar yuborishda xatolik:`, error.message);
        }

        // Agar o'chirilayotgan foydalanuvchi faol suhbatda bo'lsa
        if (activeChats[userKey]) {
            const partnerId = activeChats[userKey];
            delete activeChats[userKey];
            delete activeChats[partnerId];

            try {
                bot.sendMessage(partnerId, '❌ Hamkoringiz tizimdan o\'chirildi. Suhbat tugadi. Yangi suhbat uchun /start bosing. 😔');
            } catch (error) {
                console.log(`Partner ${partnerId} ga xabar yuborishda xatolik:`, error.message);
            }
        }

        // Navbatdan o'chirish
        const waitingIndex = waitingUsers.indexOf(parseInt(userKey));
        if (waitingIndex > -1) {
            waitingUsers.splice(waitingIndex, 1);
        }

        // String formatdagi indexni ham tekshirish
        const waitingIndexStr = waitingUsers.indexOf(userKey.toString());
        if (waitingIndexStr > -1) {
            waitingUsers.splice(waitingIndexStr, 1);
        }

        // Foydalanuvchini allUsers dan o'chirish
        delete allUsers[userKey];

        bot.sendMessage(chatId, `✅ Foydalanuvchi o'chirildi:\n👤 <b>Ism:</b> ${deletedUser.firstName}\n🆔 <b>ID:</b> ${userKey}\n\n💡 O'chirilgan foydalanuvchi qaytadan /start bossa, yangi foydalanuvchi sifatida qabul qilinadi.`, { parse_mode: 'HTML' });

        // Yangi admin panel ko'rsatish
        setTimeout(() => {
            bot.sendMessage(chatId, '/admin - Yangilangan ro\'yxatni ko\'rish uchun');
        }, 1000);

    } else {
        bot.sendMessage(chatId, '❗ Bunday foydalanuvchi topilmadi. 🤷‍♂️\n\n💡 ID ni to\'g\'ri nusxalashni tekshiring.');
    }
});

// Suhbatni tugatish
bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;

    if (activeChats[chatId]) {
        const partnerId = activeChats[chatId];

        // Suhbatni tugatish
        delete activeChats[chatId];
        delete activeChats[partnerId];

        // Har ikkala foydalanuvchiga xabar yuborish
        bot.sendMessage(chatId, '❌ Suhbat tugadi. Yangi suhbat uchun /start buyrug\'ini bering. 👋');
        bot.sendMessage(partnerId, '❌ Hamkoringiz suhbatni tugatdi. Yangi suhbat uchun /start buyrug\'ini bering. 😢');
    } else {
        bot.sendMessage(chatId, '❗ Siz hozir suhbatda emassiz. 🤔');
    }
});

// Navbatdan chiqish
bot.onText(/\/exit/, (msg) => {
    const chatId = msg.chat.id;

    const index = waitingUsers.indexOf(chatId);
    if (index > -1) {
        waitingUsers.splice(index, 1);
        bot.sendMessage(chatId, '❌ Siz navbatdan chiqarildingiz. Yangi suhbat uchun /start bering. 🚪');
    } else {
        bot.sendMessage(chatId, '❗ Siz navbatda emassiz. 🤷‍♂️');
    }
});

// Oddiy xabarlarni boshqarish
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;

    // Foydalanuvchini ro'yxatdan o'tkazish (agar /start bosmasdan xabar yuborsa ham)
    if (user) {
        registerUser(chatId, user);
    }

    // Komandalarni e'tiborsiz qoldirish
    if (msg.text && msg.text.startsWith('/')) {
        return;
    }

    // Admin rejimida bo'lsa, xabarlarni uzatmaslik
    if (adminMode[chatId]) {
        return;
    }

    // Agar foydalanuvchi faol suhbatda bo'lsa
    if (activeChats[chatId]) {
        const partnerId = activeChats[chatId];

        // Hamkor hali ham mavjudligini tekshirish
        if (!allUsers[partnerId]) {
            // Hamkor o'chirilgan bo'lsa, suhbatni tugatish
            delete activeChats[chatId];
            delete activeChats[partnerId];
            bot.sendMessage(chatId, '❌ Hamkoringiz tizimdan o\'chirildi. Suhbat tugadi. Yangi suhbat uchun /start bosing.');
            return;
        }

        // Xabar turini aniqlash va hamkorga yuborish
        if (msg.text) {
            bot.sendMessage(partnerId, `🎭 <b>Anonim:</b> ${msg.text}`, { parse_mode: 'HTML' });
        } else if (msg.photo) {
            bot.sendPhoto(partnerId, msg.photo[msg.photo.length - 1].file_id, {
                caption: msg.caption ? `🎭 <b>Anonim:</b> ${msg.caption}` : '🎭 <b>Anonim:</b> 📷 Rasm yubordi',
                parse_mode: 'HTML'
            });
        } else if (msg.voice) {
            bot.sendVoice(partnerId, msg.voice.file_id);
            bot.sendMessage(partnerId, '🎭 <b>Anonim:</b> 🎤 Ovozli xabar yubordi', { parse_mode: 'HTML' });
        } else if (msg.video) {
            bot.sendVideo(partnerId, msg.video.file_id, {
                caption: msg.caption ? `🎭 <b>Anonim:</b> ${msg.caption}` : '🎭 <b>Anonim:</b> 🎥 Video yubordi',
                parse_mode: 'HTML'
            });
        } else if (msg.document) {
            bot.sendDocument(partnerId, msg.document.file_id, {
                caption: msg.caption ? `🎭 <b>Anonim:</b> ${msg.caption}` : '🎭 <b>Anonim:</b> 📎 Fayl yubordi',
                parse_mode: 'HTML'
            });
        } else if (msg.sticker) {
            bot.sendSticker(partnerId, msg.sticker.file_id);
            bot.sendMessage(partnerId, '🎭 <b>Anonim:</b> 😄 Sticker yubordi', { parse_mode: 'HTML' });
        } else if (msg.audio) {
            bot.sendAudio(partnerId, msg.audio.file_id, {
                caption: msg.caption ? `🎭 <b>Anonim:</b> ${msg.caption}` : '🎭 <b>Anonim:</b> 🎵 Audio yubordi',
                parse_mode: 'HTML'
            });
        } else if (msg.video_note) {
            bot.sendVideoNote(partnerId, msg.video_note.file_id);
            bot.sendMessage(partnerId, '🎭 <b>Anonim:</b> 📹 Video xabar yubordi', { parse_mode: 'HTML' });
        } else {
            // Boshqa turdagi xabarlar
            bot.sendMessage(partnerId, '🎭 <b>Anonim:</b> 📎 Media fayl yubordi', { parse_mode: 'HTML' });
        }
    } else {
        // Agar suhbatda bo'lmasa va navbatda ham bo'lmasa
        if (!waitingUsers.includes(chatId)) {
            // Ikkinchi odam yo'q degan xabar
            bot.sendMessage(chatId, '😴 Ko\'zingizni qising! Ikkinchi odam yo\'q. /start buyrug\'ini bering va hamkor kutib turing... 👁️‍🗨️');
        } else {
            // Navbatda kutayotgan bo'lsa
            bot.sendMessage(chatId, '⏳ Siz navbatdasiz. Ikkinchi foydalanuvchi kirishini sabr bilan kutib turing...');
        }
    }
});

// Bot ishga tushganini bildirish
console.log('🤖 Anonim Chat Bot ishga tushdi!');
console.log('📱 Telegram orqali botni toping va /start buyrug\'ini bering.');

// Xatolarni boshqarish
bot.on('error', (error) => {
    console.log('❌ Xatolik:', error);
});

// Bot to'xtatilganda ma'lumotlarni tozalash
process.on('SIGINT', () => {
    console.log('\n🔄 Bot to\'xtatilmoqda...');

    // Barcha faol foydalanuvchilarga xabar yuborish
    Object.keys(activeChats).forEach(chatId => {
        bot.sendMessage(chatId, '🛑 Bot texnik ishlar uchun to\'xtatildi. Keyinroq qayta urinib ko\'ring. 🔧');
    });

    // Ma'lumotlarni tozalash
    waitingUsers = [];
    activeChats = {};
    allUsers = {};
    adminMode = {};

    console.log('✅ Bot to\'xtatildi.');
    process.exit(0);
});