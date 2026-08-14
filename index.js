const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder,
    AttachmentBuilder 
} = require('discord.js');
const Jimp = require('jimp');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const activeGames = new Map();
const activeChannels = new Set();

// ضع هنا رابط الخلفية الصحيح والفعال لديك (تأكد أنه رابط مباشر ينتهي بـ .png أو .jpg)
const FLAG_BACKGROUND_URL = "https://i.imgur.com/67D54CDE-E683-4CDB-A249-7FA9D7C3C780.png";

const FAST_IMAGE_URL = "https://cdn.discordapp.com/attachments/1537200039276056717/1537740104926498896/Fate.png";

const flagsList = [
    { name: "مصر", url: "https://flagcdn.com/w320/eg.png" },
    { name: "المغرب", url: "https://flagcdn.com/w320/ma.png" },
    { name: "السعودية", url: "https://flagcdn.com/w320/sa.png" },
    { name: "الامارات", url: "https://flagcdn.com/w320/ae.png" },
    { name: "فرنسا", url: "https://flagcdn.com/w320/fr.png" },
    { name: "المانيا", url: "https://flagcdn.com/w320/de.png" },
    { name: "اليابان", url: "https://flagcdn.com/w320/jp.png" },
    { name: "ايطاليا", url: "https://flagcdn.com/w320/it.png" },
    { name: "الكويت", url: "https://flagcdn.com/w320/kw.png" },
    { name: "قطر", url: "https://flagcdn.com/w320/qa.png" },
    { name: "البحرين", url: "https://flagcdn.com/w320/bh.png" },
    { name: "عمان", url: "https://flagcdn.com/w320/om.png" },
    { name: "الاردن", url: "https://flagcdn.com/w320/jo.png" },
    { name: "فلسطين", url: "https://flagcdn.com/w320/ps.png" },
    { name: "لبنان", url: "https://flagcdn.com/w320/lb.png" },
    { name: "سوريا", url: "https://flagcdn.com/w320/sy.png" },
    { name: "العراق", url: "https://flagcdn.com/w320/iq.png" },
    { name: "اليمن", url: "https://flagcdn.com/w320/ye.png" },
    { name: "السودان", url: "https://flagcdn.com/w320/sd.png" },
    { name: "ليبيا", url: "https://flagcdn.com/w320/ly.png" },
    { name: "تونس", url: "https://flagcdn.com/w320/tn.png" },
    { name: "الجزائر", url: "https://flagcdn.com/w320/dz.png" },
    { name: "موريتانيا", url: "https://flagcdn.com/w320/mr.png" },
    { name: "الصومال", url: "https://flagcdn.com/w320/so.png" },
    { name: "جيبوتي", url: "https://flagcdn.com/w320/dj.png" },
    { name: "جزر القمر", url: "https://flagcdn.com/w320/km.png" },
    { name: "امريكا", url: "https://flagcdn.com/w320/us.png" },
    { name: "بريطانيا", url: "https://flagcdn.com/w320/gb.png" },
    { name: "كندا", url: "https://flagcdn.com/w320/ca.png" },
    { name: "اسبانيا", url: "https://flagcdn.com/w320/es.png" },
    { name: "تركيا", url: "https://flagcdn.com/w320/tr.png" },
    { name: "ايران", url: "https://flagcdn.com/w320/ir.png" },
    { name: "الهند", url: "https://flagcdn.com/w320/in.png" },
    { name: "باكستان", url: "https://flagcdn.com/w320/pk.png" },
    { name: "الصين", url: "https://flagcdn.com/w320/cn.png" },
    { name: "كوريا الجنوبية", url: "https://flagcdn.com/w320/kr.png" },
    { name: "كوريا الشمالية", url: "https://flagcdn.com/w320/kp.png" },
    { name: "اندونيسيا", url: "https://flagcdn.com/w320/id.png" },
    { name: "ماليزيا", url: "https://flagcdn.com/w320/my.png" },
    { name: "تايلاند", url: "https://flagcdn.com/w320/th.png" },
    { name: "فيتنام", url: "https://flagcdn.com/w320/vn.png" },
    { name: "الفلبين", url: "https://flagcdn.com/w320/ph.png" },
    { name: "استراليا", url: "https://flagcdn.com/w320/au.png" },
    { name: "نيوزيلندا", url: "https://flagcdn.com/w320/nz.png" },
    { name: "البرازيل", url: "https://flagcdn.com/w320/br.png" },
    { name: "الارجنتين", url: "https://flagcdn.com/w320/ar.png" },
    { name: "المكسيك", url: "https://flagcdn.com/w320/mx.png" },
    { name: "كولومبيا", url: "https://flagcdn.com/w320/co.png" },
    { name: "تشيلي", url: "https://flagcdn.com/w320/cl.png" },
    { name: "بيرو", url: "https://flagcdn.com/w320/pe.png" },
    { name: "فنزويلا", url: "https://flagcdn.com/w320/ve.png" },
    { name: "جنوب افريقيا", url: "https://flagcdn.com/w320/za.png" },
    { name: "نيجيريا", url: "https://flagcdn.com/w320/ng.png" },
    { name: "كينيا", url: "https://flagcdn.com/w320/ke.png" },
    { name: "اثيوبيا", url: "https://flagcdn.com/w320/et.png" },
    { name: "غانا", url: "https://flagcdn.com/w320/gh.png" },
    { name: "السويد", url: "https://flagcdn.com/w320/se.png" },
    { name: "النرويج", url: "https://flagcdn.com/w320/no.png" },
    { name: "فنلندا", url: "https://flagcdn.com/w320/fi.png" },
    { name: "الدنمارك", url: "https://flagcdn.com/w320/dk.png" },
    { name: "ايسلندا", url: "https://flagcdn.com/w320/is.png" },
    { name: "هولندا", url: "https://flagcdn.com/w320/nl.png" },
    { name: "بلجيكا", url: "https://flagcdn.com/w320/be.png" },
    { name: "سويسرا", url: "https://flagcdn.com/w320/ch.png" },
    { name: "النمسا", url: "https://flagcdn.com/w320/at.png" },
    { name: "اليونان", url: "https://flagcdn.com/w320/gr.png" },
    { name: "البرتغال", url: "https://flagcdn.com/w320/pt.png" },
    { name: "بولندا", url: "https://flagcdn.com/w320/pl.png" },
    { name: "اوكرانيا", url: "https://flagcdn.com/w320/ua.png" },
    { name: "روسيا", url: "https://flagcdn.com/w320/ru.png" },
    { name: "التشيك", url: "https://flagcdn.com/w320/cz.png" },
    { name: "المجر", url: "https://flagcdn.com/w320/hu.png" },
    { name: "رومانيا", url: "https://flagcdn.com/w320/ro.png" },
    { name: "بلغاريا", url: "https://flagcdn.com/w320/bg.png" },
    { name: "كرواتيا", url: "https://flagcdn.com/w320/hr.png" },
    { name: "صربيا", url: "https://flagcdn.com/w320/rs.png" },
    { name: "ايرلندا", url: "https://flagcdn.com/w320/ie.png" },
    { name: "كوبا", url: "https://flagcdn.com/w320/cu.png" },
    { name: "بنما", url: "https://flagcdn.com/w320/pa.png" },
    { name: "سنغافورة", url: "https://flagcdn.com/w320/sg.png" }
];

const fastWords = [
    "ذهبي", "حزام", "تفاحة", "سفينة", "طائرة", "سيارة", "قلم", "كتاب", "حاسوب", "هاتف", "طاولة", "كرسي",
    "شباك", "باب", "شمس", "قمر", "نجمة", "سحاب", "مطر", "بحر", "نهر", "جبل"
];

function normalizeText(text) {
    if (!text) return "";
    return text
        .trim()
        .toLowerCase()
        .replace(/^(ال)/, '')
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
}

async function readImage(url) {
    if (typeof Jimp.read === 'function') {
        return await Jimp.read(url);
    } else if (Jimp.default && typeof Jimp.default.read === 'function') {
        return await Jimp.default.read(url);
    } else {
        throw new Error("مكتبة Jimp لا تدعم الدالة read في هذا الإصدار.");
    }
}

client.once('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.trim();
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    if (content === 'إيقاف') {
        if (!activeGames.has(guildId)) {
            return message.reply('لا توجد أي لعبة تعمل حالياً لإيقافها.');
        }
        const game = activeGames.get(guildId);
        if (game.collector) game.collector.stop();
        activeGames.delete(guildId);
        activeChannels.delete(channelId);
        return message.reply('تم إيقاف اللعبة.');
    }

    if (content === 'أعلام' || content === 'اعلام') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('توجد لعبة تنلعب الحين، استخدم "إيقاف" أولاً.');
        }

        activeChannels.add(channelId);
        const randomFlag = flagsList[Math.floor(Math.random() * flagsList.length)];

        try {
            const background = await readImage(FLAG_BACKGROUND_URL);
            const flagImage = await readImage(randomFlag.url);

            flagImage.resize(110, 65); 
            background.composite(flagImage, 305, 30);

            const buffer = await background.getBufferAsync(Jimp.MIME_PNG);
            const attachment = new AttachmentBuilder(buffer, { name: 'flag_game.png' });

            const flagEmbed = new EmbedBuilder()
                .setImage('attachment://flag_game.png')
                .setColor(0x2f3136);

            await message.channel.send({ 
                content: "**علم أي دولة ؟**\n⏳ لديك 15 ثانيه",
                embeds: [flagEmbed],
                files: [attachment] 
            });

            activeGames.set(guildId, { type: 'flag', answer: randomFlag.name });

            const filter = (m) => !m.author.bot;
            const collector = message.channel.createMessageCollector({ filter, time: 15000 });
            activeGames.get(guildId).collector = collector;

            collector.on('collect', (m) => {
                if (normalizeText(m.content) === normalizeText(randomFlag.name)) {
                    if (activeGames.has(guildId)) {
                        activeGames.delete(guildId);
                    }
                    activeChannels.delete(channelId);
                    collector.stop('won');
                    m.channel.send(`الفائز: <@${m.author.id}>`);
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason !== 'won' && activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                    activeChannels.delete(channelId);
                    message.channel.send('انتهى الوقت');
                }
            });

        } catch (error) {
            console.error("خطأ تفصيلي أثناء معالجة صورة العلم:", error);
            activeChannels.delete(channelId);
            return message.reply(`حدث خطأ أثناء معالجة صورة العلم: ${error.message}`);
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

client.login(process.env.TOKEN);
