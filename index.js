// دالة لتنظيف النص من الهمزات لضمان قبول الإجابات بدون تعقيد
function normalizeText(text) {
    if (!text) return "";
    return text.trim().toLowerCase()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[ء]/g, '');
}

// دالة تعديل صورة الأعلام
async function generateFlagGameImage(flagObj) {
    const canvas = createCanvas(700, 320);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function drawRoundedRect(x, y, width, height, radius, fillColor, strokeColor) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
        if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = 3; ctx.stroke(); }
    }

    // مربع "علم دولة؟" (تم إزالة الدائرة)
    drawRoundedRect(365, 25, 285, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('علم دولة ؟', 507, 52);

    // مربع "معك 15 ثانية"
    drawRoundedRect(50, 25, 305, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Cairo, sans-serif';
    ctx.fillText('معك 15 ثانية', 202, 52);

    // المربع السفلي للعلم
    drawRoundedRect(50, 100, 600, 195, 30, '#161920', '#3a4454');

    const flagUrl = `https://flagcdn.com/w320/${flagObj.code}.png`;
    try {
        const { loadImage } = require('@napi-rs/canvas');
        const img = await loadImage(flagUrl);
        ctx.save();
        ctx.beginPath();
        // تصغير العلم ليكون أوضح وأصغر من اليمين واليسار
        ctx.roundRect(180, 125, 340, 145, 15);
        ctx.clip();
        ctx.drawImage(img, 180, 125, 340, 145);
        ctx.restore();
    } catch (e) {
        console.error("خطأ تحميل العلم:", e);
    }
    return canvas.toBuffer('image/png');
}

// دالة تعديل لعبة "أسرع" لتكون بدون همزات
async function generateGameImage(word) {
    const canvas = createCanvas(700, 320);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function drawRoundedRect(x, y, width, height, radius, fillColor, strokeColor) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
        if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = 3; ctx.stroke(); }
    }

    drawRoundedRect(365, 25, 285, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('أسرع', 507, 52); // بدون همزات في المنطق

    drawRoundedRect(50, 25, 305, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillText('معك 15 ثانية', 202, 52);

    drawRoundedRect(50, 105, 600, 180, 35, '#161920', '#3a4454');
    ctx.font = 'bold 55px Cairo, sans-serif';
    ctx.fillText(word, 350, 195);

    return canvas.toBuffer('image/png');
}
