/**
 * Vedic Astrology Calculation Module
 * 
 * Provides approximate calculations for:
 * - Sun Sign (Rashi), Moon Sign, Ascendant (Lagna)
 * - Nakshatra
 * - Planetary positions
 * - House placements
 * - Mahadasha periods
 * 
 * NOTE: For production accuracy, replace with Swiss Ephemeris (sweph).
 * This module provides reasonable approximations for demonstration.
 */

const RASHIS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const RASHI_LORDS = [
    'Mars', 'Venus', 'Mercury', 'Moon',
    'Sun', 'Mercury', 'Venus', 'Mars',
    'Jupiter', 'Saturn', 'Saturn', 'Jupiter'
];

const NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const NAKSHATRA_LORDS = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
    'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
    'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
    'Jupiter', 'Saturn', 'Mercury'
];

const DASHA_ORDER = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
    'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];

const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

/**
 * Calculate the approximate sidereal longitude of the Sun
 */
function getSunLongitude(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Approximate solar longitude calculation
    const dayOfYear = Math.floor((date - new Date(year, 0, 0)) / 86400000);
    // Vernal equinox around March 21 (day 80)
    const solarLongitude = ((dayOfYear - 80) * 360 / 365.25 + 360) % 360;

    // Apply ayanamsa (Lahiri ~24°)
    const ayanamsa = 24.1;
    return (solarLongitude - ayanamsa + 360) % 360;
}

/**
 * Calculate the approximate sidereal longitude of the Moon
 */
function getMoonLongitude(date) {
    // Simplified lunar longitude based on synodic period
    const knownNewMoon = new Date(2000, 0, 6, 18, 14); // Known new moon
    const synodicPeriod = 29.53059;
    const daysSinceNew = (date - knownNewMoon) / 86400000;
    const moonPhase = (daysSinceNew % synodicPeriod) / synodicPeriod;

    // Approximate tropical longitude
    const tropicalLongitude = (moonPhase * 360 + 218.3) % 360;

    // Apply ayanamsa
    const ayanamsa = 24.1;
    return (tropicalLongitude - ayanamsa + 360) % 360;
}

/**
 * Get Rashi from longitude
 */
function getRashi(longitude) {
    const rashiIndex = Math.floor(longitude / 30) % 12;
    return { index: rashiIndex, name: RASHIS[rashiIndex], lord: RASHI_LORDS[rashiIndex] };
}

/**
 * Get Nakshatra from longitude
 */
function getNakshatra(longitude) {
    const nakshatraIndex = Math.floor(longitude / (360 / 27)) % 27;
    const pada = Math.floor((longitude % (360 / 27)) / (360 / 108)) + 1;
    return {
        index: nakshatraIndex,
        name: NAKSHATRAS[nakshatraIndex],
        lord: NAKSHATRA_LORDS[nakshatraIndex],
        pada
    };
}

/**
 * Calculate approximate Ascendant (Lagna)
 */
function getAscendant(date, time, latitude) {
    const [hours, minutes] = time.split(':').map(Number);
    const localTimeHours = hours + minutes / 60;

    // Approximate sidereal time
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const gst = (localTimeHours + (dayOfYear / 365.25) * 24) % 24;
    const lst = (gst + latitude / 15) % 24;

    // Convert LST to approximate ascendant longitude
    const ascLongitude = (lst * 15 - 90 + 360) % 360;

    // Apply ayanamsa
    const ayanamsa = 24.1;
    const siderealAsc = (ascLongitude - ayanamsa + 360) % 360;

    return siderealAsc;
}

/**
 * Calculate approximate planetary positions
 */
function getPlanetaryPositions(date) {
    const year = date.getFullYear();
    const dayOfYear = Math.floor((date - new Date(year, 0, 0)) / 86400000);

    // Approximate orbital periods in years
    const planets = {
        Mercury: { period: 0.2408, offset: 75 },
        Venus: { period: 0.6152, offset: 130 },
        Mars: { period: 1.8809, offset: 210 },
        Jupiter: { period: 11.862, offset: 290 },
        Saturn: { period: 29.457, offset: 340 },
        Rahu: { period: 18.6, offset: 180, isRetrograde: true }
    };

    const ayanamsa = 24.1;
    const result = {};

    // Sun
    const sunLong = getSunLongitude(date);
    result.Sun = {
        sign: getRashi(sunLong).name,
        degree: Math.round((sunLong % 30) * 100) / 100,
        longitude: Math.round(sunLong * 100) / 100,
        nakshatra: getNakshatra(sunLong).name,
        status: 'Direct'
    };

    // Moon
    const moonLong = getMoonLongitude(date);
    result.Moon = {
        sign: getRashi(moonLong).name,
        degree: Math.round((moonLong % 30) * 100) / 100,
        longitude: Math.round(moonLong * 100) / 100,
        nakshatra: getNakshatra(moonLong).name,
        status: 'Direct'
    };

    // Other planets
    Object.entries(planets).forEach(([name, data]) => {
        const tropicalLong = (data.offset + (dayOfYear / (data.period * 365.25)) * 360) % 360;
        const siderealLong = (tropicalLong - ayanamsa + 360) % 360;
        result[name] = {
            sign: getRashi(siderealLong).name,
            degree: Math.round((siderealLong % 30) * 100) / 100,
            longitude: Math.round(siderealLong * 100) / 100,
            nakshatra: getNakshatra(siderealLong).name,
            status: data.isRetrograde ? 'Retrograde' : 'Direct'
        };
    });

    // Ketu is always opposite Rahu
    const rahuLong = result.Rahu.longitude;
    const ketuLong = (rahuLong + 180) % 360;
    result.Ketu = {
        sign: getRashi(ketuLong).name,
        degree: Math.round((ketuLong % 30) * 100) / 100,
        longitude: Math.round(ketuLong * 100) / 100,
        nakshatra: getNakshatra(ketuLong).name,
        status: 'Retrograde'
    };

    return result;
}

/**
 * Calculate house placements based on Ascendant
 */
function getHousePlacements(ascendantRashiIndex, planets) {
    const houses = {};
    for (let i = 1; i <= 12; i++) {
        const rashiIndex = (ascendantRashiIndex + i - 1) % 12;
        houses[i] = {
            sign: RASHIS[rashiIndex],
            lord: RASHI_LORDS[rashiIndex],
            planets: []
        };
    }

    // Place planets in houses
    Object.entries(planets).forEach(([name, data]) => {
        const planetRashiIndex = RASHIS.indexOf(data.sign);
        const houseNumber = ((planetRashiIndex - ascendantRashiIndex + 12) % 12) + 1;
        if (houses[houseNumber]) {
            houses[houseNumber].planets.push(name);
        }
    });

    return houses;
}

/**
 * Calculate current Mahadasha
 */
function getCurrentDasha(date, moonLongitude) {
    const nakshatraIndex = Math.floor(moonLongitude / (360 / 27)) % 27;
    const nakshatraLord = NAKSHATRA_LORDS[nakshatraIndex];
    const dashaStartIndex = DASHA_ORDER.indexOf(nakshatraLord);

    // Calculate the portion of nakshatra already traversed
    const nakshatraStart = nakshatraIndex * (360 / 27);
    const portionTraversed = (moonLongitude - nakshatraStart) / (360 / 27);

    // Calculate remaining dasha years
    const startDashaYears = DASHA_YEARS[dashaStartIndex];
    const remainingYears = startDashaYears * (1 - portionTraversed);

    // Calculate birth dasha end date
    const birthDate = new Date(date);
    const dashaEndBirth = new Date(birthDate.getTime() + remainingYears * 365.25 * 24 * 60 * 60 * 1000);

    // Find current dasha
    let currentDate = new Date();
    let dashaIndex = dashaStartIndex;
    let dashaStart = new Date(birthDate);
    let dashaEnd = new Date(dashaEndBirth);

    // If birth dasha is still running
    if (currentDate <= dashaEnd) {
        return {
            current: DASHA_ORDER[dashaIndex],
            startDate: dashaStart.toISOString().split('T')[0],
            endDate: dashaEnd.toISOString().split('T')[0],
            remainingYears: Math.round(remainingYears * 10) / 10
        };
    }

    // Cycle through dashas
    let totalYears = remainingYears;
    while (dashaEnd < currentDate) {
        dashaIndex = (dashaIndex + 1) % DASHA_ORDER.length;
        dashaStart = new Date(dashaEnd);
        dashaEnd = new Date(dashaStart.getTime() + DASHA_YEARS[dashaIndex] * 365.25 * 24 * 60 * 60 * 1000);
        totalYears += DASHA_YEARS[dashaIndex];

        if (dashaEnd > currentDate) {
            return {
                current: DASHA_ORDER[dashaIndex],
                startDate: dashaStart.toISOString().split('T')[0],
                endDate: dashaEnd.toISOString().split('T')[0],
                remainingYears: Math.round(
                    ((dashaEnd - currentDate) / (365.25 * 24 * 60 * 60 * 1000)) * 10
                ) / 10
            };
        }
    }

    return {
        current: DASHA_ORDER[dashaIndex],
        startDate: dashaStart.toISOString().split('T')[0],
        endDate: dashaEnd.toISOString().split('T')[0],
        remainingYears: 0
    };
}

/**
 * Main calculation function
 */
function calculateVedicChart(userDetails) {
    const dob = new Date(userDetails.dob);
    const tob = userDetails.tob;

    // Approximate latitude based on common Indian cities
    const cityLatitudes = {
        'mumbai': 19.076, 'delhi': 28.704, 'bangalore': 12.971,
        'chennai': 13.082, 'kolkata': 22.572, 'hyderabad': 17.385,
        'pune': 18.520, 'ahmedabad': 23.022, 'jaipur': 26.912,
        'lucknow': 26.846, 'chandigarh': 30.733, 'bhopal': 23.259,
        'patna': 25.609, 'indore': 22.719, 'nagpur': 21.145,
        'kochi': 9.931, 'goa': 15.299, 'varanasi': 25.317
    };

    const birthCity = userDetails.birthPlace.toLowerCase().split(',')[0].trim();
    const latitude = cityLatitudes[birthCity] || 20.5937; // Default to center of India

    // Calculate planetary positions
    const planets = getPlanetaryPositions(dob);

    // Calculate Sun Sign
    const sunLong = getSunLongitude(dob);
    const sunRashi = getRashi(sunLong);

    // Calculate Moon Sign
    const moonLong = getMoonLongitude(dob);
    const moonRashi = getRashi(moonLong);

    // Calculate Ascendant
    const ascLong = getAscendant(dob, tob, latitude);
    const ascRashi = getRashi(ascLong);

    // Calculate Nakshatra
    const nakshatra = getNakshatra(moonLong);

    // Calculate Houses
    const houses = getHousePlacements(ascRashi.index, planets);

    // Calculate Dasha
    const currentDasha = getCurrentDasha(dob, moonLong);

    return {
        sunSign: sunRashi.name,
        moonSign: moonRashi.name,
        ascendant: ascRashi.name,
        ascendantLord: ascRashi.lord,
        nakshatra: `${nakshatra.name} Pada ${nakshatra.pada}`,
        nakshatraLord: nakshatra.lord,
        planets,
        houses,
        currentDasha,
        birthDetails: {
            date: userDetails.dob,
            time: userDetails.tob,
            place: userDetails.birthPlace,
            latitude
        }
    };
}

module.exports = { calculateVedicChart };