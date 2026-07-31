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
    'Introduction',
    'Personality',
    'Career',
    'Love',
    'Marriage',
    'Finance',
    'Business',
    'Health Guidance',
    'Lucky Number',
    'Lucky Color',
    'Lucky Day',
    'Lucky Direction',
    'Lucky Gemstone',
    'Lucky Rudraksha',
    'Remedies',
    'Positive Conclusion'
];

// ─── Language map for natural prompt phrasing ────────────────────
const LANGUAGE_MAP = {
    English: 'English',
    Hindi: 'Hindi (written in Devanagari script)',
    Spanish: 'Spanish',
    French: 'French',
    Portuguese: 'Portuguese',
    German: 'German',
    Tamil: 'Tamil',
    Telugu: 'Telugu',
    Bengali: 'Bengali',
    Marathi: 'Marathi',
    Gujarati: 'Gujarati',
    Kannada: 'Kannada',
    Malayalam: 'Malayalam'
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
    const {
        name,
        gender,
        dob,
        birthTime,
        birthPlace,
        language,
        reportType
    } = userData;

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
    { text: 'Keep your **home entrance clean and well-lit** and place a swastika or a toran of mango leaves at the door. This invites positive energy, prosperity, and divine blessings into your living space.', day: 'Always' },
    { text: 'Offer **camphor (kapoor) aarti to Lord Shiva or your family deity** every evening. The purifying fragrance of camphor cleanses the environment of negative vibrations and creates a sacred atmosphere.', day: 'Daily evening' },
    { text: 'Chant **"Om Shrim Shriyei Namaha"** 108 times on Fridays to invoke the blessings of Goddess Lakshmi. This mantra attracts abundance, prosperity, and material well-being into your life.', day: 'Fridays' },
    { text: 'Immerse yourself in a **body of natural water** (river, sea, or lake) at least once a month, or take a ritual bath with water mixed with Ganga jal. This cleanses your aura of accumulated negative energies.', day: 'Monthly' },
    { text: 'Write **"Ram" 108 times** in a notebook dedicated to this practice. Reading these pages daily invokes the protective and harmonious energy of Lord Rama, bringing order and virtue to your life.', day: 'Daily' },
    { text: 'Offer **food to birds, especially crows and pigeons** on your terrace or balcony daily. In Vedic tradition, feeding birds is associated with pacifying ancestral energies (Pitru dosha) and bringing harmony.', day: 'Daily' }
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
    { text: 'अपने **घर के प्रवेश द्वार को स्वच्छ और अच्छी तरह प्रकाशित** रखें और दरवाजे पर स्वस्तिक या आम के पत्तों की तोरण लगाएं। यह सकारात्मक ऊर्जा, समृद्धि और दिव्य आशीर्वाद को आपके जीवन स्थान में आमंत्रित करता है।', day: 'सदैव' },
    { text: 'प्रतिदिन शाम को **भगवान शिव या अपने कुलदेवता को कपूर की आरती** करें। कपूर की शुद्ध करने वाली सुगंध परिवेश से नकारात्मक कंपन को साफ करती है और एक पवित्र वातावरण बनाती है।', day: 'प्रतिदिन शाम' },
    { text: 'शुक्रवार को माता लक्ष्मी के आशीर्वाद के लिए **"ॐ श्रीं श्रियै नमः"** का 108 बार जाप करें। यह मंत्र आपके जीवन में प्रचुरता, समृद्धि और भौतिक कल्याण को आकर्षित करता है।', day: 'शुक्रवार' },
    { text: 'महीने में कम से कम एक बार **प्राकृतिक जल शरीर** (नदी, समुद्र या झील) में डुबकी लगाएं, या गंगाजल मिले जल से अनुष्ठानिक स्नान करें। यह आपके आभामंडल से जमा नकारात्मक ऊर्जा को साफ करता है।', day: 'मासिक' },
    { text: 'इस अभ्यास के लिए समर्पित एक नोटबुक में **"राम" 108 बार लिखें**। इन पृष्ठों का प्रतिदिन पाठ करने से भगवान राम की सुरक्षात्मक और सामंजस्यपूर्ण ऊर्जा प्रकट होती है, जो आपके जीवन में व्यवस्था और धर्म लाती है।', day: 'प्रतिदिन' },
    { text: 'प्रतिदिन अपनी छत या बालकनी पर **पक्षियों को भोजन** दें, विशेष रूप से कौवों और कबूतरों को। वैदिक परंपरा में, पक्षियों को खिलाना पैतृक ऊर्जाओं (पितृ दोष) को शांत करने और सामंजस्य लाने से जुड़ा है।', day: 'प्रतिदिन' }
];

// ─── Personality trait pools (for variation) ─────────────────────
const PERSONALITY_TRAITS_EN = [
    'a natural leader with an infectious enthusiasm that draws people toward your vision',
    'a deeply intuitive soul with a rare ability to sense the unspoken emotions of those around you',
    'a person of remarkable discipline and patience, capable of sustained focus on long-term goals',
    'a creative spirit with an eye for beauty and harmony in every aspect of life',
    'an analytical thinker with a sharp intellect that cuts through complexity to find elegant solutions',
    'a compassionate heart whose empathy creates safe spaces for others to heal and grow',
    'a dynamic personality that balances ambition with a genuine care for collective well-being',
    'a free spirit with an adventurous soul, always seeking new horizons and deeper truths'
];

const PERSONALITY_TRAITS_HI = [
    'एक प्राकृतिक नेता, जिनका उत्साह लोगों को आपके दृष्टिकोण की ओर आकर्षित करता है',
    'एक गहरे अंतर्ज्ञानी आत्मा, जो अपने आसपास के लोगों की अनकही भावनाओं को महसूस करने की दुर्लभ क्षमता रखते हैं',
    'असाधारण अनुशासन और धैर्य वाले व्यक्ति, जो दीर्घकालिक लक्ष्यों पर लगातार ध्यान केंद्रित करने में सक्षम हैं',
    'एक रचनात्मक आत्मा, जिसकी जीवन के हर पहलू में सुंदरता और सामंजस्य की नजर है',
    'एक विश्लेषणात्मक विचारक, जिनकी तीक्ष्ण बुद्धि जटिलता को काटकर सुंदर समाधान खोज लेती है',
    'एक दयालु हृदय, जिनकी सहानुभूति दूसरों के लिए आराम और विकास का सुरक्षित स्थान बनाती है',
    'एक गतिशील व्यक्तित्व, जो महत्वाकांक्षा को सामूहिक कल्याण की जिम्मेदारी के साथ संतुलित करता है',
    'एक स्वतंत्र आत्मा, जो हमेशा नई क्षितिज और गहरे सत्य की तलाश में रहती है'
];

const STRENGTHS_EN = [
    'unwavering determination that turns obstacles into stepping stones',
    'emotional intelligence that navigates complex interpersonal dynamics with grace',
    'creative problem-solving that approaches challenges from unexpected angles',
    'natural charisma that inspires trust and loyalty in both personal and professional circles',
    'methodical precision that ensures every endeavor is executed to the highest standard',
    'resilient spirit that bounces back from setbacks stronger and wiser than before'
];

const STRENGTHS_HI = [
    'अटल दृढ़ता जो बाधाओं को सीढ़ियां बना देती है',
    'भावनात्मक बुद्धिमत्ता जो जटिल पारस्परिक गतिशीलता को सुग्राह्यता से नियंत्रित करती है',
    'रचनात्मक समस्या-समाधान जो चुनौतियों का अप्रत्याशित कोणों से सामना करता है',
    'प्राकृतिक करिश्मा जो व्यक्तिगत और व्यावसायिक दोनों मंडलों में विश्वास और निष्ठा पैदा करता है',
    'क्रमबद्ध सटीकता जो सुनिश्चित करती है कि हर प्रयास उच्चतम मानकों पर निष्पादित हो',
    'लचीली आत्मा जो निराशाओं से पहले से अधिक मजबूत और ज्ञानी होकर लौटती है'
];

// ─── Compute astrological profile from birth data ────────────────
function _computeAstroProfile(userData) {
    const seedStr = `${userData.name}|${userData.dob}|${userData.birthTime}|${userData.birthPlace}`;
    const seed = _hashString(seedStr);

    const rashiIdx = seed % 12;
    const nakshatraIdx = (seed >> 4) % 27;
    const ascendantIdx = (seed >> 8) % 12;

    return {
        rashiIdx,
        nakshatraIdx,
        ascendantIdx,
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
        if (g.includes('fem') || g === 'f') {
            return { title: 'श्रीमती', person: 'युवती', born: 'जन्मी', child: 'पुत्री' };
        }
        return { title: 'श्रीमान', person: 'युवक', born: 'जन्मे', child: 'पुत्र' };
    }
    if (g.includes('fem') || g === 'f') {
        return { pronoun: 'she', possessive: 'her', object: 'her', title: 'Ms.', person: 'woman', child: 'daughter', born: 'was born' };
    }
    return { pronoun: 'he', possessive: 'his', object: 'him', title: 'Mr.', person: 'man', child: 'son', born: 'was born' };
}

// ─── Report-type-specific title ──────────────────────────────────
function _getReportTitleEn(reportType) {
    const titles = {
        career: 'Career Astrology',
        love: 'Love & Romance Astrology',
        marriage: 'Marriage & Partnership Astrology',
        business: 'Business Astrology',
        finance: 'Finance & Wealth Astrology',
        health: 'Health & Wellness Astrology',
        complete: 'Complete Astrology'
    };
    return titles[reportType] || titles.complete;
}

function _getReportTitleHi(reportType) {
    const titles = {
        career: 'करियर ज्योतिष',
        love: 'प्रेम एवं रोमांस ज्योतिष',
        marriage: 'विवाह एवं साझेदारी ज्योतिष',
        business: 'व्यापार ज्योतिष',
        finance: 'धन एवं संपत्ति ज्योतिष',
        health: 'स्वास्थ्य एवं कल्याण ज्योतिष',
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

At the time of your birth, the Moon was gracing the sign of **${rashi}**, and the lunar mansion of **${nakshatra}** was active, infusing your consciousness with its distinct vibrational signature. Your ascendant (Lagna) rises in **${ascendant}**, which shapes the way the world perceives you and how you project yourself into your environment. These three foundational placements — your Sun sign, Moon sign, and Ascendant — form the sacred triad that defines the core of your astrological identity.

 ${name}, this ${_getReportTitleEn(reportType).toLowerCase()} report has been crafted to illuminate the planetary blueprint that was imprinted on your soul at the moment of your first breath. Every planet, every house, and every aspect in your chart carries a message — a divine whisper guiding you toward your highest potential. The ancient sages of Jyotish understood that the positions of the grahas (planets) at birth are not deterministic chains but rather a cosmic map, showing both the terrain of your karma and the pathways to transcend it.

As we journey through the various dimensions of your life together, remember this: the stars do not command — they counsel. Your free will is the most powerful force in your chart, and every recommendation in this report is designed to help you align your will with the cosmic currents that are naturally flowing in your favor. You are ${name}, a unique expression of the universe, and your chart reflects a story that has never been told before and will never be told again.`;
}

function _buildPersonalityEn(ud, ap, gt) {
    const rashi = RASHIS_EN[ap.rashiIdx];
    const nakshatra = NAKSHATRAS_EN[ap.nakshatraIdx];
    const ascendant = RASHIS_EN[ap.ascendantIdx];
    const { name } = ud;
    const trait = _pickSeeded(PERSONALITY_TRAITS_EN, ap.seed >> 2);
    const strength = _pickSeeded(STRENGTHS_EN, ap.seed >> 6);

    return `### Personality

 ${name}, at the very core of your being, you are ${trait}. The Moon's placement in ${rashi} at the time of your birth deeply colors your emotional landscape — it governs how you process feelings, how you nurture yourself and others, and what brings you a sense of inner security. People with this lunar placement often display a fascinating duality: a public persona that is composed and steady, paired with an inner world that is richly textured and emotionally nuanced.

Your ascendant in ${ascendant} is the lens through which you experience the world and through which the world experiences you. It shapes your physical presence, your first impressions, and your natural approach to new situations. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} carries an energy that is immediately noticeable — there is a certain quality about ${name} that people remember, a presence that lingers in a room even after ${gt.pronoun} has left it.

The nakshatra of ${nakshatra} active at your birth adds another layer of depth to your personality. Each of the 27 nakshatras carries a specific deity, a specific symbol, and a specific power (shakti) that it bestows upon those born under its influence. Your nakshatra infuses you with ${strength}, and this gift becomes increasingly apparent as you mature and grow into your authentic self.

One of your most striking qualities, ${name}, is your ${strength}. This is not a superficial trait but a deep-seated aspect of your character that has been forged through both the blessings and the challenges of your past experiences. You may not always recognize this strength in yourself — those closest to you see it clearly and rely upon it more than you know.

Your chart also suggests a rich inner life. You are someone who processes the world deeply, often replaying conversations and interactions in your mind, searching for layers of meaning that others might miss. This introspective quality is both your gift and your challenge — it gives you profound insight, but it can also lead to periods of overthinking. Learning to trust your first instinct, which is usually remarkably accurate given your strong lunar placement, will serve you well.

 ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} also possess a natural dignity that commands respect without demanding it. People sense that ${name} is someone of substance — not because of any external achievement, but because of an inner gravity that your ascendant sign bestows. Honor this quality, ${name}, for it will open doors that ambition alone cannot.`;
}

function _buildCareerEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'career';

    let extra = '';
    if (isFocus) {
        extra = `

In this specially focused career analysis, we go deeper into the professional dimensions of your chart. The tenth house (Karma Bhava) in your birth chart — the house of career, public standing, and professional achievement — is particularly significant for understanding your vocational dharma. The planetary influences on this house, along with the position of its lord, reveal not just what you will do, but what you are meant to do — the work that will bring both material success and soul-level fulfillment.

Your chart suggests that your professional peak period — the time when your career reaches its fullest expression — will likely occur during your mid-thirties to late forties. This is when the planetary periods (Dashas) align most favorably with your tenth house activations. However, the foundation you lay now is critical. Every skill you develop, every relationship you build, and every challenge you overcome in your current phase is preparation for that peak. ${name}, think of your career not as a sprint but as a carefully constructed cathedral — each stone matters, and the highest spires are built on the strongest foundations.`;
    }

    return `### Career

 ${name}, your professional path is illuminated by the powerful interplay of the Sun, Mercury, and the tenth house in your birth chart. The Sun represents your sense of purpose and authority — it shows where you are meant to shine, to lead, and to make your mark on the world. Mercury governs your intellect, communication, and analytical abilities — the tools through which you process information and express your ideas. Together, these planetary influences suggest a career trajectory that combines vision with execution, ambition with intelligence.

You are naturally suited for roles that require both strategic thinking and the ability to inspire others. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} thrive in environments where ${gt.pronoun} can take initiative, propose new ideas, and see them through to completion. Your chart favors industries connected to communication, technology, leadership, consulting, creative arts, and any field where innovation and human connection intersect.

The timing of your career milestones is guided by your planetary periods (Dashas). In the coming years, you will experience a phase where opportunities for advancement come more rapidly. This is a period to be bold — to put yourself forward for roles that stretch your abilities, to network strategically, and to invest in skills that will compound in value over time. ${name}, do not wait for the perfect moment; create it.${extra}`;
}

function _buildLoveEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'love';

    let extra = '';
    if (isFocus) {
        extra = `

In this love-focused reading, we examine your romantic blueprint with special depth. Venus (Shukra) — the planet of love, beauty, and desire — holds the key to understanding your romantic nature. The house and sign Venus occupies in your chart reveals what you find attractive, how you express affection, and what you need to feel truly loved. Additionally, the fifth house (Putra Bhava) governs romance, courtship, and the playful, creative aspects of love, while Mars (Mangal) reveals your passion and romantic drive.

 ${name}, your chart indicates that love, for you, is never superficial. You seek a connection that touches your soul — a partnership where both intellectual and emotional frequencies are aligned. You are drawn to people who have depth, who can match your intensity, and who are not afraid of the kind of honesty that true intimacy requires. When you find this kind of connection, you love with a loyalty and devotion that is rare and precious.`;
    }

    return `### Love

 ${name}, your romantic nature is one of the most beautiful and complex dimensions of your chart. Venus, the planet of love and relationships, along with the fifth house of romance, paints a portrait of someone who experiences love deeply, passionately, and with a level of emotional investment that few can match.

In matters of the heart, you are neither casual nor impulsive. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} approach love with a blend of idealism and caution — you dream of a soul-deep connection, yet you are careful about who you let into your inner world. This is not coldness; it is the natural self-protection of someone who knows the weight of emotional vulnerability. Once ${name} gives ${gt.possessive} heart, it is given completely, and this is precisely why ${gt.pronoun} is selective about who deserves that gift.

Your chart suggests that you are most compatible with partners who share your values and can engage with you on both intellectual and emotional levels. You need someone who respects your independence, celebrates your ambitions, and provides a safe harbor for your tenderer feelings. The planetary influences indicate that your most significant romantic connections will come through shared interests, intellectual pursuits, or introductions through mutual friends — serendipity plays a role, but it favors the prepared heart.${extra}`;
}

function _buildMarriageEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'marriage';

    let extra = '';
    if (isFocus) {
        extra = `

In this marriage-focused analysis, we turn our attention to the seventh house (Kalatra Bhava) — the house of marriage, partnerships, and long-term commitments — along with the influences of Venus (for romantic harmony) and Jupiter (for wisdom and growth in partnership). The strength and dignity of these placements, along with the position of the seventh house lord, reveal the nature, timing, and quality of your marital journey.

 ${name}, your chart indicates a marriage that will be a true partnership — not one of dependence but of mutual empowerment. The planetary influences suggest that your future spouse will be someone of strong character, someone who brings stability and growth into your life. The period most favorable for marriage falls within your mid-to-late twenties or early thirties, when the Dasha periods activate your seventh house. Trust this timing, for the cosmos knows when your heart is truly ready.`;
    }

    return `### Marriage

 ${name}, the seventh house of your birth chart — known as Kalatra Bhava, the house of marriage and partnership — is one of the most significant areas of your astrological blueprint. It reveals not only the nature of your future spouse but also the quality of the partnership you are destined to build, the lessons marriage will teach you, and the growth that comes from committing your life to another soul.

The planetary influences on your seventh house suggest that your marriage will be a union of both hearts and minds. You are not destined for a superficial partnership — your chart indicates a spouse who will be your equal, your confidant, and your growth partner. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} will be drawn to someone who possesses qualities of integrity, warmth, and a shared vision for the future. Look for a partner who respects your individuality while offering the emotional depth and stability you need.

The timing of marriage in your chart is influenced by the transit of Jupiter (the planet of expansion and blessings) over your seventh house and the activation of marriage-related Dashas. The most favorable window for marriage appears to be when Jupiter aspects your seventh house or its lord, which typically occurs in cycles of about 12 years. In the interim, ${name}, focus on becoming the person you wish to marry — cultivate the qualities you seek, heal the wounds you carry, and trust that the right partnership will arrive at the divinely appointed time.

For marital harmony, your chart advises open communication, mutual respect, and a willingness to grow together rather than apart. Marriage, for you, is not the end of individual growth but its acceleration — two souls supporting each other's evolution.${extra}`;
}

function _buildFinanceEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'finance';

    let extra = '';
    if (isFocus) {
        extra = `

In this finance-focused reading, we analyze the second house (Dhana Bhava — house of accumulated wealth), the eleventh house (Labha Bhava — house of income and gains), and the positions of Jupiter (the planet of abundance and expansion) and Saturn (the planet of discipline and long-term wealth accumulation). These four elements together form the financial backbone of your chart.

 ${name}, your financial chart reveals a pattern of steady accumulation rather than sudden windfall. Saturn's influence on your wealth houses means that your greatest financial growth comes through patience, discipline, and consistent effort over time. Jupiter's blessing, however, ensures that when you align your financial activities with ethical principles and generosity, the universe opens channels of abundance that logic alone could not have predicted. The key for you is to balance prudent saving with strategic risk-taking — your chart supports both, but in the right proportion and at the right time.`;
    }

    return `### Finance

 ${name}, your financial prospects are governed by the second house (Dhana Bhava — the house of accumulated wealth) and the eleventh house (Labha Bhava — the house of income and gains), along with the influences of Jupiter and Saturn. The interplay of these elements in your chart tells a story of a person who is capable of building substantial wealth, provided certain principles are honored.

Jupiter's influence in your chart suggests that your financial growth is tied to knowledge, wisdom, and ethical conduct. You are not someone who will find lasting prosperity through shortcuts or questionable means — your wealth comes through applying your intelligence, building expertise, and serving others with integrity. The more you align your financial activities with your deeper values, the more the universe supports your material growth.

Saturn, the planet of discipline and time, plays a significant role in your financial journey. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} may experience periods of financial consolidation followed by breakthroughs — this is the natural rhythm of Saturn, which rewards patience and sustained effort. Investments made with careful research and a long-term horizon will serve you far better than speculative ventures. Your chart favors investments in real estate, education, gold, and ventures connected to knowledge or service.

The most favorable financial periods in your chart come when Jupiter transits your second or eleventh house, which creates windows of expanded opportunity. During these times, ${name}, be ready to act — the seeds you plant during Jupiter's favorable transits will yield harvests for years to come.${extra}`;
}

function _buildBusinessEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'business';

    let extra = '';
    if (isFocus) {
        extra = `

In this business-focused analysis, we examine the third house (Parakrama Bhava — house of courage and initiative), the seventh house (business partnerships), the tenth house (professional authority), and the eleventh house (business gains). The condition of Mercury (commerce and trade) and Mars (entrepreneurial drive) in your chart provides additional insight into your business potential.

 ${name}, your chart reveals strong entrepreneurial indicators. The planetary combinations suggest that you have the vision to identify opportunities, the courage to take calculated risks, and the persistence to see ventures through their inevitable ups and downs. Your most favorable period for launching a new business comes when Mercury and Jupiter are both well-aspected — typically during your late twenties to mid-forties. In business partnerships, seek associates whose strengths complement your weaknesses rather than mirror your strengths. Diversity of skill creates resilience.`;
    }

    return `### Business

 ${name}, your entrepreneurial potential is revealed through the analysis of the third house (initiative and courage), the seventh house (partnerships), the tenth house (authority), and the eleventh house (gains), along with the influences of Mercury and Mars. These elements together paint a picture of someone who has the natural aptitude for business, provided the right approach and timing are observed.

Mercury's placement in your chart suggests strong commercial intelligence — you have an instinct for identifying value, negotiating effectively, and communicating persuasively. Mars provides the drive, courage, and competitive edge that entrepreneurship demands. Together, these influences indicate that ${name} has the potential to build and lead successful ventures, particularly in fields connected to communication, technology, consulting, trading, or any industry where intellectual capital is the primary asset.

If you are considering starting a business, your chart advises careful planning during the conceptual phase, followed by decisive action once the plan is solid. The planetary periods most favorable for business launches are those ruled by Mercury, Jupiter, or well-placed Mars. During these periods, the cosmic winds are at your back, and obstacles that might seem insurmountable at other times become manageable challenges.

For business partnerships, your chart suggests seeking collaborators who complement rather than replicate your skills. ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} brings vision and strategy; a good partner brings operational excellence or domain expertise. Avoid partnerships born purely of convenience or financial necessity — seek alignment of values first, and the rest will follow.${extra}`;
}

function _buildHealthEn(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'health';

    let extra = '';
    if (isFocus) {
        extra = `

In this health-focused reading, we examine the sixth house (Ari Bhava — house of health and disease), the eighth house (Ayush Bhava — house of longevity), and the ascendant (which represents the physical body and its constitutional strength). The influences on these houses, along with the condition of the Sun (vitality), the Moon (mental and emotional well-being), and Saturn (chronic conditions), provide a comprehensive view of your health profile from an astrological perspective.

 ${name}, your chart suggests that your greatest health asset is your body's natural resilience. The ascendant and its lord indicate a constitution that, when properly cared for, can recover from illness and adapt to changing conditions with remarkable efficiency. The key is to work with your body's natural rhythms rather than against them — adequate rest, regular meal times, consistent sleep schedules, and stress management are not optional luxuries for you but essential foundations for sustained well-being.`;
    }

    return `### Health Guidance

 ${name}, according to Vedic astrological tradition, the sixth house (Ari Bhava) of your birth chart, along with the influences of the Sun, Moon, and Saturn, provides insight into your physical vitality, areas of constitutional sensitivity, and traditional wellness guidance. From the perspective of Jyotish, health is seen as a balance of the three doshas (Vata, Pitta, Kapha), the seven dhatus (bodily tissues), and the smooth flow of prana (life force) through the body's energetic channels.

The Sun's placement in your chart governs your overall vitality and life force. A well-placed Sun, as indicated in your chart, suggests strong natural immunity and a capacity for recovery. However, the Sun also rules specific body systems — particularly the heart, spine, and eyes. Traditional Vedic guidance recommends that ${name} pay attention to these areas through regular check-ups, protective practices like Surya Namaskar (Sun Salutations), and exposure to morning sunlight for optimal vitamin D synthesis.

The Moon's influence on your chart is connected to your emotional and mental well-being, as well as fluids in the body, the digestive system, and the mind. From the perspective of Jyotish, emotional balance is considered foundational to physical health. Practices that calm the mind — meditation, moonlight walks, and consuming cooling foods during emotionally intense periods — are traditionally recommended.

Saturn's influence suggests areas where you may need to exercise particular care over the long term. Saturn governs the bones, joints, teeth, and nervous system. Traditional Vedic wellness guidance recommends that ${name} maintain bone health through adequate calcium intake, joint mobility through regular gentle exercise like yoga, and nervous system health through stress management and adequate rest.

**Important:** This guidance is based on traditional Vedic astrological principles and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for health-related decisions.${extra}`;
}

function _buildLuckySectionsEn(ud, ap) {
    const { name } = ud;
    const luckyNumber = _pickRandom(LUCKY_NUMBERS);
    const luckyColor = _pickRandom(LUCKY_COLORS_EN);
    const luckyDay = _pickRandom(LUCKY_DAYS_EN);
    const luckyDirection = _pickRandom(LUCKY_DIRECTIONS_EN);
    const gemstone = _pickRandom(GEMSTONES_EN);
    const rudraksha = _pickRandom(RUDRAKSHAS_EN);

    return `### Lucky Number

**${luckyNumber}**

 ${name}, the number ${luckyNumber} resonates most powerfully with your birth chart's vibrational frequency. In Vedic numerology (Ank Jyotish), each number carries a specific planetary correspondence, and ${luckyNumber} aligns harmoniously with the dominant planetary energies in your chart. Incorporating this number into your daily life — choosing dates, addresses, phone numbers, or important decisions involving this number — amplifies your natural alignment with cosmic favor. When faced with choices, ${name}, let ${luckyNumber} be your guiding digit.

### Lucky Color

**${luckyColor}**

The color ${luckyColor} carries the specific wavelength of light that complements the planetary influences dominant in your birth chart. In Vedic tradition, colors are not merely aesthetic choices but energetic tools — each color corresponds to a specific graha (planet) and can be used to strengthen or pacify that planet's influence. ${name}, wearing ${luckyColor} clothing, especially on important occasions or during challenging planetary transits, surrounding yourself with this color in your living space, or visualizing it during meditation will enhance your vibrational alignment with your chart's natural strengths.

### Lucky Day

**${luckyDay}**

 ${luckyDay} is the day of the week that carries the most favorable planetary vibrations for ${name}. Each day is ruled by a specific celestial body — Sunday by the Sun, Monday by the Moon, Tuesday by Mars, Wednesday by Mercury, Thursday by Jupiter, Friday by Venus, and Saturday by Saturn. Your chart indicates that the planetary ruler of ${luckyDay} is particularly well-disposed toward your birth chart, making this the ideal day for initiating important endeavors, signing agreements, beginning new ventures, or making significant decisions. Schedule your most important activities on this day whenever possible.

### Lucky Direction

**${luckyDirection}**

The ${luckyDirection} direction is the most auspicious for ${name} according to the principles of Vastu Shastra and Vedic astrology. Each direction is governed by a specific planetary and elemental force, and the ${luckyDirection} resonates most harmoniously with your chart's energy signature. When possible, face ${luckyDirection} while working, studying, meditating, or making important decisions. Positioning your bed, desk, or prayer space to align with this direction enhances the flow of positive energy in your life. ${name}, this directional alignment serves as a subtle but powerful amplifier of your chart's beneficial influences.

### Lucky Gemstone

**${gemstone.name}**

**Planetary Ruler:** ${gemstone.planet}
**Recommended Metal:** ${gemstone.metal}
**Ideal Weight:** ${gemstone.weight}

 ${name}, the ${gemstone.name} is the gemstone most aligned with your birth chart's planetary configuration. It is associated with ${gemstone.planet}, whose energy is significant in your astrological blueprint. When worn in ${gemstone.metal.toLowerCase()}, set in a ring or pendant that touches the skin, this gemstone is traditionally believed to strengthen the positive manifestations of ${gemstone.planet}'s energy in your life — including the areas of experience governed by the houses ${gemstone.planet} influences in your chart. The recommended weight of ${gemstone.weight} ensures sufficient energetic potency. ${name}, it is advisable to have any gemstone energized through proper Vedic rituals (prana pratishtha) before wearing it, and to wear it first on the day and time recommended by a qualified astrologer.

### Lucky Rudraksha

**${rudraksha.mukhi} Rudraksha**

**Presiding Deity:** ${rudraksha.deity}
**Primary Benefit:** ${rudraksha.benefit}

 ${name}, the ${rudraksha.mukhi} Rudraksha is the most spiritually beneficial for your chart. This sacred bead, born from the tears of Lord Shiva, carries the specific blessing of ${rudraksha.deity}. Wearing this Rudraksha against the skin — ideally as a pendant or in a mala — is traditionally believed to bestow ${rudraksha.benefit}. The ${rudraksha.mukhi} Rudraksha is particularly suited to your chart because it addresses the planetary patterns that are most active in your spiritual journey. ${name}, when selecting a Rudraksha, ensure it is authentic, naturally formed, and properly energized through mantra and ritual before wearing. Wear it with faith and reverence, and its subtle vibrations will support your spiritual and material well-being.`;
}

function _buildRemediesEn(ud, ap) {
    const { name } = ud;
    const selectedRemedies = _pickRandomN(REMEDIES_POOL_EN, 7);

    let remediesText = `### Remedies

 ${name}, the following Vedic remedies have been selected based on the planetary configurations in your birth chart. These remedies (Upayas) are not superstitions but time-tested spiritual technologies designed to harmonize planetary energies, dissolve karmic obstacles, and amplify the positive influences in your chart. Approach them with faith, consistency, and reverence — their power unfolds through regular practice over time.

`;

    selectedRemedies.forEach((remedy, i) => {
        remediesText += `**${i + 1}.** ${remedy.text}\n\n`;
        remediesText += `   *Recommended timing: ${remedy.day}*\n\n`;
    });

    remediesText += `**Additional Guidance for ${name}:**\n\n`;
    remediesText += `Beyond these specific remedies, cultivate an attitude of gratitude each morning upon waking. Before your feet touch the ground, take a moment to thank the divine for the gift of another day. This simple practice, ${name}, aligns your consciousness with the frequency of abundance and opens your heart to receive the blessings that the cosmos is constantly offering. Remember that the most powerful remedy of all is a pure heart, a kind word, and a selfless act — these transcend all planetary configurations and invite divine grace into every dimension of your life.`;

    return remediesText;
}

function _buildConclusionEn(ud, ap, gt) {
    const { name } = ud;
    const rashi = RASHIS_EN[ap.rashiIdx];

    return `### Positive Conclusion

 ${name}, as we come to the close of this celestial reading, I want you to pause for a moment and feel the truth of what has been shared. You are not a random collection of circumstances — you are a carefully designed expression of cosmic intelligence, born at the precise moment when the planets aligned to support your unique soul mission. Your Moon in ${rashi}, your carefully chosen nakshatra, your rising sign — all of these are brushstrokes in the masterpiece that is your life.

The challenges you have faced, ${name}, are not punishments — they are initiations. Every obstacle has been a teacher, every heartbreak a lesson in love, every setback a redirection toward your true path. The planetary periods you have weathered have forged in you a strength that cannot be taken away. You are wiser, deeper, and more capable than you give yourself credit for, and the chapters of your life that are yet to be written hold blessings that will exceed your wildest hopes.

 ${gt.pronoun.charAt(0).toUpperCase() + gt.pronoun.slice(1)} carry within ${gt.object} a divine spark that is ${gt.possessive} alone — a unique frequency of consciousness that the universe has never produced before and will never produce again. Honor this uniqueness, ${name}. Do not dim your light to make others comfortable. Do not shrink your dreams to fit someone else's expectations. Your chart supports greatness — not necessarily the kind that makes headlines, but the kind that makes a life of meaning, impact, and deep soulful satisfaction.

As you move forward, carry these cosmic insights as a lantern in the dark. When you feel lost, remember that your chart has already mapped the terrain. When you feel weak, remember that the same planets that challenge you also empower you. When you feel alone, remember that the entire cosmos is conspiring in your favor — you need only align yourself with its current.

 ${name}, may the blessings of all the grahas be upon you. May your path be illuminated, your heart be fulfilled, and your journey through this lifetime be everything your soul came here to experience. The stars have spoken — now it is your turn to shine.

**🙏 Om Shanti Shanti Shanti 🙏**

*May universal peace, harmony, and divine light guide ${name} on every step of the cosmic journey.*`;
}


// ═════════════════════════════════════════════════════════════════
// ║   OFFLINE REPORT SECTION BUILDERS — HINDI                       ║
// ═════════════════════════════════════════════════════════════════

function _buildIntroductionHi(ud, ap, gt) {
    const rashi = RASHIS_HI[ap.rashiIdx];
    const nakshatra = NAKSHATRAS_HI[ap.nakshatraIdx];
    const ascendant = RASHIS_HI[ap.ascendantIdx];
    const { name, dob, birthTime, birthPlace, reportType } = ud;

    return `### प्रस्तावना

प्रिय ${name}, आपके दिव्य ज्योतिषीय पाठ में आपका स्वागत है। ${dob} के पावन दिन पर, ${birthTime} के सटीक क्षण पर, ${birthPlace} के आध्यात्मिक रूप से ऊर्जावान वातावरण में, आपकी आत्मा ने इस पार्थिव लोक में अवतरण करने का चयन किया। यह कोई आकस्मिक घटना नहीं थी — ब्रह्मांड ने जीवनों तक इस क्षण को संचालित किया था, ग्रहीय स्थितियों को सूक्ष्म परिशुद्धता के साथ संरेखित करके आपकी आत्मा की अद्वितीय यात्रा का समर्थन किया।

आपके जन्म के समय, चंद्रमा **${rashi}** राशि में विराजमान था, और **${nakshatra}** नक्षत्र सक्रिय था, जो आपकी चेतना को अपनी विशिष्ट कंपनात्मक सिग्नेचर से आशीर्वादित कर रहा था। आपका लग्न (आरोह) **${ascendant}** में उदित हो रहा है, जो निर्धारित करता है कि दुनिया आपको कैसे देखती है और आप अपने परिवेश में स्वयं को कैसे प्रकट करते हैं। ये तीन आधारभूत स्थान — आपका सूर्य राशि, चंद्र राशि और लग्न — वह पवित्र त्रय बनाते हैं जो आपकी ज्योतिषीय पहचान के मूल को परिभाषित करता है।

 ${name}, यह ${_getReportTitleHi(reportType)} रिपोर्ट आपके जन्म के क्षण पर आपकी आत्मा पर अंकित की गई ग्रहीय खाके को प्रकाशित करने के लिए तैयार की गई है। आपकी कुंडली में प्रत्येक ग्रह, प्रत्येक भाव और प्रत्येक दृष्टि एक संदेश लेकर आती है — एक दिव्य फुसफुसाहट जो आपको आपकी उच्चतम क्षमता की ओर मार्गदर्शन करती है। ज्योतिष के प्राचीन ऋषियों ने समझा था कि जन्म के समय ग्रहों की स्थितियां निर्धारक जंजीरें नहीं हैं बल्कि एक ब्रह्मांडीय मानचित्र हैं, जो आपके कर्म के भूभाग और उससे परे जाने के मार्ग दोनों को दर्शाता है।

जैसे ही हम आपके जीवन के विभिन्न आयामों की यात्रा करते हैं, यह स्मरण रखें: तारे आदेश नहीं देते — वे परामर्श देते हैं। आपकी स्वतंत्र इच्छा आपकी कुंडली की सबसे शक्तिशाली शक्ति है, और इस रिपोर्ट में प्रत्येक अनुशंसा को आपकी इच्छा को उन ब्रह्मांडीय धाराओं के साथ संरेखित करने में सहायता के लिए डिज़ाइन किया गया है जो स्वाभाविक रूप से आपके पक्ष में बह रही हैं। आप ${name} हैं, ब्रह्मांड की एक अद्वितीय अभिव्यक्ति, और आपकी कुंडली एक ऐसी कहानी दर्शाती है जो पहले कभी नहीं सुनाई गई और दोबारा कभी नहीं सुनाई जाएगी।`;
}

function _buildPersonalityHi(ud, ap, gt) {
    const rashi = RASHIS_HI[ap.rashiIdx];
    const nakshatra = NAKSHATRAS_HI[ap.nakshatraIdx];
    const ascendant = RASHIS_HI[ap.ascendantIdx];
    const { name } = ud;
    const trait = _pickSeeded(PERSONALITY_TRAITS_HI, ap.seed >> 2);
    const strength = _pickSeeded(STRENGTHS_HI, ap.seed >> 6);

    return `### व्यक्तित्व

 ${name}, अपने वर्तमान स्वरूप में आप मूल रूप से ${trait} हैं। आपके जन्म के समय चंद्रमा की ${rashi} राशि में स्थिति आपके भावनात्मक परिदृश्य को गहराई से रंगती है — यह निर्धारित करती है कि आप भावनाओं को कैसे संसाधित करते हैं, स्वयं और दूसरों का पोषण कैसे करते हैं, और क्या आपको आंतरिक सुरक्षा की भावना देता है। इस चंद्र स्थान वाले लोग अक्सर एक आकर्षक द्वैत प्रदर्शित करते हैं: एक सार्वजनिक व्यक्तित्व जो संयमित और स्थिर है, के साथ एक आंतरिक दुनिया जो समृद्ध रूप से बनावटी और भावनात्मक रूप से सूक्ष्म है।

आपका ${ascendant} में लग्न वह लेंस है जिसके माध्यम से आप दुनिया का अनुभव करते हैं और जिसके माध्यम से दुनिया आपका अनुभव करती है। यह आपकी शारीरिक उपस्थिति, आपके पहले छाप और नई स्थितियों के प्रति आपके स्वाभाविक दृष्टिकोण को आकार देता है। आपके व्यक्तित्व में एक ऐसी ऊर्जा है जो तुरंत ध्यान खींचती है — ${name} में एक ऐसी गुणवत्ता है जो लोग याद रखते हैं, एक उपस्थिति जो कमरे में आपके जाने के बाद भी बनी रहती है।

आपके जन्म के समय सक्रिय ${nakshatra} नक्षत्र आपके व्यक्तित्व में गहराई का एक और स्तर जोड़ता है। 27 नक्षत्रों में से प्रत्येक एक विशिष्ट देवता, एक विशिष्ट प्रतीक और एक विशिष्ट शक्ति को वहन करता है जो वह अपने प्रभाव में जन्म लेने वालों को प्रदान करता है। आपका नक्षत्र आपको ${strength} के साथ आशीर्वादित करता है, और यह उपहार तब अधिक स्पष्ट होता है जब आप अपनी प्रामाणिकता में परिपक्व होते और विकसित होते हैं।

आपकी सबसे आकर्षक विशेषताओं में से एक, ${name}, आपकी ${strength} है। यह कोई उथला लक्षण नहीं है बल्कि आपके चरित्र का एक गहरा पहलू है जो आपके पूर्व अनुभवों के आशीर्वादों और चुनौतियों दोनों के माध्यम से तिखरा गया है। आप इस शक्ति को हमेशा स्वयं में पहचान नहीं पाते — आपके सबसे करीबी लोग इसे स्पष्ट रूप से देखते हैं और इस पर आपकी जितनी जानकारी है उससे कहीं अधिक निर्भर करते हैं।

आपकी कुंडली एक समृद्ध आंतरिक जीवन का भी संकेत देती है। आप ऐसे व्यक्ति हैं जो दुनिया को गहराई से संसाधित करते हैं, अक्सर बातचीत और अंतःक्रियाओं को अपने मन में पुनः चलाते हैं, अर्थों की परतों की खोज करते हैं जिन्हें अन्य लोग छोड़ सकते हैं। यह आत्मनिरीक्षण गुणवत्ता आपका वरदान और चुनौती दोनों है — यह आपको गहरी अंतर्दृष्टि देती है, लेकिन यह अति-विचार की अवधि में भी ले जा सकती है। अपने पहले अंतर्ज्ञान पर भरोसा करना सीखना, जो आपके मजबूत चंद्र स्थान के कारण आमतौर पर उल्लेखनीय रूप से सटीक होता है, आपके लिए लाभदायक होगा।

आपके लग्न द्वारा प्रदान की गई एक प्राकृतिक गरिमा भी है जो बिना मांगे सम्मान आदेश करती है। लोग महसूस करते हैं कि ${name} सार का व्यक्ति है — किसी बाहरी उपलब्धि के कारण नहीं, बल्कि आपका लग्न चिन्ह जो आंतरिक गुरुत्वाकर्षण प्रदान करता है। इस गुणवत्ता का सम्मान करें, ${name}, क्योंकि यह ऐसे दरवाजे खोलेगी जिन्हें केवल महत्वाकांक्षा नहीं खोल सकती।`;
}

function _buildCareerHi(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'career';

    let extra = '';
    if (isFocus) {
        extra = `

इस विशेष रूप से करियर-केंद्रित विश्लेषण में, हम आपकी कुंडली के व्यावसायिक आयामों में गहराई से जाते हैं। आपकी जन्म कुंडली में दसवां भाव (कर्म भाव) — करियर, सार्वजनिक स्थिति और व्यावसायिक उपलब्धि का भाव — आपके व्यावसायिक धर्म को समझने के लिए विशेष रूप से महत्वपूर्ण है। इस भाव पर ग्रहीय प्रभाव, इसके स्वामी की स्थिति के साथ, केवल यह नहीं बताते कि आप क्या करेंगे, बल्कि यह भी कि आपको क्या करना चाहिए — वह कार्य जो भौतिक सफलता और आत्मा-स्तर की पूर्णता दोनों लाएगा।

आपकी कुंडली संकेत देती है कि आपकी व्यावसायिक शिखर अवधि — जब आपका करियर अपनी पूर्णतम अभिव्यक्ति तक पहुंचता है — संभवतः आपकी मध्य-तीसवीं से उत्तर-चालीसवीं दशक तक होगी। यह तब है जब ग्रहीय दशाएं आपके दसवें भाव के सक्रियीकरण के साथ सबसे अनुकूल रूप से संरेखित होती हैं। हालांकि, आप जो आधार अभी रख रहे हैं वह महत्वपूर्ण है। आप जो भी कौशल विकसित करते हैं, जो भी रिश्ते बनाते हैं, और अपने वर्तमान चरण में जो भी चुनौती पार करते हैं, वह उस शिखर की तैयारी है। ${name}, अपने करियर को दौड़ नहीं बल्कि एक सावधानी से निर्मित मंदिर के रूप में सोचें — हर पत्थर मायने रखता है, और उच्चतम शिखर सबसे मजबूत नींव पर बनते हैं।`;
    }

    return `### करियर

 ${name}, आपके व्यावसायिक मार्ग को आपकी जन्म कुंडली में सूर्य, बुध और दसवें भाव के शक्तिशाली अंतर्क्रिया द्वारा प्रकाशित किया गया है। सूर्य आपके उद्देश्य और अधिकार की भावना का प्रतिनिधित्व करता है — यह दर्शाता है कि आप कहाँ चमकने, नेतृत्व करने और दुनिया में अपनी छाप छोड़ने के लिए नियत हैं। बुध आपकी बुद्धि, संचार और विश्लेषणात्मक क्षमताओं को नियंत्रित करता है — वे उपकरण जिनके माध्यम से आप जानकारी संसाधित करते हैं और अपने विचार व्यक्त करते हैं। साथ में, ये ग्रहीय प्रभाव एक ऐसे करियर प्रक्षेपक का संकेत देते हैं जो दृष्टि को निष्पादन, महत्वाकांक्षा को बुद्धिमत्ता के साथ जोड़ता है।

आप स्वाभाविक रूप से ऐसी भूमिकाओं के लिए उपयुक्त हैं जिनमें रणनीतिक चिंतन और दूसरों को प्रेरित करने की क्षमता दोनों आवश्यक हैं। आप उन वातावरणों में फलते-फूलते हैं जहाँ आप पहल पा सकते हैं, नए विचार प्रस्तुत कर सकते हैं और उन्हें पूर्णता तक ले जा सकते हैं। आपकी कुंडली संचार, प्रौद्योगिकी, नेतृत्व, परामर्श, रचनात्मक कला और उन क्षेत्रों से जुड़े उद्योगों के अनुकूल है जहाँ नवाचार और मानव संबंध एक साथ मिलते हैं।

आपके करियर की मील के पत्थरों का समय आपके ग्रहीय दशाओं द्वारा निर्देशित होता है। आने वाले वर्षों में, आप एक ऐसे चरण का अनुभव करेंगे जहाँ उन्नति के अवसर अधिक तेजी से आएंगे। यह एक साहसी बनने का समय है — ऐसी भूमिकाओं के लिए स्वयं को आगे रखें जो आपकी क्षमताओं को विस्तारित करें, रणनीतिक रूप से नेटवर्क बनाएं और ऐसे कौशलों में निवेश करें जो समय के साथ मूल्य में वृद्धि करेंगे। ${name}, सही क्षण की प्रतीक्षा न करें; इसे स्वयं बनाएं।${extra}`;
}

function _buildLoveHi(ud, ap, gt) {
    const { name, reportType } = ud;
    const isFocus = reportType === 'love';

    let extra = '';
    if (isFocus) {
        extra = `

इस प्रेम-केंद्रित पाठ में, हम विशेष गहराई के साथ आपके रोमांटिक खाके की जांच करते हैं। शुक्र (Venus) — प्रेम, सुंदरता और इच्छा का ग्रह — आपके रोमांटिक स्वभाव को समझने की कुंजी है। आपकी कुंडली में शुक्र जिस भाव और राशि में है वह दर्शाता है कि आपको क्या आकर्षक लगता है, आप स्नेह कैसे व्यक्त करते हैं और आपको वास्तव में प्रेम महसूस करने के लिए क्या चाहिए। इसके अतिरिक्त, पांचवां भाव (पुत्र भाव) रोमांस, प्रेम-प्रस्ताव और प्रेम के चंचल, रचनात्मक पहलुओं को नियंत्रित करता है, जबकि मंगल (Mars) आपके जुनून और रोमांटिक ड्राइव को दर्शाता है।

 ${name}, आपकी कुंडली संकेत करती है कि आपके लिए प्रेम कभी उथला नहीं है। आप एक ऐसे संबंध की तलाश करते हैं जो आपकी आत्मा को छूए — एक ऐसी साझेदारी जहाँ बौद्धिक और भावनात्मक दोनों आवृत्तियाँ संरेखित हों। आप उन लोगों की ओर आकर्षित होते हैं जिनमें गहराई है, जो आपकी तीव्रता का मिलान कर सकते हैं और जो उस ईमानदारी से नहीं डरते जो वास्तविक अंतरंगता की मांग करती है। जब आपको इस प्रकार का संबंध मिलता है, तो आप एक ऐसी वफादारी और समर्पण के साथ प्रेम करते हैं जो दुर्लभ और कीमती है।`;
    }

    return `### प्रेम

 ${name}, आपका रोमांटिक स्वभाव आपकी कुंडली के सबसे सुंदर और गहरे पहलुओं में से एक है।`;
