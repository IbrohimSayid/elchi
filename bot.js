const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Bot tokenni o'rnatish
const token = '8135909254:AAE289D4zgap2B-LHGqoCSQEZTnJ2WW2mac';
const bot = new TelegramBot(token, { polling: true });

// Ma'lumotlar bazasi (xotirada)
let waitingUsers = []; // Kutayotgan foydalanuvchilar
let activeChats = {}; // Faol suhbatlar: {userId1: userId2, userId2: userId1}
let allUsers = {}; // Barcha foydalanuvchilar ma'lumoti
let adminMode = {}; // Admin rejimidagi foydalanuvchilar

// Admin ID-lari (o'zgartirishingiz mumkin)
const adminIds = []; // Bu yerga admin ID larini qo'shing

// Start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    
    // Foydalanuvchi ma'lumotlarini saqlash
    allUsers[chatId] = {
        id: chatId,
        firstName: user.first_name || 'N/A',
        lastName: user.last_name || 'N/A',
        username: user.username || 'N/A',
        joinDate: new Date().toISOString()
    };
    
    // Agar navbatda kimdir kutayotgan bo'lsa
    if (waitingUsers.length > 0) {
        // Navbatdagi birinchi foydalanuvchini olish
        const partnerId = waitingUsers.shift();
        
        // Ikkala foydalanuvchini faol chatga qo'shish
        activeChats[chatId] = partnerId;
        activeChats[partnerId] = chatId;
        
        // Yangi kelgan foydalanuvchiga rasm yuborish
        const imagePath = path.join(__dirname, 'images', 'gul.jpeg');
        if (fs.existsSync(imagePath)) {
            bot.sendPhoto(chatId, imagePath);
        }
        
        // Yangi kelgan foydalanuvchiga text xabar
        const joinedMessage = `🎉 *Ikkinchi odam qo'shildi suhbat boshlandi!* 💬✨

🎭 *Anonim Chat Bot*ga xush kelibsiz!

✅ Hamkor topildi va suhbat boshlandi
💬 Endi anonim suhbat qilishingiz mumkin
🎪 Barcha xabarlar "Anonim:" prefiksi bilan uzatiladi

📋 *Yordam komandalar:*
🛑 /stop - Suhbatni tugatish
🚪 /exit - Navbatdan chiqish

🎉 *Yaxshi suhbat qiling!*`;
        
        bot.sendMessage(chatId, joinedMessage, { parse_mode: 'Markdown' });
        
        // Kutayotgan foydalanuvchiga ham rasm yuborish
        if (fs.existsSync(imagePath)) {
            bot.sendPhoto(partnerId, imagePath);
        }
        
        // Kutayotgan foydalanuvchiga text xabar
        const partnerMessage = `🎉 *Ikkinchi odam qo'shildi suhbat boshlandi!* 💬✨

🎭 *Anonim Chat Bot*da suhbat boshlandi!

✅ Yangi hamkor topildi
💬 Endi anonim suhbat qilishingiz mumkin  
🎪 Barcha xabarlar "Anonim:" prefiksi bilan uzatiladi

📋 *Yordam komandalar:*
🛑 /stop - Suhbatni tugatish
🚪 /exit - Navbatdan chiqish

🎉 *Yaxshi suhbat qiling!*`;
        
        bot.sendMessage(partnerId, partnerMessage, { parse_mode: 'Markdown' });
        
    } else {
        // Birinchi foydalanuvchi - navbatga qo'shish
        waitingUsers.push(chatId);
        
        // Birinchi foydalanuvchiga rasm yuborish
        const imagePath = path.join(__dirname, 'images', 'gul.jpeg');
        if (fs.existsSync(imagePath)) {
            bot.sendPhoto(chatId, imagePath);
        }
        
        // Birinchi foydalanuvchiga text xabar
        const waitingMessage = `⏳ *Ikkinchi odam kirishi kutilmoqda...* 🙏

🎭 *Anonim Chat Bot*ga xush kelibsiz!

🔍 Hamkor qidirilmoqda...
⏰ Iltimos kutib turing
👥 Ikkinchi foydalanuvchi kirishini kutmoqda

📋 *Ma'lumot:*
• Siz birinchi foydalanuvchisiz
• Ikkinchi odam kirganda avtomatik bog'lanasiz
• Barcha suhbatlar anonim bo'ladi

📋 *Yordam komandalar:*
🚪 /exit - Navbatdan chiqish
🔄 /start - Qaytadan urinish

⏳ *Iltimos kutib turing...*`;
        
        bot.sendMessage(chatId, waitingMessage, { parse_mode: 'Markdown' });
    }
});

// Admin komandasi
bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    
    // Admin huquqlarini tekshirish (hozircha barcha foydalanuvchilar admin bo'lishi mumkin)
    adminMode[chatId] = true;
    
    let usersList = "🔧 *ADMIN PANEL* 🔧\n";
    usersList += "👥 *Foydalanuvchilar ro'yxati:*\n\n";
    
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
            usersList += `🆔 *ID:* \`${user.id}\`\n`;
            usersList += `👤 *Ism:* ${user.firstName}\n`;
            usersList += `👥 *Familiya:* ${user.lastName}\n`;
            usersList += `📝 *Username:* @${user.username}\n`;
            usersList += `📅 *Qo'shilgan:* ${new Date(user.joinDate).toLocaleString()}\n`;
            usersList += `🗑️ *O'chirish:* /del${user.id}\n\n`;
            count++;
        }
    }
    
    usersList += "📊 *Statistika:*\n";
    usersList += `👥 Jami foydalanuvchilar: ${userCount}\n`;
    usersList += `💬 Faol suhbatlar: ${Object.keys(activeChats).length / 2}\n`;
    usersList += `⏳ Kutayotganlar: ${waitingUsers.length}\n\n`;
    
    usersList += "🔧 *Admin komandalar:*\n";
    usersList += "🚪 /adminexit - Adminlikdan chiqish\n";
    usersList += "🗑️ /del[ID] - Foydalanuvchini o'chirish\n";
    usersList += "📊 /stats - Statistika\n";
    usersList += "🧹 /clear - Barcha ma'lumotlarni tozalash\n";
    
    bot.sendMessage(chatId, usersList, { parse_mode: 'Markdown' });
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
    
    let statsMessage = "📊 *DETALLI STATISTIKA* 📊\n\n";
    
    statsMessage += "👥 *Foydalanuvchilar:*\n";
    statsMessage += `├── Jami: ${userCount}\n`;
    statsMessage += `├── Faol suhbatda: ${Object.keys(activeChats).length}\n`;
    statsMessage += `└── Kutayotganlar: ${waitingCount}\n\n`;
    
    statsMessage += "💬 *Suhbatlar:*\n";
    statsMessage += `├── Faol chatlar: ${activeChatCount}\n`;
    statsMessage += `└── Navbatda kutuvchilar: ${waitingCount}\n\n`;
    
    statsMessage += "🕒 *Vaqt:*\n";
    statsMessage += `└── Hozir: ${new Date().toLocaleString()}\n\n`;
    
    if (userCount > 0) {
        statsMessage += "👤 *Oxirgi foydalanuvchilar:*\n";
        const recentUsers = Object.values(allUsers).slice(-3);
        recentUsers.forEach((user, index) => {
            statsMessage += `${index + 1}. ${user.firstName} (ID: ${user.id})\n`;
        });
    }
    
    bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
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
    
    bot.sendMessage(chatId, `🧹 *Barcha ma'lumotlar tozalandi!*\n\n📊 O'chirilgan:\n├── ${userCount} foydalanuvchi\n├── ${chatCount} faol chat\n└── ${waitingCount} kutuvchi\n\n✅ Tizim tozalandi!`, { parse_mode: 'Markdown' });
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
    if (allUsers[targetUserId] || allUsers[parseInt(targetUserId)]) {
        const userKey = allUsers[targetUserId] ? targetUserId : parseInt(targetUserId);
        const deletedUser = allUsers[userKey];
        delete allUsers[userKey];
        
        // Agar o'chirilayotgan foydalanuvchi faol suhbatda bo'lsa
        if (activeChats[userKey]) {
            const partnerId = activeChats[userKey];
            delete activeChats[userKey];
            delete activeChats[partnerId];
            bot.sendMessage(partnerId, '❌ Hamkoringiz tizimdan o\'chirildi. Suhbat tugadi. 😔');
        }
        
        // Navbatdan o'chirish (number formatda)
        const waitingIndex = waitingUsers.indexOf(parseInt(userKey));
        if (waitingIndex > -1) {
            waitingUsers.splice(waitingIndex, 1);
        }
        
        bot.sendMessage(chatId, `✅ Foydalanuvchi o'chirildi:\n👤 *Ism:* ${deletedUser.firstName}\n🆔 *ID:* ${userKey}`, { parse_mode: 'Markdown' });
        
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
        
        // Xabar turini aniqlash va hamkorga yuborish
        if (msg.text) {
            bot.sendMessage(partnerId, `🎭 *Anonim:* ${msg.text}`, { parse_mode: 'Markdown' });
        } else if (msg.photo) {
            bot.sendPhoto(partnerId, msg.photo[msg.photo.length - 1].file_id, {
                caption: msg.caption ? `🎭 *Anonim:* ${msg.caption}` : '🎭 *Anonim:* 📷 Rasm yubordi',
                parse_mode: 'Markdown'
            });
        } else if (msg.voice) {
            bot.sendVoice(partnerId, msg.voice.file_id);
            bot.sendMessage(partnerId, '🎭 *Anonim:* 🎤 Ovozli xabar yubordi', { parse_mode: 'Markdown' });
        } else if (msg.video) {
            bot.sendVideo(partnerId, msg.video.file_id, {
                caption: msg.caption ? `🎭 *Anonim:* ${msg.caption}` : '🎭 *Anonim:* 🎥 Video yubordi',
                parse_mode: 'Markdown'
            });
        } else if (msg.document) {
            bot.sendDocument(partnerId, msg.document.file_id, {
                caption: msg.caption ? `🎭 *Anonim:* ${msg.caption}` : '🎭 *Anonim:* 📎 Fayl yubordi',
                parse_mode: 'Markdown'
            });
        } else if (msg.sticker) {
            bot.sendSticker(partnerId, msg.sticker.file_id);
            bot.sendMessage(partnerId, '🎭 *Anonim:* 😄 Sticker yubordi', { parse_mode: 'Markdown' });
        } else if (msg.audio) {
            bot.sendAudio(partnerId, msg.audio.file_id, {
                caption: msg.caption ? `🎭 *Anonim:* ${msg.caption}` : '🎭 *Anonim:* 🎵 Audio yubordi',
                parse_mode: 'Markdown'
            });
        } else if (msg.video_note) {
            bot.sendVideoNote(partnerId, msg.video_note.file_id);
            bot.sendMessage(partnerId, '🎭 *Anonim:* 📹 Video xabar yubordi', { parse_mode: 'Markdown' });
        } else {
            // Boshqa turdagi xabarlar
            bot.sendMessage(partnerId, '🎭 *Anonim:* 📎 Media fayl yubordi', { parse_mode: 'Markdown' });
        }
    } else {
        // Agar suhbatda bo'lmasa, avtomatik start qilish
        if (!waitingUsers.includes(chatId)) {
            bot.sendMessage(chatId, '🔄 Avval /start buyrug\'ini bering yoki hamkor kutib turing... ⏳');
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