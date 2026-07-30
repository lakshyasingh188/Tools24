/**
 * gemini.js — AI Astrology Report Generator
 *
 * Uses @google/genai to produce professional Vedic astrology reports
 * via the gemini-2.5-flash model. Reads GEMINI_API_KEY from .env.
 *
 * Exported: generateAstrologyReport(userData) → Promise<string>
 */

require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// ─── Validate API key at load time ───────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error(
        '[gemini.js] FATAL: GEMINI_API_KEY is missing from environment variables. ' +
        'Add it to your .env file before starting the server.'
    );
}

// ─── Initialize the Google GenAI client ──────────────────────────
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

// ─── Main exported function ──────────────────────────────────────
/**
 * Generate a professional Vedic astrology report using Gemini 2.5 Flash.
 *
 * @param {Object} userData - User birth details and preferences
 * @param {string} userData.name - Full name
 * @param {string} userData.gender - Gender
 * @param {string} userData.dob - Date of birth (YYYY-MM-DD)
 * @param {string} userData.birthTime - Time of birth (HH:MM)
 * @param {string} userData.birthPlace - Birth place
 * @param {string} userData.language - Preferred language
 * @param {string} userData.reportType - Type of report (career|love|marriage|business|finance|health|complete)
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

    const validReportTypes = ['career', 'love', 'marriage', 'business', 'finance', 'health', 'complete'];
    if (!validReportTypes.includes(userData.reportType)) {
        throw new Error(
            `generateAstrologyReport: Invalid reportType "${userData.reportType}". Must be one of: ${validReportTypes.join(', ')}`
        );
    }

    if (!GEMINI_API_KEY) {
        throw new Error(
            'generateAstrologyReport: GEMINI_API_KEY is not configured. Set it in your .env file.'
        );
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
                `[gemini.js] Attempt ${attempt}/${MAX_RETRIES} failed: "${error.message}". ` +
                `Retrying in ${backoffMs}ms...`
            );
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }

    // ── All retries exhausted ─────────────────────────────────
    const errorMessage = lastError?.message || 'Unknown error';

    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401')) {
        throw new Error(
            'generateAstrologyReport: GEMINI_API_KEY is invalid. Please check your .env file.'
        );
    }

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error(
            'generateAstrologyReport: Gemini API rate limit or quota exceeded. Please try again later.'
        );
    }

    if (errorMessage.includes('403')) {
        throw new Error(
            'generateAstrologyReport: Access denied. Check your Gemini API key permissions.'
        );
    }

    throw new Error(
        `generateAstrologyReport: Failed to generate report after ${MAX_RETRIES} attempts. ` +
        `Last error: ${errorMessage}`
    );
}

// ─── Export ───────────────────────────────────────────────────────
module.exports = { generateAstrologyReport };