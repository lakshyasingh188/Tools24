/**
 * reportPrompt.js — Premium Astrology Report Prompt Builder
 *
 * Exports createPrompt(userData) which returns a detailed,
 * production-ready Gemini prompt string for generating a
 * professional Vedic astrology report in Markdown.
 *
 * No external dependencies. No side effects. Pure function.
 */

'use strict';

// ─── Language registry ───────────────────────────────────────────
const LANGUAGES = {
    English: {
        code: 'en',
        nativeName: 'English',
        writeIn: 'Write the ENTIRE report in English.',
        sectionHeadings: 'Use English for all section headings.',
        toneNote: 'Use a refined, literary English style with natural Sanskrit/Jyotish terminology where appropriate.'
    },
    Hindi: {
        code: 'hi',
        nativeName: 'Hindi',
        writeIn: 'Write the ENTIRE report in Hindi using Devanagari script (हिंदी लिपि). Do NOT use Hinglish or Romanized Hindi.',
        sectionHeadings: 'Use Hindi in Devanagari script for all section headings.',
        toneNote: 'Use a respectful, literary Hindi style (शुद्ध हिंदी) with natural Sanskrit/Jyotish terminology. Avoid English loanwords where a Hindi equivalent exists.'
    }
};

// ─── Report type registry ────────────────────────────────────────
const REPORT_TYPES = {
    career: {
        label: 'Career and Professional Life',
        depthDirective: 'The Career section must be the most detailed and expansive section of this report — at least 500 words on its own. Cover every angle: ideal industries, leadership style, timing of promotions, periods of challenge, and strategic career moves.',
        emphasis: 'career'
    },
    love: {
        label: 'Love and Romantic Relationships',
        depthDirective: 'The Love section must be the most detailed and expansive section of this report — at least 500 words on its own. Cover emotional needs, romantic patterns, compatibility archetypes, timing of significant encounters, and guidance for deepening intimacy.',
        emphasis: 'love'
    },
    marriage: {
        label: 'Marriage and Long-term Partnership',
        depthDirective: 'The Marriage section must be the most detailed and expansive section of this report — at least 500 words on its own. Cover marital timing, spouse qualities, compatibility factors, periods of harmony and challenge, and Vedic perspectives on the 7th house.',
        emphasis: 'marriage'
    },
    business: {
        label: 'Business and Entrepreneurship',
        depthDirective: 'The Business section must be the most detailed and expansive section of this report — at least 500 words on its own. Cover entrepreneurial aptitude, partnership dynamics, ideal sectors, launch timing, risk periods, and strategic growth windows.',
        emphasis: 'business'
    },
    finance: {
        label: 'Financial Prospects and Wealth',
        depthDirective: 'The Finance section must be the most detailed and expansive section of this report — at least 500 words on its own. Cover wealth cycles, income patterns, investment timing, property prospects, periods of accumulation and caution, and the 2nd/11th house analysis.',
        emphasis: 'finance'
    },
    health: {
        label: 'Health Guidance and Wellness',
        depthDirective: 'The Health Guidance section must be the most detailed and expansive section of this report — at least 500 words on its own. Cover vital periods, vulnerable areas, seasonal sensitivities, and traditional Ayurvedic-astrological wellness recommendations. Always frame as traditional astrological guidance — never as medical advice.',
        emphasis: 'health'
    },
    complete: {
        label: 'Complete Comprehensive Vedic Astrology Analysis',
        depthDirective: 'All sections must be equally detailed and expansive. This is the most comprehensive report — every section should be at least 300 words, with the total report being 4000–5000 words. No section should feel abbreviated.',
        emphasis: 'all'
    }
};

// ─── Report section definitions ──────────────────────────────────
const SECTIONS = [
    {
        id: 'introduction',
        heading: { en: 'Introduction', hi: 'परिचय' },
        wordTarget: '250–350',
        instructions: {
            en: `Open with a warm, personalized greeting addressing ${'{name}'} directly by name. Acknowledge the sacredness of their birth moment — the exact date, time, and place — as the cosmic fingerprint that makes their chart unique. Provide a high-level overview of the dominant themes in their chart: the Ascendant (Lagna), Moon sign (Rashi), and Sun sign, and how these three pillars shape their life journey. Set a tone of reverence, insight, and empowerment. End the introduction with a brief preview of what the report will cover, so the reader knows what to expect. Reference ${'{name}'} by name at least twice.`,
            hi: `${'{name}'} को नाम से संबोधित करते हुए एक गर्मजोशी भरा, व्यक्तिगत अभिवादन से शुरुआत करें। उनके जन्म के पवित्र क्षण — सटीक तिथि, समय और स्थान — को उनकी विशिष्ट कॉस्मिक पहचान के रूप में स्वीकार करें। उनकी कुंडली के प्रमुख विषयों का अवलोकन दें: लग्न, चंद्र राशि और सूर्य राशि, और ये तीन स्तंभ उनके जीवन को कैसे आकार देते हैं। श्रद्धा, अंतर्दृष्टि और सशक्तिकरण की भावना स्थापित करें। ${'{name}'} का नाम कम से कम दो बार लें।`
        }
    },
    {
        id: 'personality',
        heading: { en: 'Personality', hi: 'व्यक्तित्व' },
        wordTarget: '300–400',
        instructions: {
            en: `Provide a deep, nuanced analysis of ${'{name}'}'s core personality based on their Moon sign (inner emotional world), Ascendant (outer personality and how others perceive them), and Sun sign (core identity and life force). Describe their temperament, emotional nature, mental patterns, natural strengths, and inner drives. Go beyond surface-level descriptions — explore the interplay between their signs. If their Moon and Sun are in conflicting elements, describe the internal tension and how it manifests. If they are in harmony, describe the coherence. Include specific behavioral tendencies, communication style, and how they respond under pressure. Reference ${'{name}'} by name.`,
            hi: `${'{name}'} की चंद्र राशि (आंतरिक भावनात्मक दुनिया), लग्न (बाहरी व्यक्तित्व) और सूर्य राशि (मूल पहचान) के आधार पर उनके व्यक्तित्व का गहन विश्लेषण प्रदान करें। उनके स्वभाव, भावनात्मक प्रकृति, मानसिक प्रवृत्तियों, प्राकृतिक शक्तियों और आंतरिक प्रेरणाओं का वर्णन करें। सतही विवरण से आगे बढ़ें — उनकी राशियों के बीच की अंतरक्रिया का पता लगाएं। ${'{name}'} का नाम संदर्भित करें।`
        }
    },
    {
        id: 'career',
        heading: { en: 'Career', hi: 'करियर' },
        wordTarget: '300–400',
        instructions: {
            en: `Analyze ${'{name}'}'s professional path and vocational strengths. Cover: ideal industries and roles that align with their chart, leadership style and work ethic, timing of career milestones and promotions, periods of professional growth and challenge, relationship with authority figures, and strategic career advice. Reference the 10th house, its lord, and any planets influencing it. Mention specific Mahadasha or Antardasha periods that favor career advancement. ${'{emphasisCareer}'} Reference ${'{name}'} by name.`,
            hi: `${'{name}'} के व्यावसायिक मार्ग और वृत्तिगत शक्तियों का विश्लेषण करें। आदर्श उद्योग, नेतृत्व शैली, करियर की उन्नति का समय, वृद्धि और चुनौती की अवधि, और रणनीतिक करियर सलाह शामिल करें। 10वें भाव और उसके स्वामी का संदर्भ दें। ${'{emphasisCareerHindi}'} ${'{name}'} का नाम संदर्भित करें।`
        }
    },
    {
        id: 'love',
        heading: { en: 'Love', hi: 'प्रेम' },
        wordTarget: '300–400',
        instructions: {
            en: `Analyze ${'{name}'}'s romantic nature and relationship patterns. Cover: emotional needs in partnerships, romantic attachment style, compatibility archetypes (what kind of partner complements them), timing of significant romantic encounters, Venus and Moon influence on their love life, and guidance for cultivating fulfilling relationships. Reference the 5th and 7th houses. ${'{emphasisLove}'} Reference ${'{name}'} by name.`,
            hi: `${'{name}'} की प्रेम प्रकृति और रिश्ते के पैटर्न का विश्लेषण करें। भावनात्मक आवश्यकताओं, प्रेम संलग्नता शैली, संगतता आदर्श, महत्वपूर्ण प्रेम मुठभेड़ों का समय, शुक्र और चंद्रमा का प्रभाव, और सुखद रिश्तों के लिए मार्गदर्शन शामिल करें। 5वें और 7वें भाव का संदर्भ दें। ${'{emphasisLoveHindi}'} ${'{name}'} का नाम संदर्भित करें।`
        }
    },
    {
        id: 'marriage',
        heading: { en: 'Marriage', hi: 'विवाह' },
        wordTarget: '300–400',
        instructions: {
            en: `Analyze ${'{name}'}'s marital prospects and partnership harmony. Cover: timing of marriage (favorable periods), qualities to look for in a spouse, potential challenges in married life, Vedic perspectives on the 7th house and its lord, Venus (for men) or Jupiter (for women) influence, and remedies for marital harmony. Discuss both the ideal and the realistic — be honest about challenges while offering constructive guidance. ${'{emphasisMarriage}'} Reference ${'{name}'} by name.`,
            hi: `${'{name}'} की वैवाहिक संभावनाओं और भागीदारी सामंजस्य का विश्लेषण करें। विवाह का समय, जीवनसाथी में देखने योग्य गुण, वैवाहिक जीवन में चुनौतियां, 7वें भाव का वैदिक दृष्टिकोण, शुक्र/बृहस्पति का प्रभाव, और वैवाहिक सामंजस्य के उपाय शामिल करें। ${'{emphasisMarriageHindi}'} ${'{name}'} का नाम संदर्भित करें।`
        }
    },
    {
        id: 'finance',
        heading: { en: 'Finance', hi: 'वित्त' },
        wordTarget: '300–400',
        instructions: {
            en: `Analyze ${'{name}'}'s financial prospects and wealth potential. Cover: wealth cycles and income patterns, investment timing (favorable and cautionary periods), property and real estate prospects, the 2nd and 11th house analysis, Jupiter and Saturn influence on wealth accumulation, periods of financial growth and periods requiring caution, and strategic financial advice. Be specific about timeframes using Dasha periods. ${'{emphasisFinance}'} Reference ${'{name}'} by name.`,
            hi: `${'{name}'} की वित्तीय संभावनाओं और धन क्षमता का विश्लेषण करें। धन चक्र, निवेश का समय, संपत्ति की संभावनाएं, 2वें और 11वें भाव का विश्लेषण, बृहस्पति और शनि का प्रभाव, वित्तीय वृद्धि और सावधानी की अवधि, और रणनीतिक वित्तीय सलाह शामिल करें। ${'{emphasisFinanceHindi}'} ${'{name}'} का नाम संदर्भित करें।`
        }
    },
    {
        id: 'business',
        heading: { en: 'Business', hi: 'व्यापार' },
        wordTarget: '300–400',
        instructions: {
            en: `Analyze ${'{name}'}'s entrepreneurial potential and business prospects. Cover: natural aptitude for business vs. employment, ideal business sectors, partnership dynamics (who to partner with and who to avoid), timing for launching ventures, risk appetite and how to manage it, the 7th and 10th house influence on business, and periods favoring expansion vs. consolidation. ${'{emphasisBusiness}'} Reference ${'{name}'} by name.`,
            hi: `${'{name}'} की उद्यमशीलता क्षमता और व्यापार संभावनाओं का विश्लेषण करें। व्यापार के लिए प्राकृतिक अभिक्षमता, आदर्श व्यापार क्षेत्र, भागीदारी गतिशीलता, उद्यम शुरू करने का समय, जोखिम प्रबंधन, 7वें और 10वें भाव का प्रभाव, और विस्तार बनाम समेकन की अवधि शामिल करें। ${'{emphasisBusinessHindi}'} ${'{name}'} का नाम संदर्भित करें।`
        }
    },
    {
        id: 'health',
        heading: { en: 'Health Guidance', hi: 'स्वास्थ्य मार्गदर्शन' },
        wordTarget: '300–400',
        instructions: {
            en: `Provide traditional Vedic astrological health guidance for ${'{name}'}. CRITICAL: This section must be clearly and repeatedly framed as traditional astrological interpretation based on planetary positions — it is NOT medical advice, diagnosis, or treatment. Use phrases like "According to Vedic astrological tradition...", "From the perspective of Jyotish...", "Traditional Vedic astrology suggests...". Cover: periods of vitality and vulnerability, body areas influenced by their chart, seasonal sensitivities, traditional Ayurvedic-astrological wellness recommendations, the 6th house and its lord, and lifestyle adjustments based on planetary influences. ${'{emphasisHealth}'} Reference ${'{name}'} by name.`,
            hi: `${'{name}'} के लिए पारंपरिक वैदिक ज्योतिषीय स्वास्थ्य मार्गदर्शन प्रदान करें। महत्वपूर्ण: यह खंड स्पष्ट रूप से पारंपरिक ज्योतिषीय व्याख्या के रूप में प्रस्तुत किया जाना चाहिए — यह चिकित्सा सलाह, निदान या उपचार नहीं है। "वैदिक ज्योतिष परंपरा के अनुसार...", "ज्योतिष के दृष्टिकोण से..." जैसे वाक्यांशों का प्रयोग करें। जीवनशक्ति और संवेदनशीलता की अवधि, शारीरिक क्षेत्र, मौसमी संवेदनशीलता, पारंपरिक आयुर्वेद-ज्योतिषीय सुझाव, 6वें भाव, और ग्रह प्रभावों पर आधारित जीवनशैली समायोजन शामिल करें। ${'{emphasisHealthHindi}'} ${'{name}'} का नाम संदर्भित करें।`
        }
    },
    {
        id: 'luckyNumber',
        heading: { en: 'Lucky Number', hi: 'भाग्य अंक' },
        wordTarget: '40–60',
        instructions: {
            en: `State ${'{name}'}'s single most auspicious lucky number. Provide a brief explanation (2-3 sentences) of why this number resonates with their chart — reference the numerological significance and planetary connection. Format as a clear heading with the number prominently displayed.`,
            hi: `${'{name}'} का सबसे शुभ भाग्य अंक बताएं। यह अंक उनकी कुंडली से कैसे जुड़ता है, इसकी संख्यात्मक महत्ता और ग्रह संबंध का संक्षिप्त स्पष्टीकरण (2-3 वाक्य) दें। अंक को प्रमुखता से प्रदर्शित करें।`
        }
    },
    {
        id: 'luckyColor',
        heading: { en: 'Lucky Color', hi: 'भाग्य रंग' },
        wordTarget: '40–60',
        instructions: {
            en: `State ${'{name}'}'s single most auspicious lucky color. Provide a brief explanation (2-3 sentences) of the astrological reasoning — which planet's energy it channels and how it supports ${'{name}'}. Format as a clear heading with the color name prominently displayed.`,
            hi: `${'{name}'} का सबसे शुभ भाग्य रंग बताएं। किस ग्रह की ऊर्जा यह चैनल करता है और ${'{name}'} का समर्थन कैसे करता है, इसका संक्षिप ज्योतिषीय स्पष्टीकरण (2-3 वाक्य) दें। रंग का नाम प्रमुखता से प्रदर्शित करें।`
        }
    },
    {
        id: 'luckyDay',
        heading: { en: 'Lucky Day', hi: 'भाग्य दिन' },
        wordTarget: '40–60',
        instructions: {
            en: `State ${'{name}'}'s single most auspicious day of the week. Provide a brief explanation (2-3 sentences) of its planetary association and why it aligns with ${'{name}'}'s chart. Format as a clear heading with the day prominently displayed.`,
            hi: `${'{name}'} का सबसे शुभ सप्ताह का दिन बताएं। इसका ग्रह संबंध और ${'{name}'} की कुंडली से इसकी संरेखण क्यों है, इसका संक्षिप्त स्पष्टीकरण (2-3 वाक्य) दें। दिन प्रमुखता से प्रदर्शित करें।`
        }
    },
    {
        id: 'luckyDirection',
        heading: { en: 'Lucky Direction', hi: 'भाग्य दिशा' },
        wordTarget: '40–60',
        instructions: {
            en: `State ${'{name}'}'s single most auspicious direction. Provide a brief explanation (2-3 sentences) of its Vastu and astrological significance for ${'{name}'}. Format as a clear heading with the direction prominently displayed.`,
            hi: `${'{name}'} की सबसे शुभ दिशा बताएं। ${'{name}'} के लिए इसके वास्तु और ज्योतिषीय महत्ता का संक्षिप्त स्पष्टीकरण (2-3 वाक्य) दें। दिशा प्रमुखता से प्रदर्शित करें।`
        }
    },
    {
        id: 'luckyGemstone',
        heading: { en: 'Lucky Gemstone', hi: 'भाग्य रत्न' },
        wordTarget: '60–80',
        instructions: {
            en: `State the recommended gemstone for ${'{name}'}. Include: the gemstone name, recommended weight (in carats/ratti), the metal in which it should be set, the finger on which it should be worn, the day and time for wearing, and the mantra to chant. Provide a brief explanation of its planetary alignment with ${'{name}'}'s chart. Format as a heading with the gemstone name prominently displayed, followed by the specifications in a structured format.`,
            hi: `${'{name}'} के लिए अनुशंसित रत्न बताएं। रत्न का नाम, अनुशंसित वजन (रत्ती में), धातु, उंगली, धारण करने का दिन और समय, और मंत्र शामिल करें। ${'{name}'} की कुंडली के साथ इसकी ग्रहीय संरेखण का संक्षिप्त स्पष्टीकरण दें। रत्न का नाम प्रमुखता से प्रदर्शित करें।`
        }
    },
    {
        id: 'luckyRudraksha',
        heading: { en: 'Lucky Rudraksha', hi: 'भाग्य रुद्राक्ष' },
        wordTarget: '60–80',
        instructions: {
            en: `State the recommended Rudraksha for ${'{name}'}. Include: the mukhi (face) count, the ruling deity, the planet it pacifies, the day for wearing, and the mantra for energizing it. Provide a brief explanation of its spiritual significance for ${'{name}'}'s chart. Format as a heading with the Rudraksha type prominently displayed.`,
            hi: `${'{name}'} के लिए अनुशंसित रुद्राक्ष बताएं। मुखी संख्या, अधिष्ठाता देवता, शांत करने वाला ग्रह, धारण करने का दिन, और प्राण-प्रतिष्ठा मंत्र शामिल करें। ${'{name}'} की कुंडली के लिए इसके आध्यात्मिक महत्ता का संक्षिप्त स्पष्टीकरण दें। रुद्राक्ष प्रकार प्रमुखता से प्रदर्शित करें।`
        }
    },
    {
        id: 'remedies',
        heading: { en: 'Remedies', hi: 'उपाय' },
        wordTarget: '250–350',
        instructions: {
            en: `Provide 7 specific, practical Vedic remedies tailored to ${'{name}'}'s chart. Each remedy must be: (1) specific to a planetary influence in their chart, (2) actionable with clear instructions, (3) traditional and authentic. Include a mix of: mantras (with the Sanskrit text and meaning), donation recommendations (what, when, and to whom), ritual practices (specific days and methods), and lifestyle adjustments. Format as a numbered list with each remedy having a bold heading, the specific instruction, and a one-line explanation of why it helps ${'{name}'}. Reference ${'{name}'} by name.`,
            hi: `${'{name}'} की कुंडली के लिए 7 विशिष्ट, व्यावहारिक वैदिक उपाय प्रदान करें। प्रत्येक उपाय: (1) उनकी कुंडली के ग्रह प्रभाव के लिए विशिष्ट हो, (2) स्पष्ट निर्देशों के साथ कार्यवान हो, (3) पारंपरिक और प्रामाणिक हो। मंत्र (संस्कृत पाठ और अर्थ सहित), दान की सिफारिशें, अनुष्ठान, और जीवनशैली समायोजन शामिल करें। क्रमांकित सूची के रूप में प्रारूपित करें। ${'{name}'} का नाम संदर्भित करें।`
        }
    },
    {
        id: 'disclaimer',
        heading: { en: 'Important Disclaimer', hi: 'महत्वपूर्ण अस्वीकरण' },
        wordTarget: '80–120',
        instructions: {
            en: `Include a clear, professional disclaimer that states: This report is based on traditional Vedic astrological interpretation and should not be treated as medical, legal, or financial advice. The guidance provided reflects astrological traditions and is meant for personal reflection and self-awareness. For medical, legal, or financial decisions, always consult qualified professionals. Format as a distinct section with a clear heading, set apart from the main content, using a subtle visual treatment (e.g., a blockquote or italicized text).`,
            hi: `एक स्पष्ट, पेशेवर अस्वीकरण शामिल करें जो कहे: यह रिपोर्ट पारंपरिक वैदिक ज्योतिषीय व्याख्या पर आधारित है और इसे चिकित्सा, कानूनी या वित्तीय सलाह के रूप में नहीं लिया जाना चाहिए। यह मार्गदर्शन ज्योतिषीय परंपराओं को दर्शाता है और व्यक्तिगत प्रतिबिंब के लिए है। चिकित्सा, कानूनी या वित्तीय निर्णयों के लिए हमेशा योग्य पेशेवरों से परामर्श करें। एक अलग खंड के रूप में प्रारूपित करें।`
        }
    },
    {
        id: 'conclusion',
        heading: { en: 'Positive Conclusion', hi: 'सकारात्मक निष्कर्ष' },
        wordTarget: '200–300',
        instructions: {
            en: `Close the report with an empowering, hopeful, and deeply personal conclusion for ${'{name}'}. Summarize their cosmic strengths — the gifts their chart bestows. Affirm their potential and the unique path their stars illuminate. Address them by name directly. Offer a blessing or an uplifting closing thought rooted in Vedic wisdom. Make them feel seen, valued, and inspired to embrace their cosmic blueprint. The tone should be warm, confident, and forward-looking. End on a note that makes ${'{name}'} feel that their chart is not a limitation but a map of extraordinary possibilities.`,
            hi: `${'{name}'} के लिए एक सशक्तिकरण, आशापूर्ण और गहन व्यक्तिगत निष्कर्ष से रिपोर्ट बंद करें। उनकी कॉस्मिक शक्तियों का सारांश दें। उनकी क्षमता की पुष्टि करें। उन्हें नाम से संबोधित करें। वैदिश ज्ञान में निहित एक आशीर्वाद या उत्थापक समापन विचार प्रदान करें। ${'{name}'} को ऐसा महसूस कराएं कि उनकी कुंडली सीमा नहीं बल्कि असाधारण संभावनाओं का मानचित्र है।`
        }
    }
];

// ─── Emphasis builders ───────────────────────────────────────────
function buildEmphasisDirectives(reportType, lang) {
    const isHindi = lang === 'Hindi';
    const emphasisMap = {
        career:   { en: 'This is the PRIMARY FOCUS of the report — give it maximum depth and detail.', hi: 'यह रिपोर्ट का प्राथमिक फोकस है — इसे अधिकतम गहराई और विस्तार दें।' },
        love:     { en: 'This is the PRIMARY FOCUS of the report — give it maximum depth and detail.', hi: 'यह रिपोर्ट का प्राथमिक फोकस है — इसे अधिकतम गहराई और विस्तार दें।' },
        marriage: { en: 'This is the PRIMARY FOCUS of the report — give it maximum depth and detail.', hi: 'यह रिपोर्ट का प्राथमिक फोकस है — इसे अधिकतम गहराई और विस्तार दें।' },
        business: { en: 'This is the PRIMARY FOCUS of the report — give it maximum depth and detail.', hi: 'यह रिपोर्ट का प्राथमिक फोकस है — इसे अधिकतम गहराई और विस्तार दें।' },
        finance:  { en: 'This is the PRIMARY FOCUS of the report — give it maximum depth and detail.', hi: 'यह रिपोर्ट का प्राथमिक फोकस है — इसे अधिकतम गहराई और विस्तार दें।' },
        health:   { en: 'This is the PRIMARY FOCUS of the report — give it maximum depth and detail.', hi: 'यह रिपोर्ट का प्राथमिक फोकस है — इसे अधिकतम गहराई और विस्तार दें।' },
        complete: { en: 'This is a COMPLETE report — all sections should receive equal depth and detail.', hi: 'यह एक संपूर्ण रिपोर्ट है — सभी खंडों को समान गहराई और विस्तार मिलना चाहिए।' }
    };

    const emphasis = emphasisMap[reportType] || emphasisMap.complete;
    return isHindi ? emphasis.hi : emphasis.en;
}

// ─── Build individual section instructions ────────────────────────
function buildSectionInstructions(section, userData, reportTypeConfig) {
    const lang = userData.language || 'English';
    const isHindi = lang === 'Hindi';
    const langKey = isHindi ? 'hi' : 'en';

    let instructions = section.instructions[langKey] || section.instructions.en;

    // Replace {name} placeholders
    instructions = instructions.replace(/\{name\}/g, userData.name);

    // Replace emphasis placeholders for the focused section
    const emphasisText = buildEmphasisDirectives(userData.reportType, lang);
    instructions = instructions.replace(/\{emphasisCareer\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisCareerHindi\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisLove\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisLoveHindi\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisMarriage\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisMarriageHindi\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisFinance\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisFinanceHindi\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisBusiness\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisBusinessHindi\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisHealth\}/g, emphasisText);
    instructions = instructions.replace(/\{emphasisHealthHindi\}/g, emphasisText);

    const headingText = section.heading[langKey] || section.heading.en;

    return {
        heading: headingText,
        wordTarget: section.wordTarget,
        instructions: instructions
    };
}

// ─── Main exported function ──────────────────────────────────────
/**
 * Creates a detailed Gemini prompt for generating a premium
 * Vedic astrology report in Markdown.
 *
 * @param {Object} userData - User birth details and preferences
 * @param {string} userData.name - Full name
 * @param {string} userData.gender - Gender
 * @param {string} userData.dob - Date of birth (YYYY-MM-DD)
 * @param {string} userData.birthTime - Time of birth (HH:MM)
 * @param {string} userData.birthPlace - Birth place
 * @param {string} userData.language - Preferred language (English|Hindi)
 * @param {string} userData.reportType - Type of report
 * @returns {string} - Complete prompt string for Gemini
 */
function createPrompt(userData) {
    // ── Input validation ──────────────────────────────────────
    if (!userData || typeof userData !== 'object') {
        throw new Error('createPrompt: userData must be a valid object');
    }

    const requiredFields = ['name', 'gender', 'dob', 'birthTime', 'birthPlace', 'language', 'reportType'];
    const missingFields = requiredFields.filter(field => !userData[field]);

    if (missingFields.length > 0) {
        throw new Error(
            `createPrompt: Missing required fields: ${missingFields.join(', ')}`
        );
    }

    const validReportTypes = Object.keys(REPORT_TYPES);
    if (!validReportTypes.includes(userData.reportType)) {
        throw new Error(
            `createPrompt: Invalid reportType "${userData.reportType}". Must be one of: ${validReportTypes.join(', ')}`
        );
    }

    const validLanguages = Object.keys(LANGUAGES);
    if (!validLanguages.includes(userData.language)) {
        throw new Error(
            `createPrompt: Invalid language "${userData.language}". Must be one of: ${validLanguages.join(', ')}`
        );
    }

    // ── Resolve language and report type config ───────────────
    const langConfig = LANGUAGES[userData.language];
    const reportTypeConfig = REPORT_TYPES[userData.reportType];
    const isHindi = userData.language === 'Hindi';

    // ── Format date for display ───────────────────────────────
    let formattedDate = userData.dob;
    try {
        const dateObj = new Date(userData.dob + 'T00:00:00');
        formattedDate = dateObj.toLocaleDateString(
            isHindi ? 'hi-IN' : 'en-IN',
            { day: 'numeric', month: 'long', year: 'numeric' }
        );
    } catch (_) {
        formattedDate = userData.dob;
    }

    // ── Format time for display ───────────────────────────────
    let formattedTime = userData.birthTime;
    try {
        const [h, m] = userData.birthTime.split(':').map(Number);
        const hour = parseInt(h);
        const ampm = hour >= 12 ? (isHindi ? 'अपराह्न' : 'PM') : (isHindi ? 'पूर्वाह्न' : 'AM');
        const h12 = hour % 12 || 12;
        formattedTime = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch (_) {
        formattedTime = userData.birthTime;
    }

    // ── Build section instructions ────────────────────────────
    const sectionDetails = SECTIONS.map(section =>
        buildSectionInstructions(section, userData, reportTypeConfig)
    );

    // ── Construct the full prompt ─────────────────────────────
    const sectionsBlock = sectionDetails.map((s, i) => {
        const num = i + 1;
        return `### Section ${num}: ${s.heading}\n**Word target:** ${s.wordTarget} words\n**Instructions:**\n${s.instructions}`;
    }).join('\n\n---\n\n');

    const prompt = `You are a master Vedic astrologer (Jyotish Acharya) with over 40 years of deep practice in Parashari and Jaimini systems of Vedic astrology. You are renowned for writing deeply insightful, compassionate, authoritative, and precise astrological reports that transform lives. Your reports are professional, detailed, and formatted in rich Markdown.

 ${langConfig.writeIn}

 ${langConfig.sectionHeadings}

 ${langConfig.toneNote}

---

# TASK

Generate a premium, professional Vedic astrology report for the following person:

**Name:** ${userData.name}
**Gender:** ${userData.gender}
**Date of Birth:** ${formattedDate}
**Time of Birth:** ${formattedTime}
**Birth Place:** ${userData.birthPlace}
**Report Focus:** ${reportTypeConfig.label}

 ${reportTypeConfig.depthDirective}

---

# REPORT STRUCTURE

The report title must be:

# Celestial Insights — ${reportTypeConfig.label} Report
## For ${userData.name}

Then include ALL of the following sections in EXACTLY this order. Each section must be a proper Markdown heading (## or ###). Do not skip any section. Do not reorder sections.

---

 ${sectionsBlock}

---

# FORMATTING RULES

1. **Markdown formatting:** Use proper Markdown throughout — headings (# ## ###), bold (**text**), italic (*text*), bullet lists (- item), numbered lists (1. item), tables (| col | col |), and horizontal rules (---) between major sections.

2. **Word count:** The total report must be 3000–5000 words. Do not write less than 3000 words. Do not pad with filler — every sentence must carry meaning.

3. **Personalization:** Reference ${userData.name} by name at least 15 times throughout the report. Every paragraph must feel specific to their chart — no generic statements that could apply to anyone.

4. **Astrological terminology:** Use Vedic terminology naturally — Rashi, Nakshatra, Lagna, Bhava, Dasha, Antardasha, Gochar, Yog, Dosha, etc. Explain terms briefly in context where the reader may not be familiar.

5. **Timeframes:** Include specific timeframes and planetary periods where relevant. Reference Mahadasha and Antardasha periods with approximate years.

6. **Tables:** Use Markdown tables for:
   - Planetary positions summary (Planet | Sign | Nakshatra | House)
   - Dasha timeline (Dasha | Period | Key Focus)

7. **Health section framing:** The Health Guidance section MUST be clearly and repeatedly framed as traditional astrological interpretation. It is NOT medical advice, diagnosis, or treatment. Use phrases like "According to Vedic astrological tradition..." and "From the perspective of Jyotish..." at least twice in that section.

8. **Disclaimer:** The Important Disclaimer section must be clearly visible and set apart from the main content. Use a Markdown blockquote (>) for the disclaimer text.

9. **Lucky sections:** Each Lucky section (Number, Color, Day, Direction, Gemstone, Rudraksha) must have a clear, single answer prominently displayed, followed by a brief astrological explanation. For Gemstone and Rudraksha, include specific wearing instructions.

10. **No filler:** Do not use generic phrases like "The stars suggest many possibilities" or "Only time will tell." Every sentence must be specific, insightful, and actionable.

11. **Tone:** Warm, authoritative, respectful, and empowering. Never condescending. Never dismissive. The reader should feel that their chart is a map of extraordinary possibilities.

12. **Conclusion:** End on a note that makes ${userData.name} feel deeply seen, valued, and inspired. The Positive Conclusion should be the emotional crescendo of the report.

---

# CRITICAL REMINDERS

- Write the ENTIRE report in ${langConfig.nativeName}.
- Total word count: 3000–5000 words.
- Include ALL ${SECTIONS.length} sections. Do not skip any.
- The Health Guidance section is NOT medical advice — frame it as traditional astrological guidance.
- Include the Important Disclaimer section exactly as specified.
- Every paragraph must feel specific to ${userData.name}'s chart.
- Use proper Markdown formatting throughout.

Begin the report now.`;

    return prompt;
}

// ─── Export ───────────────────────────────────────────────────────
module.exports = { createPrompt };