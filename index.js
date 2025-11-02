index.js
// 🔥 Super Bot v8.0 — by ChatGPT GPT-5
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const fs = require("fs");

// 🧩 إعدادات أساسية
const TOKEN = "7986969586:AAHbGqY5EoDWeDHnmZ6V285SbwB9JxmbU9w";
const ADMIN_ID = 5931899735
const bot = new TelegramBot(TOKEN, { polling: true });

// 🧠 تخزين القنوات في ملف خارجي
const CHANNELS_FILE = "channels.json";
let channels = [];
if (fs.existsSync(CHANNELS_FILE)) {
  channels = JSON.parse(fs.readFileSync(CHANNELS_FILE));
}

// 🧾 حفظ القنوات
function saveChannels() {
  fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));
}

// 🌐 تشغيل سيرفر صغير لمنع التوقف (Render أو Replit)
const app = express();
app.get("/", (req, res) => res.send("✅ Super Bot v8.0 is running"));
app.listen(3000, () => console.log("🚀 Server running on port 3000"));

// 🧩 إرسال إشعار للمالك عند دخول مستخدم جديد
const newUsers = new Set();

// 🔐 التحقق من اشتراك المستخدم
async function isUserSubscribed(userId) {
  if (channels.length === 0) return true;
  try {
    for (const ch of channels) {
      const member = await bot.getChatMember(ch, userId);
      if (!["member", "administrator", "creator"].includes(member.status)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// 📲 عند بدء المستخدم للبوت
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  if (!newUsers.has(chatId)) {
    newUsers.add(chatId);
    bot.sendMessage(
      ADMIN_ID,
      `👤 مستخدم جديد دخل البوت:\n\n📛 الاسم: ${user.first_name}\n🆔 المعرف: ${chatId}`
    );
  }

  const subscribed = await isUserSubscribed(chatId);
  if (!subscribed) {
    let text = `👋 مرحبًا ${user.first_name}!\n\n🔔 يجب عليك الاشتراك في القنوات التالية أولاً:\n\n`;
    channels.forEach((c) => (text += `📢 ${c}\n`));
    text += `\nثم أرسل /start مجددًا ✅`;

    const keyboard = {
      inline_keyboard: [
        channels.map((c) => ({ text: c, url: `https://t.me/${c.replace("@", "")}` })),
      ],
    };

    return bot.sendMessage(chatId, text, { reply_markup: keyboard });
  }

  bot.sendMessage(
    chatId,
    `🎬 أرسل الآن رابط فيديو من TikTok أو Instagram وسأقوم بتحميله لك بجودة عالية ✨`
  );
});

// 🎛️ لوحة تحكم المدير
bot.onText(/\/admin/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;
  const keyboard = {
    inline_keyboard: [
      [{ text: "➕ إضافة قناة", callback_data: "add_channel" }],
      [{ text: "➖ حذف قناة", callback_data: "remove_channel" }],
      [{ text: "📋 عرض القنوات", callback_data: "list_channels" }],
      [{ text: "📊 عرض الإحصائيات", callback_data: "show_stats" }],
    ],
  };
  bot.sendMessage(msg.chat.id, "⚙️ لوحة التحكم الإدارية:", { reply_markup: keyboard });
});

// ⚡️ أزرار الإدارة
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (chatId !== ADMIN_ID) return;

  // ➕ إضافة قناة
  if (data === "add_channel") {
    bot.sendMessage(chatId, "📎 أرسل الآن @اسم القناة التي تريد إضافتها:");
    bot.once("message", (msg) => {
      const ch = msg.text.trim();
      if (!ch.startsWith("@")) return bot.sendMessage(chatId, "❌ يجب أن يبدأ الاسم بـ @");
      if (channels.includes(ch)) return bot.sendMessage(chatId, "⚠️ القناة موجودة مسبقًا.");

      channels.push(ch);
      saveChannels();
      bot.sendMessage(chatId, `✅ تم إضافة ${ch} إلى قائمة القنوات الإلزامية.`);
    });
  }

  // ➖ حذف قناة
  if (data === "remove_channel") {
    if (channels.length === 0) return bot.sendMessage(chatId, "📭 لا توجد قنوات حالياً.");
    const keyboard = {
      inline_keyboard: channels.map((c) => [
        { text: `🗑 ${c}`, callback_data: `del_${c}` },
      ]),
    };
    bot.sendMessage(chatId, "اختر القناة التي تريد حذفها:", { reply_markup: keyboard });
  }

  // 📋 عرض القنوات
  if (data === "list_channels") {
    if (channels.length === 0) bot.sendMessage(chatId, "📭 لا توجد قنوات حالياً.");
    else bot.sendMessage(chatId, `📋 القنوات الحالية:\n${channels.join("\n")}`);
  }

  // 📊 الإحصائيات
  if (data === "show_stats") {
    bot.getMe().then((me) => {
      bot.sendMessage(
        chatId,
        `📊 إحصائيات البوت ${me.username}\n\n👥 عدد المستخدمين المتفاعلين: ${newUsers.size}\n📢 عدد قنوات الاشتراك: ${channels.length}`
      );
    });
  }

  // حذف قناة محددة
  if (data.startsWith("del_")) {
    const ch = data.replace("del_", "");
    channels = channels.filter((x) => x !== ch);
    saveChannels();
    bot.sendMessage(chatId, `🗑 تم حذف ${ch} بنجاح.`);
  }
});

// 🌀 استقبال الروابط
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text || text.startsWith("/")) return;

  const subscribed = await isUserSubscribed(chatId);
  if (!subscribed) {
    let textMsg = `⚠️ يجب الاشتراك أولاً في القنوات التالية:\n`;
    channels.forEach((c) => (textMsg += `📢 ${c}\n`));
    return bot.sendMessage(chatId, textMsg);
  }

  // TikTok
  if (text.includes("tiktok.com")) {
    bot.sendMessage(chatId, "⏳ جاري تحميل فيديو من TikTok...");
    try {
      const res = await axios.get(
        `https://api.tiklydown.me/api/download?url=${encodeURIComponent(text)}`
      );
      const videoUrl = res.data.video.noWatermark;
      await bot.sendVideo(chatId, videoUrl, {
        caption: "✅ تم التحميل بنجاح من TikTok 🎬",
      });
    } catch (err) {
      bot.sendMessage(chatId, "❌ حدث خطأ أثناء التحميل من TikTok.");
    }
  }

  // Instagram
  else if (text.includes("instagram.com")) {
    bot.sendMessage(chatId, "⏳ جاري تحميل فيديو من Instagram...");
    try {
      const res = await axios.get(
        `https://api.sssinstagram.com/api/convert?url=${encodeURIComponent(text)}`
      );
      const videoUrl = res.data.url[0].url;
      await bot.sendVideo(chatId, videoUrl, {
        caption: "✅ تم التحميل بنجاح من Instagram 🎥",
      });
    } catch (err) {
      bot.sendMessage(chatId, "❌ حدث خطأ أثناء التحميل من Instagram.");
    }
  } else {
    bot.sendMessage(chatId, "📎 أرسل رابط فيديو من TikTok أو Instagram فقط.");
  }
});
