/**
 * astro-gemini.js — AI Astrology Report Generator
 *
 * Uses @google/genai to produce professional Vedic astrology reports
 * via the gemini-2.5-flash model. Reads GEMINI_API_KEY from .env.
 *
 * Includes a SMART FALLBACK SYSTEM: if Gemini is unavailable for any
 * reason (missing key, billing, quota, 403, 429, network, timeout,
 * model unavailable), a premium offline astrology report is generated
 * automatically using rich predefined templates. The fallback is
 * completely transparent to the caller.
 *
 * Exported: generateAstrologyReport(userData) → Promise<string>
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// ─── Validate API key at load time ───────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn(
        '[astro-gemini.js] WARNING: GEMINI_API_KEY is missing. ' +
        'Smart fallback system will generate offline reports.'
    );
}

// ─── Initialize the Google GenAI client (guard against missing key) ─
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// ─── Model identifier ────────────────────────────────────────────
const MODEL_ID = 'gemini-2.5-flash';

// ─── Report sections in order ────────────────────────────────────
const REPORT_SECTIONS = [
    'Introduction', 'Personality', 'Career', 'Love', 'Marriage',
    'Finance', 'Business', 'Health Guidance', 'Lucky Number',
    'Lucky Color', 'Lucky Day', 'Lucky Direction', 'Lucky Gemstone',
    'Lucky Rudraksha', 'Remedies', 'Positive Conclusion'
];

// ─── Language map for natural prompt phrasing ────────────────────
const LANGUAGE_MAP = {
    English: 'English', Hindi: 'Hindi (written in Devanagari script)',
    Spanish: 'Spanish', French: 'French', Portuguese: 'Portuguese',
    German: 'German', Tamil: 'Tamil', Telugu: 'Telugu', Bengali: 'Bengali',
    Marathi: 'Marathi', Gujarati: 'Gujarati', Kannada: 'Kannada', Malayalam: 'Malayalam'
};

// ─── Report type descriptions for context ────────────────────────
const REPORT_TYPE_MAP = {
    career:   'Career and Professional Life (focus extra depth on career sections)',
    love:     'Love and Romantic Relationships (focus extra depth on love sections)',
    marriage: 'Marriage and Long-term Partnership (focus extra depth on marriage sections)',
    business: 'Business and Entrepreneurship (focus extra depth on business sections)',
    finance:  'Financial Prospects and Wealth (focus extra depth on finance sections)',
    health:   'Health Guidance and Wellness (focus extra depth on health guidance sections)',
    complete: 'Complete Comprehensive Vedic Astrology Analysis (equal depth across all sections)'
};

// ─── Build the system prompt ─────────────────────────────────────
function buildSystemPrompt(targetLanguage) {
    return `You are a master Vedic astrologer with over 40 years of deep practice in Jyotish. You are renowned for writing deeply insightful, compassionate, authoritative, and precise astrological reports. Your reports are professional, detailed, and formatted in rich Markdown.

CRITICAL RULES:
1. Write the ENTIRE report in ${targetLanguage}.
2. Use proper Markdown formatting: headings (# ## ###), bold (**text**), bullet lists, numbered lists, tables where appropriate, and horizontal rules (---) between major sections.
3. NEVER use generic filler phrases. Every sentence must feel specific to this person's chart.
4. NEVER include disclaimers about astrology being "for entertainment only." Speak with authority.
5. The Health Guidance section must be clearly presented as traditional astrological guidance based on planetary influences — NOT as medical advice. Use phrasing like "According to Vedic astrological tradition..." or "From the perspective of Jyotish..." and never diagnose or prescribe medical treatment.
6. Keep the tone warm, empowering, and respectful throughout.
7. Make the report deeply personal — reference the person's name, their specific planetary placements, and how those placements interact.
8. Include specific timeframes, planetary periods, and astrological terminology where relevant.
9. For Lucky sections (Number, Color, Day, Direction, Gemstone, Rudraksha), provide a clear single answer with a brief explanation of why it suits them astrologically.
10. The Positive Conclusion should leave the person feeling empowered and hopeful, summarizing their cosmic strengths.`;
}

// ─── Build the user prompt ───────────────────────────────────────
function buildUserPrompt(userData) {
    const { name, gender, dob, birthTime, birthPlace, language, reportType } = userData;
    const targetLanguage = LANGUAGE_MAP[language] || 'English';
    const reportFocus = REPORT_TYPE_MAP[reportType] || REPORT_TYPE_MAP.complete;
    const sectionsList = REPORT_SECTIONS.map((s, i) => `${i + 1}. ${s}`).join('\n');

    return `Generate a premium, detailed Vedic astrology report for the following person:

**Name:** ${name}
**Gender:** ${gender}
**Date of Birth:** ${dob}
**Time of Birth:** ${birthTime}
**Birth Place:** ${birthPlace}
**Preferred Language:** ${targetLanguage}
**Report Focus:** ${reportFocus}

---

INSTRUCTIONS:

Write the complete report in **${targetLanguage}**.

The report must contain ALL of the following sections in this exact order, each as a proper Markdown heading (## or ###):

 ${sectionsList}

STRUCTURE GUIDELINES:

# Celestial Insights — ${reportType === 'complete' ? 'Complete Astrology' : REPORT_TYPE_MAP[reportType].split(' (')[0]} Report
## For ${name}

### Introduction
A warm, personalized opening that acknowledges ${name}'s birth details, gives a high-level overview of their chart's dominant themes, and sets the tone for the reading. Reference their name directly.

### Personality
A deep analysis of ${name}'s core personality traits based on their Moon sign, Ascendant, and Sun sign. Describe their temperament, emotional nature, strengths, and inner drives. Be specific and nuanced — avoid generic statements.

### Career
Professional path, vocational strengths, ideal industries, leadership potential, and timing of career milestones. Mention specific periods that favor growth. ${reportType === 'career' ? 'Give EXTRA depth here — this is the primary focus of the report.' : ''}

### Love
Romantic nature, relationship patterns, emotional needs in partnerships, and compatibility tendencies. ${reportType === 'love' ? 'Give EXTRA depth here — this is the primary focus of the report.' : ''}

### Marriage
Marital prospects, timing of marriage, qualities to look for in a spouse, and guidance for marital harmony. Reference 7th house and Venus/Jupiter influences. ${reportType === 'marriage' ? 'Give EXTRA depth here — this is the primary focus of the report.' : ''}

### Finance
Wealth potential, income patterns, investment timing, and periods of financial growth or caution. Reference 2nd, 11th house and Jupiter/Saturn influences. ${reportType === 'finance' ? 'Give EXTRA depth here — this is the primary focus of the report.' : ''}

### Business
Entrepreneurial potential, business partnerships, ideal venture types, and timing for launches. ${reportType === 'business' ? 'Give EXTRA depth here — this is the primary focus of the report.' : ''}

### Health Guidance
IMPORTANT: This section must be clearly framed as traditional astrological guidance, NOT medical advice. Use phrases like "According to Vedic astrological tradition..." and "From the perspective of Jyotish..." — never diagnose or prescribe. Discuss planetary influences on vitality, vulnerable body areas, and traditional wellness recommendations. ${reportType === 'health' ? 'Give EXTRA depth here — this is the primary focus of the report.' : ''}

### Lucky Number
State the single most auspicious number for ${name} with a brief astrological explanation.

### Lucky Color
State the single most auspicious color with a brief astrological explanation.

### Lucky Day
State the single most auspicious day of the week with a brief astrological explanation.

### Lucky Direction
State the single most auspicious direction with a brief astrological explanation.

### Lucky Gemstone
State the recommended gemstone with weight/metal guidance and a brief explanation of its planetary alignment.

### Lucky Rudraksha
State the recommended Rudraksha (mukhi/face count) with a brief explanation of its spiritual significance for ${name}'s chart.

### Remedies
Provide 5-7 specific, practical Vedic remedies (mantras, rituals, donations, practices) tailored to ${name}'s chart. Format as a numbered list with clear instructions.

### Positive Conclusion
An empowering, hopeful closing that summarizes ${name}'s cosmic strengths, affirms their potential, and offers a blessing. Reference their name directly. Make them feel seen and inspired.

---

QUALITY STANDARDS:
- Minimum 2500 words for the full report.
- Every paragraph must feel specific to ${name}'s chart — no generic filler.
- Use astrological terminology naturally (Rashi, Nakshatra, Dasha, Bhava, etc.).
- Include specific timeframes and planetary periods where relevant.
- Format tables for planetary data where appropriate.
- Use horizontal rules (---) to separate major sections.

Begin the report now.`;
}


// ═════════════════════════════════════════════════════════════════
// ║               SMART FALLBACK SYSTEM                             ║
// ║   Premium Offline Astrology Report Generator                    ║
// ║   Activated automatically when Gemini is unavailable            ║
// ═════════════════════════════════════════════════════════════════

// ─── Utility helpers ─────────────────────────────────────────────
function _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function _pickSeeded(arr, seed) {
    return arr[seed % arr.length];
}

function _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function _pickRandomN(arr, n) {
    const copy = [...arr];
    const result = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        result.push(copy.splice(idx, 1)[0]);
    }
    return result;
}

// ─── Astrological data pools ─────────────────────────────────────
const RASHIS_EN = [
    'Aries (Mesha)', 'Taurus (Vrishabha)', 'Gemini (Mithuna)',
    'Cancer (Karka)', 'Leo (Simha)', 'Virgo (Kanya)',
    'Libra (Tula)', 'Scorpio (Vrishchika)', 'Sagittarius (Dhanu)',
    'Capricorn (Makara)', 'Aquarius (Kumbha)', 'Pisces (Meena)'
];
const RASHIS_HI = [
    'मेष (Aries)', 'वृषभ (Taurus)', 'मिथुन (Gemini)',
    'कर्क (Cancer)', 'सिंह (Leo)', 'कन्या (Virgo)',
    'तुला (Libra)', 'वृश्चिक (Scorpio)', 'धनु (Sagittarius)',
    'मकर (Capricorn)', 'कुंभ (Aquarius)', 'मीन (Pisces)'
];

const NAKSHATRAS_EN = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
    'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
    'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
    'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
    'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];
const NAKSHATRAS_HI = [
    'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा',
    'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा',
    'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा',
    'स्वाती', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल',
    'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा',
    'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'
];

const LUCKY_NUMBERS = [1, 3, 5, 6, 7, 9, 11, 18, 21, 24, 27, 33];

const LUCKY_COLORS_EN = [
    'Royal Red', 'Pure White', 'Golden Yellow', 'Emerald Green',
    'Deep Blue', 'Saffron Orange', 'Royal Purple', 'Sunlit Gold',
    'Pearl White', 'Cream', 'Soft Pink', 'Rich Maroon',
    'Turquoise', 'Coral Red'
];
const LUCKY_COLORS_HI = [
    'राजसी लाल', 'शुद्ध श्वेत', 'स्वर्ण पीला', 'पन्ना हरा',
    'गहरा नीला', 'केसरिया नारंगी', 'राजसी बैंगनी', 'सूर्य स्वर्ण',
    'मोती सफेद', 'क्रीम', 'कोमल गुलाबी', 'गहरा मरून',
    'फिरोजी', 'प्रवाल लाल'
];

const LUCKY_DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LUCKY_DAYS_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

const LUCKY_DIRECTIONS_EN = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
const LUCKY_DIRECTIONS_HI = ['उत्तर', 'दक्षिण', 'पूर्व', 'पश्चिम', 'ईशान (उत्तर-पूर्व)', 'वायव्य (उत्तर-पश्चिम)', 'आग्नेय (दक्षिण-पूर्व)', 'नैऋत (दक्षिण-पश्चिम)'];

const GEMSTONES_EN = [
    { name: 'Ruby (Manik)', planet: 'Sun', metal: 'Gold', weight: '3–5 carats' },
    { name: 'Pearl (Moti)', planet: 'Moon', metal: 'Silver', weight: '4–6 carats' },
    { name: 'Red Coral (Moonga)', planet: 'Mars', metal: 'Copper or Gold', weight: '5–7 carats' },
    { name: 'Emerald (Panna)', planet: 'Mercury', metal: 'Gold or Silver', weight: '3–5 carats' },
    { name: 'Yellow Sapphire (Pukhraj)', planet: 'Jupiter', metal: 'Gold', weight: '4–6 carats' },
    { name: 'Blue Sapphire (Neelam)', planet: 'Saturn', metal: 'Silver or Platinum', weight: '3–5 carats' },
    { name: 'Hessonite (Gomed)', planet: 'Rahu', metal: 'Silver', weight: '4–6 carats' },
    { name: "Cat's Eye (Lehsunia)", planet: 'Ketu', metal: 'Silver or Gold', weight: '3–5 carats' },
    { name: 'Diamond (Heera)', planet: 'Venus', metal: 'Gold or Platinum', weight: '0.5–1 carat' }
];
const GEMSTONES_HI = [
    { name: 'माणिक (Ruby)', planet: 'सूर्य', metal: 'सोना', weight: '3–5 कैरट' },
    { name: 'मोती (Pearl)', planet: 'चंद्रमा', metal: 'चांदी', weight: '4–6 कैरट' },
    { name: 'मूंगा (Red Coral)', planet: 'मंगल', metal: 'तांबा या सोना', weight: '5–7 कैरट' },
    { name: 'पन्ना (Emerald)', planet: 'बुध', metal: 'सोना या चांदी', weight: '3–5 कैरट' },
    { name: 'पुखराज (Yellow Sapphire)', planet: 'गुरु', metal: 'सोना', weight: '4–6 कैरट' },
    { name: 'नीलम (Blue Sapphire)', planet: 'शनि', metal: 'चांदी या प्लैटिनम', weight: '3–5 कैरट' },
    { name: 'गोमेद (Hessonite)', planet: 'राहु', metal: 'चांदी', weight: '4–6 कैरट' },
    { name: 'लहसुनिया (Cat\'s Eye)', planet: 'केतु', metal: 'चांदी या सोना', weight: '3–5 कैरट' },
    { name: 'हीरा (Diamond)', planet: 'शुक्र', metal: 'सोना या प्लैटिनम', weight: '0.5–1 कैरट' }
];

const RUDRAKSHAS_EN = [
    { mukhi: '1 Mukhi', deity: 'Lord Shiva', benefit: 'supreme consciousness and spiritual elevation' },
    { mukhi: '2 Mukhi', deity: 'Ardhanarishvara', benefit: 'harmony in relationships and emotional balance' },
    { mukhi: '3 Mukhi', deity: 'Agni (Fire God)', benefit: 'liberation from past karma and self-confidence' },
    { mukhi: '4 Mukhi', deity: 'Lord Brahma', benefit: 'enhanced intellect, wisdom, and creativity' },
    { mukhi: '5 Mukhi', deity: 'Lord Kalagni Rudra', benefit: 'overall well-being and mental peace' },
    { mukhi: '6 Mukhi', deity: 'Lord Kartikeya', benefit: 'willpower, focus, and emotional stability' },
    { mukhi: '7 Mukhi', deity: 'Goddess Lakshmi', benefit: 'prosperity and removal of financial obstacles' },
    { mukhi: '9 Mukhi', deity: 'Goddess Durga', benefit: 'protection from negative energies and inner strength' },
    { mukhi: '11 Mukhi', deity: 'Lord Hanuman', benefit: 'courage, fearlessness, and physical vitality' },
    { mukhi: '14 Mukhi', deity: 'Lord Shiva (Deva Mani)', benefit: 'intuitive vision and spiritual awakening' }
];
const RUDRAKSHAS_HI = [
    { mukhi: '1 मुखी', deity: 'भगवान शिव', benefit: 'उच्च चेतना और आध्यात्मिक उन्नति' },
    { mukhi: '2 मुखी', deity: 'अर्धनारीश्वर', benefit: 'रिश्तों में सामंजस्य और भावनात्मक संतुलन' },
    { mukhi: '3 मुखी', deity: 'अग्नि देव', benefit: 'पूर्व कर्मों से मुक्ति और आत्मविश्वास' },
    { mukhi: '4 मुखी', deity: 'भगवान ब्रह्मा', benefit: 'बुद्धि, ज्ञान और रचनात्मकता में वृद्धि' },
    { mukhi: '5 मुखी', deity: 'भगवान कालाग्नि रुद्र', benefit: 'समग्र कल्याण और मानसिक शांति' },
    { mukhi: '6 मुखी', deity: 'भगवान कार्तिकेय', benefit: 'इच्छाशक्ति, एकाग्रता और भावनात्मक स्थिरता' },
    { mukhi: '7 मुखी', deity: 'माता लक्ष्मी', benefit: 'समृद्धि और आर्थिक बाधाओं का निवारण' },
    { mukhi: '9 मुखी', deity: 'माता दुर्गा', benefit: 'नकारात्मक ऊर्जाओं से सुरक्षा और आंतरिक शक्ति' },
    { mukhi: '11 मुखी', deity: 'भगवान हनुमान', benefit: 'साहस, निडरता और शारीरिक ऊर्जा' },
    { mukhi: '14 मुखी', deity: 'भगवान शिव (देव मणि)', benefit: 'अंतर्ज्ञान और आध्यात्मिक जागृति' }
];

// ─── Remedies pool (English) ─────────────────────────────────────
const REMEDIES_POOL_EN = [
    { text: 'Chant the **Gayatri Mantra** 108 times every morning at sunrise. This sacred chant aligns your mind with cosmic frequencies and strengthens your Sun placement, bringing clarity, vitality, and divine protection throughout the day.', day: 'Daily at sunrise' },
    { text: 'Offer **water (Arghya) to the Sun** every morning from a copper vessel. Add a pinch of red kumkum to the water. This practice pacifies any Sun-related afflictions and enhances your confidence, leadership, and vitality.', day: 'Every morning' },
    { text: 'Donate **yellow items — chana dal, turmeric, yellow flowers, or yellow clothing** to a temple or a needy person on Thursdays. This strengthens your Jupiter and opens doors for wisdom, prosperity, and divine grace.', day: 'Thursdays' },
    { text: 'Light a **ghee lamp (diya) under a peepal tree** on Saturday evenings and circumambulate the tree seven times. This remedy calms Saturn\'s influence and helps dissolve karmic obstacles blocking your progress.', day: 'Saturday evenings' },
    { text: 'Chant **"Om Namah Shivaya"** 108 times daily using a rudraksha mala. This powerful Panchakshari mantra invokes Lord Shiva\'s protective energy, cleansing your aura and aligning you with your highest spiritual path.', day: 'Daily' },
    { text: 'Observe a **fast on the day ruled by your weakest planet** (e.g., Monday for Moon, Thursday for Jupiter). Consume only fruits, milk, and water from sunrise to sunset. This discipline purifies the body and pleases the corresponding planetary deity.', day: 'Weekly' },
    { text: 'Feed **wheat flour balls to fishes** in a nearby pond or river on Wednesdays. This simple act of compassion strengthens Mercury, improving your communication skills, intellect, and business acumen.', day: 'Wednesdays' },
    { text: 'Offer **red hibiscus flowers to Lord Ganesha** on Tuesdays and chant "Om Gam Ganapataye Namaha" 108 times. This removes Mars-related obstacles and grants courage, focus, and victory in endeavors.', day: 'Tuesdays' },
    { text: 'Donate **black sesame seeds, black cloth, or iron items** to a needy person or a temple on Saturdays. This pacifies Saturn and Rahu, reducing delays, obstacles, and unforeseen hardships in your path.', day: 'Saturdays' },
    { text: 'Recite the **Hanuman Chalisa** 7 times daily, ideally in the morning or at twilight. This builds an invincible protective shield around you, dispels fear, and strengthens your Mars energy for courage and determination.', day: 'Daily' },
    { text: 'Offer **milk or water on a Shivling** on Mondays and chant "Om Namah Shivaya." This practice harmonizes your Moon energy, bringing emotional balance, mental peace, and intuitive clarity.', day: 'Mondays' },
    { text: 'Keep a **small square piece of silver** in your wallet or wear a silver ring on the little finger. Silver is associated with the Moon and Venus, attracting prosperity and emotional stability.', day: 'Always' },
    { text: 'Plant and nurture a **Tulsi (Holy Basil) plant** in your home\'s courtyard or balcony. Light a lamp near it every evening and circumambulate it. This invites divine vibrations, prosperity, and health into your home.', day: 'Daily' },
    { text: 'Feed **jaggery and gram (chana) to a cow** on Thursdays. This simple act of service strengthens Jupiter, the planet of wisdom and expansion, opening pathways for spiritual and material growth.', day: 'Thursdays' },
    { text: 'Chant the **Mahamrityunjaya Mantra** — "Om Tryambakam Yajamahe..." — 108 times daily. This ancient mantra invokes Lord Shiva\'s healing energy, protecting you from illness, accidents, and untimely difficulties.', day: 'Daily' },
    { text: 'Apply a **tilak of sandalwood or kumkum** on your forehead between the eyebrows (Ajna chakra) after your morning bath. This activates your third eye, enhances concentration, and aligns you with higher consciousness.', day: 'Daily' },
    { text: 'Offer **sweet rice (kheer) to young girls** on Fridays. This remedy honors Goddess Lakshmi and strengthens Venus, bringing harmony in relationships, beauty, and material comforts into your life.', day: 'Fridays' },
    { text: 'Meditate for **at least 20 minutes daily** focusing on your breath or a mantra. Regular meditation calms planetary agitations, balances your chakras, and allows you to receive intuitive guidance from your higher self.', day: 'Daily' },
    { text: 'Donate **green items — green gram (moong), green vegetables, or green clothing** on Wednesdays. This strengthens Mercury and promotes intellectual growth, harmonious relationships, and financial wisdom.', day: 'Wednesdays' },
    { text: 'Keep your **home entrance clean and well-lit** and place a swastika or a toran of mango leaves at the door. This invites positive energy, prosperity, and divine blessings into your living space.', day: 'Always' }
];

// ─── Remedies pool (Hindi) ───────────────────────────────────────
const REMEDIES_POOL_HI = [
    { text: 'प्रतिदिन सूर्योदय के समय **गायत्री मंत्र** का 108 बार जाप करें। यह पवित्र मंत्र आपके मन को ब्रह्मांडीय आवृत्तियों के साथ जोड़ता है और आपके सूर्य को मजबूत करता है, जिससे स्पष्टता, ऊर्जा और दिव्य सुरक्षा मिलती है।', day: 'प्रतिदिन सूर्योदय के समय' },
    { text: 'प्रतिदिन सुबह तांबे के बर्तन से **सूर्य को जल (अर्घ्य) चढ़ाएं**। जल में थोड़ा लाल कुंकम मिलाएं। यह अभ्यास सूर्य संबंधी दोषों को शांत करता है और आत्मविश्वास, नेतृत्व और ऊर्जा को बढ़ाता है।', day: 'प्रतिदिन सुबह' },
    { text: 'गुरुवार को **पीली वस्तुएं — चने की दाल, हल्दी, पीले फूल या पीले वस्त्र** मंदिर या किसी जरूरतमंद को दान करें। यह आपके गुरु (बृहस्पति) को मजबूत करता है और ज्ञान, समृद्धि और दिव्य कृपा के द्वार खोलता है।', day: 'गुरुवार' },
    { text: 'शनिवार की शाम **पीपल के पेड़ के नीचे घी का दीपक** जलाएं और पेड़ की सात परिक्रमा करें। यह उपाय शनि के प्रभाव को शांत करता है और आपकी प्रगति में आने वाली कार्मिक बाधाओं को दूर करने में सहायक है।', day: 'शनिवार शाम' },
    { text: 'रुद्राक्ष की माला से प्रतिदिन **"ॐ नमः शिवाय"** का 108 बार जाप करें। यह शक्तिशाली पंचाक्षरी मंत्र भगवान शिव की सुरक्षात्मक ऊर्जा को आमंत्रित करता है, आपके आभामंडल को शुद्ध करता है और आपको आध्यात्मिक पथ पर स्थिर करता है।', day: 'प्रतिदिन' },
    { text: 'अपने सबसे कमजोर ग्रह के दिन **व्रत रखें** (जैसे चंद्रमा के लिए सोमवार, बृहस्पति के लिए गुरुवार)। सूर्योदय से सूर्यास्त तक केवल फल, दूध और जल का सेवन करें। यह अनुशासन शरीर को शुद्ध करता है और संबंधित ग्रह देवता को प्रसन्न करता है।', day: 'साप्ताहिक' },
    { text: 'बुधवार को **मछलियों को गेहूं के आटे की गोलियां** खिलाएं। करुणा का यह सरल कार्य बुध को मजबूत करता है, जिससे संचार कौशल, बुद्धि और व्यावसायिक क्षमता में सुधार होता है।', day: 'बुधवार' },
    { text: 'मंगलवार को **भगवान गणेश को लाल गुड़हल के फूल चढ़ाएं** और "ॐ गम गणपतये नमः" का 108 बार जाप करें। यह मंगल संबंधी बाधाओं को दूर करता है और साहस, एकाग्रता और प्रयासों में विजय दिलाता है।', day: 'मंगलवार' },
    { text: 'शनिवार को **काले तिल, काले वस्त्र या लोहे की वस्तुएं** किसी जरूरतमंद को या मंदिर में दान करें। यह शनि और राहु को शांत करता है, जिससे देरी, बाधाएं और अप्रत्याशित कठिनाइयां कम होती हैं।', day: 'शनिवार' },
    { text: 'प्रतिदिन **हनुमान चालीसा** का 7 बार पाठ करें, अधिमानतः सुबह या गोधूलि बेला में। यह आपके चारों ओर एक अभेद्य सुरक्षा कवच बनाता है, भय को दूर करता है और साहस व दृढ़ता के लिए मंगल ऊर्जा को मजबूत करता है।', day: 'प्रतिदिन' },
    { text: 'सोमवार को **शिवलिंग पर दूध या जल चढ़ाएं** और "ॐ नमः शिवाय" का जाप करें। यह अभ्यास आपकी चंद्रमा ऊर्जा को संतुलित करता है, जिससे भावनात्मक संतुलन, मानसिक शांति और अंतर्ज्ञान की स्पष्टता मिलती है।', day: 'सोमवार' },
    { text: 'अपने बटुए में **चांदी का एक छोटा वर्गाकार टुकड़ा** रखें या कनिष्ठा उंगली में चांदी की अंगूठी पहनें। चांदी चंद्रमा और शुक्र से जुड़ी है, जो समृद्धि और भावनात्मक स्थिरता को आकर्षित करती है।', day: 'सदैव' },
    { text: 'अपने घर के आंगन या बालकनी में **तुलसी का पौधा** लगाएं और उसकी देखभाल करें। प्रतिदिन शाम को उसके पास दीपक जलाएं और परिक्रमा करें। यह दिव्य कंपन, समृद्धि और स्वास्थ्य को आपके घर में आमंत्रित करता है।', day: 'प्रतिदिन' },
    { text: 'गुरुवार को **एक गाय को गुड़ और चना** खिलाएं। सेवा का यह सरल कार्य बृहस्पति को मजबूत करता है, जो ज्ञान और विस्तार का ग्रह है, और आध्यात्मिक व भौतिक विकास के मार्ग खोलता है।', day: 'गुरुवार' },
    { text: 'प्रतिदिन **महामृत्युंजय मंत्र** — "ॐ त्र्यम्बकं यजामहे..." — का 108 बार जाप करें। यह प्राचीन मंत्र भगवान शिव की चिकित्सा ऊर्जा को आमंत्रित करता है, जो आपको बीमारी, दुर्घटना और असमय कठिनाइयों से बचाता है।', day: 'प्रतिदिन' },
    { text: 'सुबह स्नान के बाद दोनों भौहों के बीच (आज्ञा चक्र) पर **चंदन या कुंकम का तिलक** लगाएं। यह आपके तीसरे नेत्र को जाग्रत करता है, एकाग्रता बढ़ाता है और उच्च चेतना के साथ जोड़ता है।', day: 'प्रतिदिन' },
    { text: 'शुक्रवार को **छोटी बालिकाओं को मीठा चावल (खीर)** खिलाएं। यह उपाय माता लक्ष्मी को सम्मानित करता है और शुक्र को मजबूत करता है, जिससे रिश्तों में सामंजस्य, सुंदरता और भौतिक सुख आते हैं।', day: 'शुक्रवार' },
    { text: 'प्रतिदिन **कम से कम 20 मिनट ध्यान** करें, अपनी सांस या किसी मंत्र पर ध्यान केंद्रित करते हुए। नियमित ध्यान ग्रहीय आवेगों को शांत करता है, आपके चक्रों को संतुलित करता है और आपको अपने उच्च स्व से अंतर्ज्ञान प्राप्त करने की अनुमति देता है।', day: 'प्रतिदिन' },
    { text: 'बुधवार को **हरी वस्तुएं — हरा चना (मूंग), हरी सब्जियां या हरे वस्त्र** दान करें। यह बुध को मजबूत करता है और बौद्धिक वृद्धि, सामंजस्यपूर्ण रिश्तों और आर्थिक ज्ञान को बढ़ावा देता है।', day: 'बुधवार' },
    { text: 'अपने **घर के प्रवेश द्वार को स्वच्छ और अच्छी तरह प्रकाशित** रखें और दरवाजे पर स्वस्तिक या आम के पत्तों की तोरण लगाएं। यह सकारात्मक ऊर्जा, समृद्धि और दिव्य आशीर्वाद को आपके जीवन स्थान में आमंत्रित करता है।', day: 'सदैव' }
];

// ─── Compute astrological profile from birth data ────────────────
function _computeAstroProfile(userData) {
    const seedStr = `${userData.name}|${userData.dob}|${userData.birthTime}|${userData.birthPlace}`;
    const seed = _hashString(seedStr);
    return {
        rashiIdx: seed % 12,
        nakshatraIdx: (seed >> 4) % 27,
        ascendantIdx: (seed >> 8) % 12,
        seed
    };
}

// ─── Determine language for offline report ───────────────────────
function _detectLang(language) {
    if (!language) return 'en';
    const lower = String(language).toLowerCase();
    if (lower.includes('hin') || lower === 'hi' || lower === 'hindi') return 'hi';
    return 'en';
}

// ─── Get gender-aware terms ──────────────────────────────────────
function _getGenderTerms(gender, lang) {
    const g = String(gender || '').toLowerCase();
    if (lang === 'hi') {
        if (g.includes('fem') || g === 'f') return { pronoun: 'वह', possessive: 'उनका', object: 'उन्हें' };
        return { pronoun: 'वह', possessive: 'उनका', object: 'उन्हें' };
    }
    if (g.includes('fem') || g === 'f') return { pronoun: 'she', possessive: 'her', object: 'her' };
    return { pronoun: 'he', possessive: 'his', object: 'him' };
}

// ─── Report-type-specific title ──────────────────────────────────
function _getReportTitleEn(reportType) {
    const titles = {
        career: 'Career Astrology', love: 'Love & Romance Astrology',
        marriage: 'Marriage & Partnership Astrology', business: 'Business Astrology',
        finance: 'Finance & Wealth Astrology', health: 'Health & Wellness Astrology',
        complete: 'Complete Astrology'
    };
    return titles[reportType] || titles.complete;
}

function _getReportTitleHi(reportType) {
    const titles = {
        career: 'करियर ज्योतिष', love: 'प्रेम एवं रोमांस ज्योतिष',
        marriage: 'विवाह एवं साझेदारी ज्योतिष', business: 'व्यापार ज्योतिष',
        finance: 'धन एवं संपत्ति ज्योतिष', health: 'स्वास्थ्य एवं कल्याण ज्योतिष',
        complete: 'संपूर्ण ज्योतिष'
    };
    return titles[reportType] || titles.complete;
}


// ═════════════════════════════════════════════════════════════════
// ║   OFFLINE REPORT SECTION BUILDERS — ENGLISH                     ║
// ═════════════════════════════════════════════════════════════════

function _buildIntroductionEn(ud, ap, gt) {
    const rashi = RASHIS_EN[ap.rashiIdx];
    const nakshatra = NAKSHATRAS_EN[ap.nakshatraIdx];
    const ascendant = RASHIS_EN[ap.ascendantIdx];
    const { name, dob, birthTime, birthPlace, reportType } = ud;

    return `### Introduction

Beloved ${name}, welcome to your celestial reading. On the sacred day of ${dob}, at the precise moment of ${birthTime}, in the spiritually charged environment of ${birthPlace}, your soul chose to descend into this earthly realm. This was no random occurrence — the cosmos had been orchestrating this moment across lifetimes, aligning planetary positions with meticulous precision to support the unique journey your soul came to undertake.

At the time of your birth, the Moon was gracing the sign of **${rashi}**, and the lunar mansion of **${nakshatra}** was active, infusing your consciousness with its distinct vibrational signature. Your ascendant (Lagna) rises in **${ascendant}**, which shapes the way the world perceives you and how you project yourself into your environment. These three foundational placements form the sacred triad that defines the core of your astrological identity.

 ${name}, this ${_getReportTitleEn(reportType).toLowerCase()} report has been crafted to illuminate the planetary blueprint that was imprinted on your soul at the moment of your first breath. Every planet, every house, and every aspect in your chart carries a message — a divine whisper guiding you toward your highest potential. The ancient sages of Jyotish understood that the positions of the grahas (planets) at birth are not deterministic chains but rather a cosmic map, showing both the terrain of your karma and the pathways to transcend it.

As we journey through the various dimensions of your life together, remember this: the stars do not command — they counsel. Your free will is the most powerful force in your chart, and every recommendation in this report is designed to help you align your will with the cosmic currents that are naturally flowing in your favor.`;
}

function _buildPersonalityEn(ud, ap, gt) {
    const rashi = RASHIS_EN[ap.rashiIdx];
    const nakshatra = NAKSHATRAS_EN[ap.nakshatraIdx];
    const ascendant = RASHIS_EN[ap.ascendantIdx];
    const { name } = ud;

    return `### Personality

 ${name}, at the very core of your being, you are a reflection of the cosmic energies present at your birth. The Moon's placement in ${rashi} at the time of your birth deeply colors your emotional landscape — it governs how you process feelings, how you nurture yourself and others, and what brings you a sense of inner security. People with this lunar placement often display a fascinating duality: a public persona that is composed and steady, paired with an inner world that is richly textured and emotionally nuanced.

Your ascendant in ${ascendant} is the lens through which you experience the world. It shapes your physical presence, your first impressions, and your natural approach to new situations. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} carries an energy that is immediately noticeable — there is a certain quality about ${name} that people remember, a presence that lingers in a room even after ${gt.pronoun} has left it.

The nakshatra of ${nakshatra} active at your birth adds another layer of depth to your personality. Each of the 27 nakshatras carries a specific deity, a specific symbol, and a specific power (shakti) that it bestows upon those born under its influence. Your nakshatra infuses you with a unique inner strength that becomes increasingly apparent as you mature and grow into your authentic self.

One of your most striking qualities, ${name}, is your profound capacity for introspection and emotional depth. This is not a superficial trait but a deep-seated aspect of your character that has been forged through both the blessings and the challenges of your past experiences. You may not always recognize this strength in yourself — those closest to you see it clearly and rely upon it more than you know.

 ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} also possess a natural dignity that commands respect without demanding it. People sense that ${name} is someone of substance — not because of any external achievement, but because of an inner gravity that your ascendant sign bestows. Honor this quality, ${name}, for it will open doors that ambition alone cannot.`;
}

function _buildCareerEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'career';
    let extra = '';
    if (isFocus) {
        extra = `\n\nIn this specially focused career analysis, we go deeper into the professional dimensions of your chart. The tenth house (Karma Bhava) in your birth chart — the house of career, public standing, and professional achievement — is particularly significant for understanding your vocational dharma. The planetary influences on this house reveal not just what you will do, but what you are meant to do. ${name}, think of your career not as a sprint but as a carefully constructed cathedral — each stone matters, and the highest spires are built on the strongest foundations.`;
    }
    return `### Career\n\n${name}, your professional path is illuminated by the powerful interplay of the Sun, Mercury, and the tenth house in your birth chart. The Sun represents your sense of purpose and authority. Mercury governs your intellect, communication, and analytical abilities. Together, these planetary influences suggest a career trajectory that combines vision with execution.\n\nYou are naturally suited for roles that require both strategic thinking and the ability to inspire others. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} thrive in environments where ${gt.pronoun} can take initiative, propose new ideas, and see them through to completion. Your chart favors industries connected to communication, technology, leadership, consulting, creative arts, and any field where innovation and human connection intersect.\n\nThe timing of your career milestones is guided by your planetary periods (Dashas). In the coming years, you will experience a phase where opportunities for advancement come more rapidly. This is a period to be bold — to put yourself forward for roles that stretch your abilities, to network strategically, and to invest in skills that will compound in value over time.${extra}`;
}

function _buildLoveEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'love';
    let extra = '';
    if (isFocus) {
        extra = `\n\nIn this love-focused reading, we examine your romantic blueprint with special depth. Venus (Shukra) — the planet of love, beauty, and desire — holds the key to understanding your romantic nature. The house and sign Venus occupies in your chart reveals what you find attractive and what you need to feel truly loved. ${name}, your chart indicates that love, for you, is never superficial. You seek a connection that touches your soul.`;
    }
    return `### Love\n\n${name}, your romantic nature is one of the most beautiful and complex dimensions of your chart. Venus, the planet of love and relationships, along with the fifth house of romance, paints a portrait of someone who experiences love deeply, passionately, and with a level of emotional investment that few can match.\n\nIn matters of the heart, you are neither casual nor impulsive. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} approach love with a blend of idealism and caution. Once ${name} gives ${gt.possessive} heart, it is given completely, and this is precisely why ${gt.pronoun} is selective about who deserves that gift.\n\nYour chart suggests that you are most compatible with partners who share your values and can engage with you on both intellectual and emotional levels. You need someone who respects your independence, celebrates your ambitions, and provides a safe harbor for your tenderer feelings.${extra}`;
}

function _buildMarriageEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'marriage';
    let extra = '';
    if (isFocus) {
        extra = `\n\nIn this marriage-focused analysis, we turn our attention to the seventh house (Kalatra Bhava). ${name}, your chart indicates a marriage that will be a true partnership — not one of dependence but of mutual empowerment. The planetary influences suggest that your future spouse will be someone of strong character, someone who brings stability and growth into your life.`;
    }
    return `### Marriage\n\n${name}, the seventh house of your birth chart — known as Kalatra Bhava, the house of marriage and partnership — is one of the most significant areas of your astrological blueprint. It reveals not only the nature of your future spouse but also the quality of the partnership you are destined to build.\n\nThe planetary influences on your seventh house suggest that your marriage will be a union of both hearts and minds. You are not destined for a superficial partnership. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} will be drawn to someone who possesses qualities of integrity, warmth, and a shared vision for the future.\n\nThe timing of marriage in your chart is influenced by the transit of Jupiter over your seventh house. The most favorable window for marriage appears when Jupiter aspects your seventh house or its lord. In the interim, ${name}, focus on becoming the person you wish to marry — cultivate the qualities you seek, heal the wounds you carry, and trust that the right partnership will arrive at the divinely appointed time.${extra}`;
}

function _buildFinanceEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'finance';
    let extra = '';
    if (isFocus) {
        extra = `\n\nIn this finance-focused reading, we analyze the second house (Dhana Bhava) and the eleventh house (Labha Bhava), along with the positions of Jupiter and Saturn. ${name}, your financial chart reveals a pattern of steady accumulation rather than sudden windfall. The key for you is to balance prudent saving with strategic risk-taking.`;
    }
    return `### Finance\n\n${name}, your financial prospects are governed by the second house (Dhana Bhava — the house of accumulated wealth) and the eleventh house (Labha Bhava — the house of income and gains), along with the influences of Jupiter and Saturn.\n\nJupiter's influence in your chart suggests that your financial growth is tied to knowledge, wisdom, and ethical conduct. You are not someone who will find lasting prosperity through shortcuts. Your wealth comes through applying your intelligence, building expertise, and serving others with integrity.\n\nSaturn plays a significant role in your financial journey. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} may experience periods of financial consolidation followed by breakthroughs — this is the natural rhythm of Saturn, which rewards patience and sustained effort. Investments made with careful research and a long-term horizon will serve you far better than speculative ventures.${extra}`;
}

function _buildBusinessEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'business';
    let extra = '';
    if (isFocus) {
        extra = `\n\nIn this business-focused analysis, we examine the third house (Parakrama Bhava), the seventh house, the tenth house, and the eleventh house. ${name}, your chart reveals strong entrepreneurial indicators. You have the vision to identify opportunities and the persistence to see ventures through their inevitable ups and downs.`;
    }
    return `### Business\n\n${name}, your entrepreneurial potential is revealed through the analysis of the third house (initiative and courage), the seventh house (partnerships), the tenth house (authority), and the eleventh house (gains), along with the influences of Mercury and Mars.\n\nMercury's placement in your chart suggests strong commercial intelligence. Mars provides the drive and competitive edge that entrepreneurship demands. Together, these influences indicate that ${name} has the potential to build and lead successful ventures, particularly in fields connected to communication, technology, consulting, or trading.\n\nIf you are considering starting a business, your chart advises careful planning during the conceptual phase, followed by decisive action once the plan is solid. For business partnerships, your chart suggests seeking collaborators who complement rather than replicate your skills.${extra}`;
}

function _buildHealthEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'health';
    let extra = '';
    if (isFocus) {
        extra = `\n\nIn this health-focused reading, we examine the sixth house (Ari Bhava) and the eighth house (Ayush Bhava). ${name}, your chart suggests that your greatest health asset is your body's natural resilience. The key is to work with your body's natural rhythms rather than against them.`;
    }
    return `### Health Guidance\n\n${name}, according to Vedic astrological tradition, the sixth house (Ari Bhava) of your birth chart, along with the influences of the Sun, Moon, and Saturn, provides insight into your physical vitality and traditional wellness guidance. From the perspective of Jyotish, health is seen as a balance of the three doshas (Vata, Pitta, Kapha) and the smooth flow of prana (life force).\n\nThe Sun's placement governs your overall vitality and life force. The Moon's influence is connected to your emotional and mental well-being. Saturn's influence suggests areas where you may need to exercise particular care over the long term, such as bones, joints, and the nervous system.\n\nTraditional Vedic wellness guidance recommends that ${name} maintain bone health through adequate calcium intake, joint mobility through regular gentle exercise like yoga, and nervous system health through stress management and adequate rest.\n\n**Important:** This guidance is based on traditional Vedic astrological principles and is not a substitute for professional medical advice.${extra}`;
}

function _buildLuckySectionsEn(ud, ap) {
    const { name } = ud;
    const luckyNumber = _pickRandom(LUCKY_NUMBERS);
    const luckyColor = _pickRandom(LUCKY_COLORS_EN);
    const luckyDay = _pickRandom(LUCKY_DAYS_EN);
    const luckyDirection = _pickRandom(LUCKY_DIRECTIONS_EN);
    const gemstone = _pickRandom(GEMSTONES_EN);
    const rudraksha = _pickRandom(RUDRAKSHAS_EN);

    return `### Lucky Number\n\n**${luckyNumber}**\n\n${name}, the number ${luckyNumber} resonates most powerfully with your birth chart's vibrational frequency. Incorporating this number into your daily life amplifies your natural alignment with cosmic favor.\n\n### Lucky Color\n\n**${luckyColor}**\n\nThe color ${luckyColor} carries the specific wavelength of light that complements the planetary influences dominant in your birth chart. ${name}, wearing this color enhances your vibrational alignment.\n\n### Lucky Day\n\n**${luckyDay}**\n\n${luckyDay} is the day of the week that carries the most favorable planetary vibrations for ${name}. This is the ideal day for initiating important endeavors.\n\n### Lucky Direction\n\n**${luckyDirection}**\n\nThe ${luckyDirection} direction is the most auspicious for ${name} according to Vastu Shastra. Face this direction while working or making important decisions.\n\n### Lucky Gemstone\n\n**${gemstone.name}**\n\n**Planetary Ruler:** ${gemstone.planet}\n**Recommended Metal:** ${gemstone.metal}\n**Ideal Weight:** ${gemstone.weight}\n\n${name}, the ${gemstone.name} is the gemstone most aligned with your birth chart. When worn in ${gemstone.metal.toLowerCase()}, it strengthens the positive manifestations of ${gemstone.planet}'s energy in your life.\n\n### Lucky Rudraksha\n\n**${rudraksha.mukhi} Rudraksha**\n\n**Presiding Deity:** ${rudraksha.deity}\n**Primary Benefit:** ${rudraksha.benefit}\n\n${name}, the ${rudraksha.mukhi} Rudraksha is the most spiritually beneficial for your chart. Wearing this sacred bead bestows ${rudraksha.benefit}.`;
}

function _buildRemediesEn(ud, ap) {
    const { name } = ud;
    const selectedRemedies = _pickRandomN(REMEDIES_POOL_EN, 7);
    let remediesText = `### Remedies\n\n${name}, the following Vedic remedies have been selected based on the planetary configurations in your birth chart. These remedies (Upayas) are time-tested spiritual technologies designed to harmonize planetary energies. Approach them with faith and consistency.\n\n`;
    selectedRemedies.forEach((remedy, i) => {
        remediesText += `**${i + 1}.** ${remedy.text}\n\n   *Recommended timing: ${remedy.day}*\n\n`;
    });
    remediesText += `**Additional Guidance for ${name}:**\n\nBeyond these specific remedies, cultivate an attitude of gratitude each morning upon waking. This simple practice aligns your consciousness with the frequency of abundance.`;
    return remediesText;
}

function _buildConclusionEn(ud, ap, gt) {
    const { name } = ud;
    return `### Positive Conclusion\n\n${name}, as we come to the close of this celestial reading, I want you to pause for a moment and feel the truth of what has been shared. You are not a random collection of circumstances — you are a carefully designed expression of cosmic intelligence, born at the precise moment when the planets aligned to support your unique soul mission.\n\nThe challenges you have faced, ${name}, are not punishments — they are initiations. Every obstacle has been a teacher, every heartbreak a lesson in love, every setback a redirection toward your true path. You are wiser, deeper, and more capable than you give yourself credit for.\n\n${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} carry within ${gt.object} a divine spark that is ${gt.possessive} alone. Honor this uniqueness, ${name}. Do not dim your light to make others comfortable. Your chart supports greatness — the kind that makes a life of meaning, impact, and deep soulful satisfaction.\n\nAs you move forward, carry these cosmic insights as a lantern in the dark. When you feel lost, remember that your chart has already mapped the terrain. When you feel weak, remember that the same planets that challenge you also empower you.\n\n${name}, may the blessings of all the grahas be upon you. May your path be illuminated, your heart be fulfilled, and your journey through this lifetime be everything your soul came here to experience. The stars have spoken — now it is your turn to shine.\n\n**🙏 Om Shanti Shanti Shanti 🙏**`;
}


// ═════════════════════════════════════════════════════════════════
// ║   OFFLINE REPORT SECTION BUILDERS — HINDI                       ║
// ═════════════════════════════════════════════════════════════════

function _buildIntroductionHi(ud, ap, gt) {
    const rashi = RASHIS_HI[ap.rashiIdx];
    const nakshatra = NAKSHATRAS_HI[ap.nakshatraIdx];
    const ascendant = RASHIS_HI[ap.ascendantIdx];
    const { name, dob, birthTime, birthPlace, reportType } = ud;

    return `### प्रस्तावना\n\nप्रिय ${name}, आपके दिव्य ज्योतिषीय पाठ में आपका स्वागत है। ${dob} के पावन दिन पर, ${birthTime} के सटीक क्षण पर, ${birthPlace} के आध्यात्मिक रूप से ऊर्जावान वातावरण में, आपकी आत्मा ने इस पार्थिव लोक में अवतरण करने का चयन किया। यह कोई आकस्मिक घटना नहीं थी — ब्रह्मांड ने जीवनों तक इस क्षण को संचालित किया था, ग्रहीय स्थितियों को सूक्ष्म परिशुद्धता के साथ संरेखित करके आपकी आत्मा की अद्वितीय यात्रा का समर्थन किया।\n\nआपके जन्म के समय, चंद्रमा **${rashi}** राशि में विराजमान था, और **${nakshatra}** नक्षत्र सक्रिय था, जो आपकी चेतना को अपनी विशिष्ट कंपनात्मक सिग्नेचर से आशीर्वादित कर रहा था। आपका लग्न (आरोह) **${ascendant}** में उदित हो रहा है, जो निर्धारित करता है कि दुनिया आपको कैसे देखती है और आप अपने परिवेश में स्वयं को कैसे प्रकट करते हैं। ये तीन आधारभूत स्थान वह पवित्र त्रय बनाते हैं जो आपकी ज्योतिषीय पहचान के मूल को परिभाषित करता है।\n\n${name}, यह ${_getReportTitleHi(reportType)} रिपोर्ट आपके जन्म के क्षण पर आपकी आत्मा पर अंकित की गई ग्रहीय खाके को प्रकाशित करने के लिए तैयार की गई है। आपकी कुंडली में प्रत्येक ग्रह, प्रत्येक भाव और प्रत्येक दृष्टि एक संदेश लेकर आती है — एक दिव्य फुसफुसाहट जो आपको आपकी उच्चतम क्षमता की ओर मार्गदर्शन करती है।\n\nजैसे ही हम आपके जीवन के विभिन्न आयामों की यात्रा करते हैं, यह स्मरण रखें: तारे आदेश नहीं देते — वे परामर्श देते हैं। आपकी स्वतंत्र इच्छा आपकी कुंडली की सबसे शक्तिशाली शक्ति है, और इस रिपोर्ट में प्रत्येक अनुशंसा को आपकी इच्छा को उन ब्रह्मांडीय धाराओं के साथ संरेखित करने में सहायता के लिए डिज़ाइन किया गया है जो स्वाभाविक रूप से आपके पक्ष में बह रही हैं।`;
}

function _buildPersonalityHi(ud, ap, gt) {
    const rashi = RASHIS_HI[ap.rashiIdx];
    const nakshatra = NAKSHATRAS_HI[ap.nakshatraIdx];
    const ascendant = RASHIS_HI[ap.ascendantIdx];
    const { name } = ud;

    return `### व्यक्तित्व\n\n${name}, अपने वर्तमान स्वरूप में आप अपने जन्म के समय उपस्थित ब्रह्मांडीय ऊर्जाओं का प्रतिबिंब हैं। आपके जन्म के समय चंद्रमा की ${rashi} राशि में स्थिति आपके भावनात्मक परिदृश्य को गहराई से रंगती है — यह निर्धारित करती है कि आप भावनाओं को कैसे संसाधित करते हैं और क्या आपको आंतरिक सुरक्षा की भावना देता है। इस चंद्र स्थान वाले लोग अक्सर एक आकर्षक द्वैत प्रदर्शित करते हैं: एक सार्वजनिक व्यक्तित्व जो संयमित है, के साथ एक आंतरिक दुनिया जो समृद्ध रूप से बनावटी है।\n\nआपका ${ascendant} में लग्न वह लेंस है जिसके माध्यम से आप दुनिया का अनुभव करते हैं। यह आपकी शारीरिक उपस्थिति और नई स्थितियों के प्रति आपके स्वाभाविक दृष्टिकोण को आकार देता है। आपके व्यक्तित्व में एक ऐसी ऊर्जा है जो तुरंत ध्यान खींचती है — ${name} में एक ऐसी गुणवत्ता है जो लोग याद रखते हैं।\n\nआपके जन्म के समय सक्रिय ${nakshatra} नक्षत्र आपके व्यक्तित्व में गहराई का एक और स्तर जोड़ता है। 27 नक्षत्रों में से प्रत्येक एक विशिष्ट देवता और एक विशिष्ट शक्ति को वहन करता है। आपका नक्षत्र आपको एक अनोखी आंतरिक शक्ति प्रदान करता है जो आपके परिपक्व होने के साथ अधिक स्पष्ट होती जाती है।\n\nआपकी सबसे आकर्षक विशेषताओं में से एक, ${name}, आत्मनिरीक्षण और भावनात्मक गहराई की आपकी गहरी क्षमता है। यह कोई उथला लक्षण नहीं है बल्कि आपके चरित्र का एक गहरा पहलू है। आप इस शक्ति को हमेशा स्वयं में पहचान नहीं पाते — आपके सबसे करीबी लोग इसे स्पष्ट रूप से देखते हैं।\n\nआपके लग्न द्वारा प्रदान की गई एक प्राकृतिक गरिमा भी है जो बिना मांगे सम्मान आदेश करती है। लोग महसूस करते हैं कि ${name} सार का व्यक्ति है। इस गुणवत्ता का सम्मान करें, ${name}, क्योंकि यह ऐसे दरवाजे खोलेगी जिन्हें केवल महत्वाकांक्षा नहीं खोल सकती।`;
}

function _buildCareerHi(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'career';
    let extra = '';
    if (isFocus) {
        extra = `\n\nइस विशेष रूप से करियर-केंद्रित विश्लेषण में, हम आपकी कुंडली के व्यावसायिक आयामों में गहराई से जाते हैं। दसवां भाव (कर्म भाव) आपके व्यावसायिक धर्म को समझने के लिए विशेष रूप से महत्वपूर्ण है। ${name}, अपने करियर को दौड़ नहीं बल्कि एक सावधानी से निर्मित मंदिर के रूप में सोचें — हर पत्थर मायने रखता है, और उच्चतम शिखर सबसे मजबूत नींव पर बनते हैं।`;
    }
    return `### करियर\n\n${name}, आपका व्यावसायिक मार्ग आपकी जन्म कुंडली में सूर्य, बुध और दसवें भाव के शक्तिशाली अंतर्क्रिया द्वारा प्रकाशित है। सूर्य आपके उद्देश्य और अधिकार की भावना का प्रतिनिधित्व करता है। बुध आपकी बुद्धि, संचार और विश्लेषणात्मक क्षमताओं को नियंत्रित करता है। साथ में, ये ग्रहीय प्रभाव एक ऐसे करियर प्रक्षेपक का संकेत देते हैं जो दृष्टि को निष्पादन के साथ जोड़ता है।\n\nआप स्वाभाविक रूप से ऐसी भूमिकाओं के लिए उपयुक्त हैं जिनमें रणनीतिक चिंतन और दूसरों को प्रेरित करने की क्षमता दोनों आवश्यक हैं। आप उन वातावरणों में फलते-फूलते हैं जहाँ आप पहल कर सकते हैं, नए विचार प्रस्तुत कर सकते हैं और उन्हें पूर्णता तक ले जा सकते हैं। आपकी कुंडली संचार, प्रौद्योगिकी, नेतृत्व, परामर्श, रचनात्मक कला और उन क्षेत्रों से जुड़े उद्योगों के अनुकूल है जहाँ नवाचार और मानव संबंध एक साथ मिलते हैं।\n\nआपके करियर की मील के पत्थरों का समय आपके ग्रहीय दशाओं द्वारा निर्देशित होता है। आने वाले वर्षों में, आप एक ऐसे चरण का अनुभव करेंगे जहाँ उन्नति के अवसर अधिक तेजी से आएंगे। यह एक साहसी बनने का समय है — ऐसी भूमिकाओं के लिए स्वयं को आगे रखें जो आपकी क्षमताओं को विस्तारित करें, रणनीतिक रूप से नेटवर्क बनाएं और ऐसे कौशलों में निवेश करें जो समय के साथ मूल्य में वृद्धि करेंगे।${extra}`;
}

function _buildLoveHi(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'love';
    let extra = '';
    if (isFocus) {
        extra = `\n\nइस प्रेम-केंद्रित पाठ में, हम विशेष गहराई के साथ आपके रोमांटिक खाके की जांच करते हैं। शुक्र (Venus) — प्रेम, सुंदरता और इच्छा का ग्रह — आपके रोमांटिक स्वभाव को समझने की कुंजी है। ${name}, आपकी कुंडली संकेत करती है कि आपके लिए प्रेम कभी उथला नहीं है। आप एक ऐसे संबंध की तलाश करते हैं जो आपकी आत्मा को छूए।`;
    }
    return `### प्रेम\n\n${name}, आपका रोमांटिक स्वभाव आपकी कुंडली के सबसे सुंदर और जटिल आयामों में से एक है। शुक्र, प्रेम और रिश्तों का ग्रह, रोमांस के पांचवें भाव के साथ, एक ऐसे व्यक्ति का चित्रण करता है जो प्रेम को गहराई से, जुनून के साथ और एक भावनात्मक निवेश के स्तर के साथ अनुभव करता है जिसकी कुछ ही तुलना हो सकती है।\n\nहृदय के मामलों में, आप न तो आकस्मिक हैं और न ही आवेगशील। आप प्रेम का दृष्टिकोण आदर्शवाद और सतर्कता के मिश्रण के साथ करते हैं। एक बार जब ${name} अपना हृदय दे देता है, तो वह पूरी तरह से दे देता है, और यही कारण है कि वह इस बात का चयन करता है कि इस उपहार का हकदार कौन है।\n\nआपकी कुंडली संकेत करती है कि आप उन साझेदारों के साथ सबसे अधिक संगत हैं जो आपके मूल्यों को साझा करते हैं और बौद्धिक और भावनात्मक दोनों स्तरों पर आपके साथ जुड़ सकते हैं। आपको ऐसे किसी की आवश्यकता है जो आपकी स्वतंत्रता का सम्मान करे, आपकी महत्वाकांक्षाओं का जश्न मनाए और आपकी कोमल भावनाओं के लिए एक सुरक्षित बंदरगाह प्रदान करे।${extra}`;
}

function _buildMarriageHi(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'marriage';
    let extra = '';
    if (isFocus) {
        extra = `\n\nइस विवाह-केंद्रित विश्लेषण में, हम सातवें भाव (कलात्र भाव) पर ध्यान केंद्रित करते हैं। ${name}, आपकी कुंडली एक ऐसे विवाह का संकेत देती है जो एक सच्ची साझेदारी होगी — परनिर्भरता की नहीं, बल्कि पारस्परिक सशक्तिकरण की।`;
    }
    return `### विवाह\n\n${name}, आपकी जन्म कुंडली का सातवां भाव — जिसे कलात्र भाव, विवाह और साझेदारी का भाव कहा जाता है — आपके ज्योतिषीय खाके के सबसे महत्वपूर्ण क्षेत्रों में से एक है। यह न केवल आपके भविष्य के जीवनसाथी की प्रकृति को बल्कि उस साझेदारी की गुणवत्ता को भी प्रकट करता है जिसे आप बनाने के लिए नियत हैं।\n\nआपके सातवें भाव पर ग्रहीय प्रभाव संकेत करते हैं कि आपका विवाह हृदय और दिमाग दोनों का मिलन होगा। आप एक उथले साझेदारी के लिए नियत नहीं हैं। आप ऐसे किसी की ओर आकर्षित होंगे जिसमें ईमानदारी, गर्मजोशी और भविष्य के लिए साझा दृष्टिकोण के गुण हों।\n\nआपकी कुंडली में विवाह का समय आपके सातवें भाव पर गुरु (बृहस्पति) के गोचर से प्रभावित होता है। विवाह के लिए सबसे अनुकूल समय तब प्रकट होता है जब गुरु आपके सातवें भाव या उसके स्वामी पर दृष्टि डालता है। इस बीच, ${name}, उस व्यक्ति को बनने पर ध्यान केंद्रित करें जिससे आप विवाह करना चाहते हैं — जिन गुणों की आप तलाश करते हैं उन्हें विकसित करें, अपने घावों को भरें, और विश्वास रखें कि सही साझेदारी दिव्य रूप से नियत समय पर आएगी।${extra}`;
}

function _buildFinanceHi(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'finance';
    let extra = '';
    if (isFocus) {
        extra = `\n\nइस वित्त-केंद्रित पाठ में, हम दूसरे भाव (धन भाव) और ग्यारहवें भाव (लाभ भाव) का विश्लेषण करते हैं। ${name}, आपकी वित्तीय कुंडली अचानक धन वर्षा के बजाय निरंतर संचय का पैटर्न दर्शाती है। आपके लिए कुंजी चतुर बचत को रणनीतिक जोखिम लेने के साथ संतुलित करना है।`;
    }
    return `### वित्त\n\n${name}, आपकी वित्तीय संभावनाएं दूसरे भाव (धन भाव — संचित धन का भाव) और ग्यारहवें भाव (लाभ भाव — आय और लाभ का भाव) द्वारा शासित हैं, साथ ही गुरु और शनि के प्रभाव के साथ।\n\nआपकी कुंडली में गुरु का प्रभाव संकेत करता है कि आपकी वित्तीय वृद्धि ज्ञान, बुद्धिमत्ता और नैतिक आचरण से जुड़ी है। आप ऐसे व्यक्ति नहीं हैं जो शॉर्टकट के माध्यम से लंबे समय की समृद्धि प्राप्त करेगा। आपका धन अपनी बुद्धिमत्ता को लागू करने, विशेषज्ञता बनाने और ईमानदारी के साथ दूसरों की सेवा करने से आता है।\n\nशनि आपकी वित्तीय यात्रा में एक महत्वपूर्ण भूमिका निभाता है। आपको वित्तीय समेकन की अवधि और फिर सफलता का अनुभव हो सकता है — यह शनि की प्राकृतिक लय है, जो धैर्य और निरंतर प्रयास को पुरस्कृत करता है। सावधानीपूर्वक शोध और दीर्घकालिक क्षितिज के साथ किए गए निवेश आपको सट्टा उद्यमों की तुलना में कहीं बेहतर सेवा देंगे।${extra}`;
}

function _buildBusinessHi(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'business';
    let extra = '';
    if (isFocus) {
        extra = `\n\nइस व्यवसाय-केंद्रित विश्लेषण में, हम तीसरे भाव, सातवें भाव, दसवें भाव और ग्यारहवें भाव की जांच करते हैं। ${name}, आपकी कुंडली मजबूत उद्यमशीलता संकेतकों को प्रकट करती है। आपके पास अवसरों की पहचान करने की दृष्टि है।`;
    }
    return `### व्यवसाय\n\n${name}, आपकी उद्यमशील क्षमता तीसरे भाव (पहल और साहस), सातवें भाव (साझेदारी), दसवें भाव (अधिकार), और ग्यारहवें भाव (लाभ) के विश्लेषण के साथ-साथ बुध और मंगल के प्रभावों के माध्यम से प्रकट होती है।\n\nआपकी कुंडली में बुध की स्थिति मजबूत वाणिज्यिक बुद्धिमत्ता का संकेत देती है। मंगल वह ड्राइव और प्रतिस्पर्धात्मक बढ़त प्रदान करता है जिसकी उद्यमशीलता मांग करती है। साथ में, ये प्रभाव संकेत करते हैं कि ${name} के पास सफल उद्यमों का निर्माण और नेतृत्व करने की क्षमता है, विशेष रूप से संचार, प्रौद्योगिकी, परामर्श या व्यापार से जुड़े क्षेत्रों में।\n\nयदि आप व्यवसाय शुरू करने पर विचार कर रहे हैं, तो आपकी कुंडली वैचारिक चरण के दौरान सावधानीपूर्वक योजना की सलाह देती है, और योजना के ठोस होने के बाद निर्णायक कार्रवाई करती है। व्यावसायिक साझेदारी के लिए, आपकी कुंडली ऐसे सहयोगियों की तलाश करने का सुझाव देती है जो आपके कौशल की नकल करने के बजाय उसे पूरक हों।${extra}`;
}

function _buildHealthHi(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'health';
    let extra = '';
    if (isFocus) {
        extra = `\n\nइस स्वास्थ्य-केंद्रित पाठ में, हम छठे भाव (अरि भाव) और आठवें भाव (आयुष भाव) की जांच करते हैं। ${name}, आपकी कुंडली संकेत करती है कि आपकी सबसे बड़ी स्वास्थ्य संपत्ति आपके शरीर की प्राकृतिक लचीलापन है। कुंजी अपने शरीर की प्राकृतिक लय के साथ काम करना है।`;
    }
    return `### स्वास्थ्य मार्गदर्शन\n\n${name}, वैदिक ज्योतिषीय परंपरा के अनुसार, आपकी जन्म कुंडली का छठा भाव (अरि भाव), सूर्य, चंद्रमा और शनि के प्रभावों के साथ, आपकी शारीरिक ऊर्जा और पारंपरिक कल्याण मार्गदर्शन में अंतर्दृष्टि प्रदान करता है। ज्योतिष के दृष्टिकोण से, स्वास्थ्य को तीन दोषों (वात, पित्त, कफ) का संतुलन माना जाता है।\n\nसूर्य की स्थिति आपकी समग्र ऊर्जा और जीवन शक्ति को नियंत्रित करती है। चंद्रमा का प्रभाव आपकी भावनात्मक और मानसिक कल्याण से जुड़ा है। शनि का प्रभाव उन क्षेत्रों का संकेत करता है जहाँ आपको लंबे समय तक विशेष देखभाल करने की आवश्यकता हो सकती है, जैसे हड्डियाँ, जोड़ और तंत्रिका तंत्र।\n\nपारंपरिक वैदिक कल्याण मार्गदर्शन अनुशंसा करता है कि ${name} पर्याप्त कैल्शियम सेवन के माध्यम से हड्डी स्वास्थ्य बनाए रखें, योग जैसे नियमित सौम्य व्यायाम के माध्यम से जोड़ों की गतिशीलता बनाए रखें, और तनाव प्रबंधन और पर्याप्त आराम के माध्यम से तंत्रिका तंत्र के स्वास्थ्य को बनाए रखें।\n\n**महत्वपूर्ण:** यह मार्गदर्शन पारंपरिक वैदिक ज्योतिषीय सिद्धांतों पर आधारित है और यह पेशेवर चिकित्सा सलाह का विकल्प नहीं है।${extra}`;
}

function _buildLuckySectionsHi(ud, ap) {
    const { name } = ud;
    const luckyNumber = _pickRandom(LUCKY_NUMBERS);
    const luckyColor = _pickRandom(LUCKY_COLORS_HI);
    const luckyDay = _pickRandom(LUCKY_DAYS_HI);
    const luckyDirection = _pickRandom(LUCKY_DIRECTIONS_HI);
    const gemstone = _pickRandom(GEMSTONES_HI);
    const rudraksha = _pickRandom(RUDRAKSHAS_HI);

    return `### भाग्यशाली अंक\n\n**${luckyNumber}**\n\n${name}, अंक ${luckyNumber} आपकी जन्म कुंडली की कंपनात्मक आवृत्ति के साथ सबसे शक्तिशाली रूप से प्रतिध्वनित होता है। इस अंक को अपने दैनिक जीवन में शामिल करने से ब्रह्मांडीय अनुग्रह के साथ आपकी प्राकृतिक संरेखण बढ़ जाता है।\n\n### भाग्यशाली रंग\n\n**${luckyColor}**\n\n${luckyColor} रंग उस विशिष्ट प्रकाश तरंगदैर्ध्य को वहन करता है जो आपकी जन्म कुंडली में प्रमुख ग्रहीय प्रभावों के पूरक है। ${name}, इस रंग को पहनने से आपके कंपन संरेखण में वृद्धि होती है।\n\n### भाग्यशाली दिन\n\n**${luckyDay}**\n\n${luckyDay} वह दिन है जो ${name} के लिए सबसे अनुकूल ग्रहीय कंपन वहन करता है। यह महत्वपूर्ण प्रयासों को शुरू करने के लिए एक आदर्श दिन है।\n\n### भाग्यशाली दिशा\n\n**${luckyDirection}**\n\n${luckyDirection} दिशा वास्तु शास्त्र के अनुसार ${name} के लिए सबसे शुभ है। काम करते समय या महत्वपूर्ण निर्णय लेते समय इस दिशा की ओर मुख करें।\n\n### भाग्यशाली रत्न\n\n**${gemstone.name}**\n\n**ग्रह स्वामी:** ${gemstone.planet}\n**अनुशंसित धातु:** ${gemstone.metal}\n**आदर्श वजन:** ${gemstone.weight}\n\n${name}, ${gemstone.name} वह रत्न है जो आपकी जन्म कुंडली के साथ सबसे अधिक संरेखित है। ${gemstone.metal.toLowerCase()} में पहने जाने पर, यह आपके जीवन में ${gemstone.planet} की ऊर्जा की सकारात्मक अभिव्यक्तियों को मजबूत करता है।\n\n### भाग्यशाली रुद्राक्ष\n\n**${rudraksha.mukhi} रुद्राक्ष**\n\n**अध्यक्ष देवता:** ${rudraksha.deity}\n**प्राथमिक लाभ:** ${rudraksha.benefit}\n\n${name}, ${rudraksha.mukhi} रुद्राक्ष आपकी कुंडली के लिए सबसे आध्यात्मिक रूप से लाभदायक है। इस पवित्र मनके को पहनने से ${rudraksha.benefit} प्राप्त होता है।`;
}

function _buildRemediesHi(ud, ap) {
    const { name } = ud;
    const selectedRemedies = _pickRandomN(REMEDIES_POOL_HI, 7);
    let remediesText = `### उपाय\n\n${name}, आपकी जन्म कुंडली में ग्रहीय विन्यास के आधार पर निम्नलिखित वैदिक उपायों का चयन किया गया है। ये उपाय (उपाय) समय-परीक्षित आध्यात्मिक तकनीकें हैं। इन्हें विश्वास और निरंतरता के साथ अपनाएं।\n\n`;
    selectedRemedies.forEach((remedy, i) => {
        remediesText += `**${i + 1}.** ${remedy.text}\n\n   *अनुशंसित समय: ${remedy.day}*\n\n`;
    });
    remediesText += `**${name} के लिए अतिरिक्त मार्गदर्शन:**\n\nइन विशिष्ट उपायों के अलावा, सुबह उठने पर आभार व्यक्त करने की भावना का पोषण करें। यह सरल अभ्यास आपकी चेतना को प्रचुरता की आवृत्ति के साथ संरेखित करता है।`;
    return remediesText;
}

function _buildConclusionHi(ud, ap, gt) {
    const { name } = ud;
    return `### सकारात्मक निष्कर्ष\n\n${name}, जैसे ही हम इस दिव्य ज्योतिषीय पाठ के अंत तक पहुँचते हैं, मैं चाहता हूँ कि आप एक पल के लिए रुकें और जो साझा किया गया है उसकी सच्चाई को महसूस करें। आप परिस्थितियों का आकस्मिक संग्रह नहीं हैं — आप ब्रह्मांडीय बुद्धिमत्ता की एक सावधानी से डिज़ाइन की गई अभिव्यक्ति हैं, ठीक उसी क्षण में जन्मे थे जब ग्रह आपकी अद्वितीय आत्मा मिशन का समर्थन करने के लिए संरेखित हुए थे।\n\nआपने जो चुनौतियाँ का सामना किया है, ${name}, वे दंड नहीं हैं — वे दीक्षा हैं। हर बाधा एक शिक्षक रही है, हर दिल टूटना प्रेम में एक सबक रहा है, हर असफलता आपके सच्चे मार्ग की ओर एक पुनर्निर्देशन रहा है। आप अपनी सोच से जहाँ भी खुद को मानते हैं, उससे कहीं अधिक बुद्धिमान, गहरे और अधिक सक्षम हैं।\n\nआपके भीतर एक दिव्य चिंगारी है जो केवल आपकी है। इस अद्वितीयता का सम्मान करें, ${name}। दूसरों को सहज करने के लिए अपनी रोशनी को मद्धम न करें। आपकी कुंडली महानता का समर्थन करती है — वह महानता जो जीवन को अर्थ, प्रभाव और गहरी आत्मिक संतुष्टि प्रदान करती है।\n\nआगे बढ़ते हुए, इन ब्रह्मांडीय अंतर्दृष्टियों को अंधकार में एक लालटेन के रूप में साथ रखें। जब आप खोया हुआ महसूस करें, तो याद रखें कि आपकी कुंडली ने पहले ही भूभाग का मानचित्र बना दिया है। जब आप कमजोर महसूस करें, तो याद रखें कि वेीं ग्रह जो आपको चुनौती देते हैं, वे आपको सशक्त भी बनाते हैं।\n\n${name}, सभी ग्रहों का आशीर्वाद आप पर रहे। आपका मार्ग प्रकाशित हो, आपका हृदय पूर्ण हो, और इस जीवन के माध्यम से आपकी यात्रा वह सब कुछ हो जो आपकी आत्मा यहाँ अनुभव करने आई थी। तारों ने बोल दिया है — अब चमकने की बारी आपकी है।\n\n**🙏 ॐ शांति शांति शांति 🙏**`;
}


// ═════════════════════════════════════════════════════════════════
// ║   OFFLINE REPORT MAIN ORCHESTRATOR                              ║
// ═════════════════════════════════════════════════════════════════
function _generateOfflineReport(userData) {
    const lang = _detectLang(userData.language);
    const ap = _computeAstroProfile(userData);
    const gt = _getGenderTerms(userData.gender, lang);

    if (lang === 'hi') {
        const title = _getReportTitleHi(userData.reportType);
        return `# दिव्य ज्योतिषीय अंतर्दृष्टि — ${title} रिपोर्ट\n## ${userData.name} के लिए\न\n` +
            _buildIntroductionHi(userData, ap, gt) + '\n\n---\n\n' +
            _buildPersonalityHi(userData, ap, gt) + '\n\n---\n\n' +
            _buildCareerHi(userData, ap, gt) + '\n\n---\n\n' +
            _buildLoveHi(userData, ap, gt) + '\n\n---\n\n' +
            _buildMarriageHi(userData, ap, gt) + '\n\n---\n\n' +
            _buildFinanceHi(userData, ap, gt) + '\n\n---\n\n' +
            _buildBusinessHi(userData, ap, gt) + '\n\n---\n\n' +
            _buildHealthHi(userData, ap, gt) + '\n\n---\n\n' +
            _buildLuckySectionsHi(userData, ap) + '\n\n---\n\n' +
            _buildRemediesHi(userData, ap) + '\n\n---\n\n' +
            _buildConclusionHi(userData, ap, gt);
    } else {
        const title = _getReportTitleEn(userData.reportType);
        return `# Celestial Insights — ${title} Report\n## For ${userData.name}\n\n` +
            _buildIntroductionEn(userData, ap, gt) + '\n\n---\n\n' +
            _buildPersonalityEn(userData, ap, gt) + '\n\n---\n\n' +
            _buildCareerEn(userData, ap, gt) + '\n\n---\n\n' +
            _buildLoveEn(userData, ap, gt) + '\n\n---\n\n' +
            _buildMarriageEn(userData, ap, gt) + '\n\n---\n\n' +
            _buildFinanceEn(userData, ap, gt) + '\n\n---\n\n' +
            _buildBusinessEn(userData, ap, gt) + '\n\n---\n\n' +
            _buildHealthEn(userData, ap, gt) + '\n\n---\n\n' +
            _buildLuckySectionsEn(userData, ap) + '\n\n---\n\n' +
            _buildRemediesEn(userData, ap) + '\n\n---\n\n' +
            _buildConclusionEn(userData, ap, gt);
    }
}


// ═════════════════════════════════════════════════════════════════
// ║   MAIN EXPORTED FUNCTION                                        ║
// ═════════════════════════════════════════════════════════════════

/**
 * Generate a professional Vedic astrology report using Gemini 2.5 Flash.
 * Includes a smart fallback to offline generation if Gemini fails.
 *
 * @param {Object} userData - User birth details and preferences
 * @returns {Promise<string>} - Generated report in Markdown format
 */
async function generateAstrologyReport(userData) {
    // ── Input validation ──────────────────────────────────────
    if (!userData || typeof userData !== 'object') {
        throw new Error('generateAstrologyReport: userData must be a valid object');
    }

    const requiredFields = ['name', 'gender', 'dob', 'birthTime', 'birthPlace', 'language', 'reportType'];
    const missingFields = requiredFields.filter(field => !userData[field]);

    if (missingFields.length > 0) {
        throw new Error(
            `generateAstrologyReport: Missing required fields: ${missingFields.join(', ')}`
        );
    }

    // Normalize report type aliases
    const REPORT_TYPE_ALIAS = {
        basic: "career",
        premium: "love",
        deluxe: "marriage",
        complete: "complete"
    };
    userData.reportType = REPORT_TYPE_ALIAS[userData.reportType] || userData.reportType;

    const validReportTypes = ['career', 'love', 'marriage', 'business', 'finance', 'health', 'complete'];
    if (!validReportTypes.includes(userData.reportType)) {
        throw new Error(
            `generateAstrologyReport: Invalid reportType "${userData.reportType}". Must be one of: ${validReportTypes.join(', ')}`
        );
    }

    // ── Check if Gemini API key is missing ─────────────────────
    if (!GEMINI_API_KEY || !ai) {
        console.warn('[astro-gemini.js] GEMINI_API_KEY missing. Generating offline report.');
        return _generateOfflineReport(userData);
    }

    // ── Build prompts ─────────────────────────────────────────
    const targetLanguage = LANGUAGE_MAP[userData.language] || 'English';
    const systemPrompt = buildSystemPrompt(targetLanguage);
    const userPrompt = buildUserPrompt(userData);

    // ── Call Gemini API ───────────────────────────────────────
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: MODEL_ID,
                contents: userPrompt,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.85,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                    responseMimeType: 'text/plain'
                }
            });

            // ── Extract and validate the response text ─────────
            const reportText = response.text;

            if (!reportText || typeof reportText !== 'string' || reportText.trim().length === 0) {
                throw new Error('Gemini returned an empty response');
            }

            // ── Basic quality check: ensure critical sections exist ──
            const lowerReport = reportText.toLowerCase();
            const criticalSections = ['introduction', 'personality', 'remedies', 'conclusion'];
            const missingSections = criticalSections.filter(
                section => !lowerReport.includes(section)
            );

            if (missingSections.length === criticalSections.length) {
                throw new Error(
                    'Generated report is missing all critical sections. The response may be malformed.'
                );
            }

            // ── Return the report ──────────────────────────────
            return reportText.trim();

        } catch (error) {
            lastError = error;

            // Classify the error for retry logic
            const isRetryable =
                error.message?.includes('429') ||           // Rate limit
                error.message?.includes('503') ||           // Service unavailable
                error.message?.includes('500') ||           // Internal server error
                error.message?.includes('overloaded') ||     // Model overloaded
                error.message?.includes('timeout') ||        // Timeout
                error.message?.includes('RESOURCE_EXHAUSTED'); // Quota

            if (!isRetryable || attempt === MAX_RETRIES) {
                break;
            }

            // Exponential backoff: 2s, 4s
            const backoffMs = Math.pow(2, attempt) * 1000;
            console.warn(
                `[astro-gemini.js] Attempt ${attempt}/${MAX_RETRIES} failed: "${error.message}". ` +
                `Retrying in ${backoffMs}ms...`
            );
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }

    // ── All retries exhausted, invoke SMART FALLBACK SYSTEM ───
    console.warn(
        `[astro-gemini.js] Gemini API failed after ${MAX_RETRIES} attempts. ` +
        `Last error: ${lastError?.message || 'Unknown error'}. Invoking offline fallback.`
    );
    
    return _generateOfflineReport(userData);
}

// ─── Export ───────────────────────────────────────────────────────
module.exports = {
    generateAstrologyReport
};
