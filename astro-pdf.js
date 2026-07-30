/**
 * pdf.js — Premium PDF Report Generator
 *
 * Uses PDFKit to generate a professional, gold-accented
 * Vedic astrology report PDF with cover page, formatted
 * markdown content, automatic page breaks, and footer
 * page numbers.
 *
 * Exported: generatePDF(report, userName) → Promise<string>
 */

'use strict';

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────
const CONFIG = {
    PAGE_SIZE: 'A4',
    MARGIN: 60,
    FOOTER_MARGIN: 45,
    CONTENT_TOP: 60,
    CONTENT_BOTTOM: 60,
    REPORTS_DIR: path.join(__dirname, 'reports'),
    FONT_DIR: path.join(__dirname, 'fonts'),
    LINE_GAP: 4,
    PARAGRAPH_GAP: 10,
    HEADING_MIN_SPACE: 100
};

// ─── Color Palette ───────────────────────────────────────────────
const COLORS = {
    gold: '#D4AF37',
    goldLight: '#F4E4A0',
    goldDark: '#B8960C',
    darkBg: '#0a0a0a',
    darkBgAlt: '#111111',
    textPrimary: '#1e1e1e',
    textSecondary: '#4a4a4a',
    textMuted: '#888888',
    white: '#ffffff',
    cream: '#faf8f0',
    tableHeaderBg: '#D4AF37',
    tableHeaderText: '#0a0a0a',
    tableRowAlt: '#f9f6ee',
    tableBorder: '#D4AF37',
    blockquoteBg: '#fdf9ed',
    blockquoteBorder: '#D4AF37',
    hrLine: '#D4AF37',
    coverSubtitle: '#F0E6D3',
    coverMuted: '#8B7D6B'
};

// ─── Font Registry ───────────────────────────────────────────────
const FONTS = {
    sans: 'Helvetica',
    sansBold: 'Helvetica-Bold',
    sansOblique: 'Helvetica-Oblique',
    serif: 'Times-Roman',
    serifBold: 'Times-Bold',
    serifItalic: 'Times-Italic',
    serifBoldItalic: 'Times-BoldItalic',
    mono: 'Courier'
};

// ─── Custom Font Loading ─────────────────────────────────────────
let customFontsLoaded = false;
let hasDevanagariFont = false;

/**
 * Attempt to load custom fonts from the /fonts/ directory.
 * Supports Noto Sans / Noto Serif for Devanagari if present.
 */
function loadCustomFonts(doc) {
    if (customFontsLoaded) return;

    const fontFiles = {
        'NotoSans-Regular.ttf': 'NotoSans',
        'NotoSans-Bold.ttf': 'NotoSansBold',
        'NotoSans-Italic.ttf': 'NotoSansItalic',
        'NotoSansDevanagari-Regular.ttf': 'NotoSansDev',
        'NotoSansDevanagari-Bold.ttf': 'NotoSansDevBold',
        'NotoSerif-Regular.ttf': 'NotoSerif',
        'NotoSerif-Bold.ttf': 'NotoSerifBold',
        'NotoSerif-Italic.ttf': 'NotoSerifItalic',
        'NotoSerifDevanagari-Regular.ttf': 'NotoSerifDev',
        'NotoSerifDevanagari-Bold.ttf': 'NotoSerifDevBold'
    };

    try {
        if (!fs.existsSync(CONFIG.FONT_DIR)) {
            customFontsLoaded = true;
            return;
        }

        Object.entries(fontFiles).forEach(([file, name]) => {
            const filePath = path.join(CONFIG.FONT_DIR, file);
            if (fs.existsSync(filePath)) {
                doc.registerFont(name, filePath);
                if (name.includes('Dev')) {
                    hasDevanagariFont = true;
                }
            }
        });
    } catch (err) {
        console.warn('[pdf.js] Custom font loading failed:', err.message);
    }

    customFontsLoaded = true;
}

// ─── Utility Functions ───────────────────────────────────────────

/**
 * Sanitize a string for use in file names.
 */
function sanitizeFileName(name) {
    return name
        .trim()
        .replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
}

/**
 * Detect Devanagari (Hindi) characters in text.
 */
function hasDevanagari(text) {
    return /[\u0900-\u097F]/.test(text);
}

/**
 * Get the appropriate font family based on content language.
 */
function getFontFamily(text) {
    const isDev = hasDevanagari(text);

    if (isDev && hasDevanagariFont) {
        return {
            regular: 'NotoSerifDev',
            bold: 'NotoSerifDevBold',
            italic: 'NotoSerifDev',
            boldItalic: 'NotoSerifDevBold',
            sans: 'NotoSansDev',
            sansBold: 'NotoSansDevBold'
        };
    }

    if (isDev && !hasDevanagariFont) {
        console.warn(
            '[pdf.js] Devanagari text detected but no custom font found. ' +
            'Place NotoSansDevanagari-Regular.ttf and NotoSansDevanagari-Bold.ttf ' +
            'in the /fonts/ directory for proper Hindi rendering.'
        );
    }

    return {
        regular: FONTS.serif,
        bold: FONTS.serifBold,
        italic: FONTS.serifItalic,
        boldItalic: FONTS.serifBoldItalic,
        sans: FONTS.sans,
        sansBold: FONTS.sansBold
    };
}

/**
 * Ensure a directory exists.
 */
function ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * Format the current date for display.
 */
function formatDate() {
    return new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Check if there is enough space left on the current page.
 */
function hasSpace(doc, requiredSpace) {
    return doc.y + requiredSpace < doc.page.height - CONFIG.CONTENT_BOTTOM - CONFIG.FOOTER_MARGIN;
}

/**
 * Ensure space for a block, add a new page if needed.
 */
function ensureSpace(doc, requiredSpace) {
    if (!hasSpace(doc, requiredSpace)) {
        doc.addPage();
        renderPageAccent(doc);
    }
}

// ─── Markdown Parser ─────────────────────────────────────────────

/**
 * Parse a markdown string into structured blocks.
 * Returns an array of block objects.
 */
function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    let currentBlock = null;

    function flushBlock() {
        if (currentBlock) {
            blocks.push(currentBlock);
            currentBlock = null;
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trimEnd();
        const trimmed = line.trim();

        // Empty line — end current block
        if (trimmed === '') {
            flushBlock();
            continue;
        }

        // Horizontal rule
        if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed) || /^_{3,}$/.test(trimmed)) {
            flushBlock();
            blocks.push({ type: 'hr' });
            continue;
        }

        // H1
        if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
            flushBlock();
            blocks.push({ type: 'h1', text: trimmed.slice(2) });
            continue;
        }

        // H2
        if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
            flushBlock();
            blocks.push({ type: 'h2', text: trimmed.slice(3) });
            continue;
        }

        // H3
        if (trimmed.startsWith('### ')) {
            flushBlock();
            blocks.push({ type: 'h3', text: trimmed.slice(4) });
            continue;
        }

        // Bullet list
        if (/^[-*]\s/.test(trimmed)) {
            if (currentBlock && currentBlock.type !== 'bullet') {
                flushBlock();
            }
            if (!currentBlock) {
                currentBlock = { type: 'bullet', items: [] };
            }
            currentBlock.items.push(trimmed.replace(/^[-*]\s/, ''));
            continue;
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
            if (currentBlock && currentBlock.type !== 'numbered') {
                flushBlock();
            }
            if (!currentBlock) {
                currentBlock = { type: 'numbered', items: [] };
            }
            currentBlock.items.push(trimmed.replace(/^\d+\.\s/, ''));
            continue;
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
            if (currentBlock && currentBlock.type !== 'blockquote') {
                flushBlock();
            }
            if (!currentBlock) {
                currentBlock = { type: 'blockquote', text: '' };
            }
            currentBlock.text += (currentBlock.text ? ' ' : '') + trimmed.slice(2);
            continue;
        }

        // Table
        if (trimmed.startsWith('|')) {
            if (currentBlock && currentBlock.type !== 'table') {
                flushBlock();
            }
            if (!currentBlock) {
                currentBlock = { type: 'table', rows: [] };
            }
            currentBlock.rows.push(trimmed);
            continue;
        }

        // Paragraph (default)
        if (currentBlock && currentBlock.type !== 'paragraph') {
            flushBlock();
        }
        if (!currentBlock) {
            currentBlock = { type: 'paragraph', text: '' };
        }
        currentBlock.text += (currentBlock.text ? ' ' : '') + trimmed;
    }

    flushBlock();
    return blocks;
}

// ─── Inline Formatting Parser ────────────────────────────────────

/**
 * Parse inline markdown formatting (bold, italic, code) into segments.
 * Returns an array of { text, style } objects.
 */
function parseInlineFormatting(text) {
    const segments = [];
    const regex = /(\*\*([^*]+?)\*\*|\*([^*]+?)\*|`([^`]+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
            segments.push({
                text: text.slice(lastIndex, match.index),
                style: 'normal'
            });
        }

        // Bold
        if (match[2] !== undefined) {
            segments.push({ text: match[2], style: 'bold' });
        }
        // Italic
        else if (match[3] !== undefined) {
            segments.push({ text: match[3], style: 'italic' });
        }
        // Code
        else if (match[4] !== undefined) {
            segments.push({ text: match[4], style: 'code' });
        }

        lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < text.length) {
        segments.push({
            text: text.slice(lastIndex),
            style: 'normal'
        });
    }

    // If no formatting found, return the whole text as normal
    if (segments.length === 0) {
        segments.push({ text: text, style: 'normal' });
    }

    return segments;
}

// ─── Cover Page Renderer ─────────────────────────────────────────

/**
 * Render the premium cover page with dark background and gold accents.
 */
function renderCoverPage(doc, userName) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Dark background
    doc.rect(0, 0, pageWidth, pageHeight).fill(COLORS.darkBg);

    // Subtle radial gradient overlay
    const gradientRect = doc.save();
    doc.rect(0, 0, pageWidth, pageHeight);
    doc.fillColor('rgba(212, 175, 55, 0.02)');
    doc.fill();
    doc.restore();

    // ── Top decorative gold line ──
    const topLineY = 180;
    doc.save();
    doc.moveTo(CONFIG.MARGIN, topLineY)
        .lineTo(pageWidth - CONFIG.MARGIN, topLineY)
        .strokeColor(COLORS.gold)
        .lineWidth(0.8)
        .stroke();
    doc.restore();

    // ── Small diamond accent above title ──
    const diamondY = topLineY + 30;
    const diamondSize = 5;
    doc.save();
    doc.moveTo(pageWidth / 2, diamondY - diamondSize)
        .lineTo(pageWidth / 2 + diamondSize, diamondY)
        .lineTo(pageWidth / 2, diamondY + diamondSize)
        .lineTo(pageWidth / 2 - diamondSize, diamondY)
        .closePath()
        .fillColor(COLORS.gold)
        .fill();
    doc.restore();

    // ── "CELESTIAL" title ──
    doc.font(FONTS.sansBold)
        .fontSize(42)
        .fillColor(COLORS.gold)
        .text('CELESTIAL', CONFIG.MARGIN, topLineY + 50, {
            align: 'center',
            width: pageWidth - CONFIG.MARGIN * 2
        });

    // ── "INSIGHTS" title ──
    doc.font(FONTS.sans)
        .fontSize(38)
        .fillColor(COLORS.goldLight)
        .text('INSIGHTS', CONFIG.MARGIN, doc.y + 2, {
            align: 'center',
            width: pageWidth - CONFIG.MARGIN * 2
        });

    // ── Gold separator line with star ──
    const sepY = doc.y + 30;
    const sepMidX = pageWidth / 2;
    const sepWidth = 80;

    doc.save();
    doc.moveTo(sepMidX - sepWidth, sepY)
        .lineTo(sepMidX - 10, sepY)
        .strokeColor(COLORS.gold)
        .lineWidth(0.5)
        .stroke();
    doc.moveTo(sepMidX + 10, sepY)
        .lineTo(sepMidX + sepWidth, sepY)
        .strokeColor(COLORS.gold)
        .lineWidth(0.5)
        .stroke();
    doc.restore();

    // Star character between lines
    doc.font(FONTS.sans)
        .fontSize(10)
        .fillColor(COLORS.gold)
        .text('✦', sepMidX - 4, sepY - 6, { width: 8, align: 'center' });

    // ── Report subtitle ──
    doc.font(FONTS.sans)
        .fontSize(14)
        .fillColor(COLORS.coverSubtitle)
        .text('Premium Vedic Astrology Report', CONFIG.MARGIN, sepY + 25, {
            align: 'center',
            width: pageWidth - CONFIG.MARGIN * 2
        });

    // ── "Prepared for" label ──
    doc.font(FONTS.sans)
        .fontSize(10)
        .fillColor(COLORS.coverMuted)
        .text('PREPARED FOR', CONFIG.MARGIN, sepY + 65, {
            align: 'center',
            width: pageWidth - CONFIG.MARGIN * 2,
            characterSpacing: 4
        });

    // ── User name ──
    doc.font(FONTS.sansBold)
        .fontSize(28)
        .fillColor(COLORS.gold)
        .text(userName, CONFIG.MARGIN, doc.y + 8, {
            align: 'center',
            width: pageWidth - CONFIG.MARGIN * 2
        });

    // ── Date ──
    doc.font(FONTS.sans)
        .fontSize(11)
        .fillColor(COLORS.coverMuted)
        .text(formatDate(), CONFIG.MARGIN, doc.y + 20, {
            align: 'center',
            width: pageWidth - CONFIG.MARGIN * 2
        });

    // ── Bottom decorative gold line ──
    const bottomLineY = pageHeight - 180;
    doc.save();
    doc.moveTo(CONFIG.MARGIN, bottomLineY)
        .lineTo(pageWidth - CONFIG.MARGIN, bottomLineY)
        .strokeColor(COLORS.gold)
        .lineWidth(0.8)
        .stroke();
    doc.restore();

    // ── Footer tagline ──
    doc.font(FONTS.sans)
        .fontSize(8)
        .fillColor(COLORS.coverMuted)
        .text(
            'Guided by the Stars  ·  Powered by Ancient Wisdom',
            CONFIG.MARGIN,
            bottomLineY + 14,
            {
                align: 'center',
                width: pageWidth - CONFIG.MARGIN * 2,
                characterSpacing: 2
            }
        );
}

// ─── Page Accent Renderer ────────────────────────────────────────

/**
 * Render a subtle gold accent line at the top of a content page.
 */
function renderPageAccent(doc) {
    const pageWidth = doc.page.width;
    doc.save();
    doc.moveTo(CONFIG.MARGIN, 40)
        .lineTo(pageWidth - CONFIG.MARGIN, 40)
        .strokeColor(COLORS.gold)
        .lineWidth(0.3)
        .stroke();
    doc.restore();
    doc.y = CONFIG.CONTENT_TOP;
}

// ─── Inline Text Renderer ────────────────────────────────────────

/**
 * Render text with inline bold, italic, and code formatting.
 */
function renderInlineText(doc, text, options = {}) {
    const fontFamily = getFontFamily(text);
    const segments = parseInlineFormatting(text);

    if (segments.length === 0) return;

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const isLast = i === segments.length - 1;

        let font;
        switch (segment.style) {
            case 'bold':
                font = fontFamily.bold;
                break;
            case 'italic':
                font = fontFamily.italic;
                break;
            case 'code':
                font = FONTS.mono;
                break;
            default:
                font = fontFamily.regular;
        }

        doc.font(font);

        const textOptions = {
            continued: !isLast,
            lineGap: CONFIG.LINE_GAP,
            ...options
        };

        // Remove continued from last segment
        if (isLast) {
            delete textOptions.continued;
        }

        doc.text(segment.text, textOptions);
    }
}

// ─── Table Renderer ──────────────────────────────────────────────

/**
 * Parse table rows into a 2D array of cell values.
 */
function parseTableRows(rows) {
    const data = [];
    for (const row of rows) {
        // Skip separator rows (|---|---|)
        if (/^\|[\s\-:|]+\|$/.test(row)) continue;

        const cells = row
            .split('|')
            .map(cell => cell.trim())
            .filter((cell, index, arr) => {
                // Filter out empty strings from leading/trailing |
                return !(index === 0 && cell === '') && !(index === arr.length - 1 && cell === '');
            });

        if (cells.length > 0) {
            data.push(cells);
        }
    }
    return data;
}

/**
 * Render a markdown table with gold accents.
 */
function renderTable(doc, tableBlock) {
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - CONFIG.MARGIN * 2;
    const data = parseTableRows(tableBlock.rows);

    if (data.length === 0) return;

    const numCols = data[0].length;
    const colWidth = contentWidth / numCols;
    const cellPadding = 8;
    const rowHeight = 28;
    const headerHeight = 30;
    const totalHeight = headerHeight + (data.length - 1) * rowHeight;

    // Ensure space
    ensureSpace(doc, Math.min(totalHeight, 200));

    const startX = CONFIG.MARGIN;
    let startY = doc.y + 8;

    // Draw header row
    doc.save();
    doc.rect(startX, startY, contentWidth, headerHeight)
        .fillColor(COLORS.tableHeaderBg)
        .fill();
    doc.restore();

    // Header text
    const headers = data[0];
    for (let c = 0; c < numCols; c++) {
        const cellX = startX + c * colWidth + cellPadding;
        const cellY = startY + 8;

        doc.font(FONTS.sansBold)
            .fontSize(9)
            .fillColor(COLORS.tableHeaderText)
            .text(headers[c] || '', cellX, cellY, {
                width: colWidth - cellPadding * 2,
                height: headerHeight - 16,
                lineBreak: false,
                ellipsis: true
            });
    }

    startY += headerHeight;

    // Draw data rows
    for (let r = 1; r < data.length; r++) {
        const row = data[r];

        // Alternating row background
        if (r % 2 === 0) {
            doc.save();
            doc.rect(startX, startY, contentWidth, rowHeight)
                .fillColor(COLORS.tableRowAlt)
                .fill();
            doc.restore();
        }

        // Cell text
        for (let c = 0; c < numCols; c++) {
            const cellX = startX + c * colWidth + cellPadding;
            const cellY = startY + 7;

            doc.font(FONTS.serif)
                .fontSize(9)
                .fillColor(COLORS.textPrimary)
                .text(row[c] || '', cellX, cellY, {
                    width: colWidth - cellPadding * 2,
                    height: rowHeight - 14,
                    lineBreak: false,
                    ellipsis: true
                });
        }

        startY += rowHeight;
    }

    // Table border
    doc.save();
    doc.rect(startX, doc.y + 8, contentWidth, startY - doc.y - 8)
        .strokeColor(COLORS.tableBorder)
        .lineWidth(0.5)
        .stroke();
    doc.restore();

    // Update cursor position
    doc.y = startY + 12;
    doc.x = CONFIG.MARGIN;
}

// ─── Block Renderer ──────────────────────────────────────────────

/**
 * Render a single parsed markdown block.
 */
function renderBlock(doc, block) {
    const fontFamily = getFontFamily(
        block.text || (block.items && block.items.join('')) || ''
    );

    switch (block.type) {
        case 'h1': {
            // H1 — large gold heading (skip if it's the main title — it's on the cover)
            ensureSpace(doc, 60);
            doc.moveDown(0.8);

            // Gold line above
            doc.save();
            doc.moveTo(CONFIG.MARGIN, doc.y)
                .lineTo(doc.page.width - CONFIG.MARGIN, doc.y)
                .strokeColor(COLORS.gold)
                .lineWidth(0.8)
                .stroke();
            doc.restore();

            doc.moveDown(0.5);

            doc.font(fontFamily.sansBold)
                .fontSize(22)
                .fillColor(COLORS.gold)
                .text(block.text, CONFIG.MARGIN, doc.y, {
                    width: doc.page.width - CONFIG.MARGIN * 2,
                    lineGap: 6
                });

            doc.moveDown(0.3);

            // Gold line below
            doc.save();
            doc.moveTo(CONFIG.MARGIN, doc.y)
                .lineTo(doc.page.width - CONFIG.MARGIN, doc.y)
                .strokeColor(COLORS.gold)
                .lineWidth(0.3)
                .stroke();
            doc.restore();

            doc.moveDown(0.6);
            break;
        }

        case 'h2': {
            ensureSpace(doc, 50);
            doc.moveDown(0.7);

            doc.font(fontFamily.sansBold)
                .fontSize(16)
                .fillColor(COLORS.gold)
                .text(block.text, CONFIG.MARGIN, doc.y, {
                    width: doc.page.width - CONFIG.MARGIN * 2,
                    lineGap: 4
                });

            // Subtle underline
            doc.save();
            doc.moveTo(CONFIG.MARGIN, doc.y + 3)
                .lineTo(CONFIG.MARGIN + 60, doc.y + 3)
                .strokeColor(COLORS.gold)
                .lineWidth(0.3)
                .stroke();
            doc.restore();

            doc.moveDown(0.5);
            break;
        }

        case 'h3': {
            ensureSpace(doc, 40);
            doc.moveDown(0.5);

            doc.font(fontFamily.sansBold)
                .fontSize(13)
                .fillColor(COLORS.textPrimary)
                .text(block.text, CONFIG.MARGIN, doc.y, {
                    width: doc.page.width - CONFIG.MARGIN * 2,
                    lineGap: 3
                });

            doc.moveDown(0.3);
            break;
        }

        case 'paragraph': {
            ensureSpace(doc, 30);
            doc.font(fontFamily.regular)
                .fontSize(11)
                .fillColor(COLORS.textPrimary);

            renderInlineText(doc, block.text, {
                width: doc.page.width - CONFIG.MARGIN * 2,
                lineGap: CONFIG.LINE_GAP
            });

            doc.moveDown(CONFIG.PARAGRAPH_GAP / 10);
            break;
        }

        case 'bullet': {
            ensureSpace(doc, 20 * Math.min(block.items.length, 3));
            doc.moveDown(0.2);

            for (const item of block.items) {
                ensureSpace(doc, 25);

                const bulletX = CONFIG.MARGIN + 8;
                const textX = CONFIG.MARGIN + 22;
                const textWidth = doc.page.width - CONFIG.MARGIN * 2 - 22;

                // Gold bullet dot
                doc.save();
                doc.circle(bulletX, doc.y + 6, 2.5)
                    .fillColor(COLORS.gold)
                    .fill();
                doc.restore();

                // Item text
                doc.font(fontFamily.regular)
                    .fontSize(11)
                    .fillColor(COLORS.textPrimary);

                renderInlineText(doc, item, {
                    width: textWidth,
                    lineGap: CONFIG.LINE_GAP
                });

                doc.moveDown(0.15);
            }

            doc.moveDown(0.3);
            break;
        }

        case 'numbered': {
            ensureSpace(doc, 20 * Math.min(block.items.length, 3));
            doc.moveDown(0.2);

            for (let i = 0; i < block.items.length; i++) {
                ensureSpace(doc, 25);

                const numX = CONFIG.MARGIN + 4;
                const textX = CONFIG.MARGIN + 24;
                const textWidth = doc.page.width - CONFIG.MARGIN * 2 - 24;

                // Gold number
                doc.font(fontFamily.sansBold)
                    .fontSize(11)
                    .fillColor(COLORS.gold)
                    .text(`${i + 1}.`, numX, doc.y, {
                        width: 16,
                        lineBreak: false
                    });

                // Item text
                doc.font(fontFamily.regular)
                    .fontSize(11)
                    .fillColor(COLORS.textPrimary);

                renderInlineText(doc, block.items[i], {
                    width: textWidth,
                    lineGap: CONFIG.LINE_GAP
                });

                doc.moveDown(0.15);
            }

            doc.moveDown(0.3);
            break;
        }

        case 'blockquote': {
            ensureSpace(doc, 40);
            doc.moveDown(0.3);

            const bqX = CONFIG.MARGIN;
            const bqWidth = doc.page.width - CONFIG.MARGIN * 2;
            const bqStartY = doc.y;

            // Measure text height first
            const textHeight = doc.heightOfString(block.text, {
                width: bqWidth - 30,
                lineGap: CONFIG.LINE_GAP
            });

            const bqHeight = textHeight + 20;

            // Background
            doc.save();
            doc.rect(bqX, bqStartY, bqWidth, bqHeight)
                .fillColor(COLORS.blockquoteBg)
                .fill();
            doc.restore();

            // Left gold border
            doc.save();
            doc.rect(bqX, bqStartY, 3, bqHeight)
                .fillColor(COLORS.blockquoteBorder)
                .fill();
            doc.restore();

            // Text
            doc.font(fontFamily.italic)
                .fontSize(11)
                .fillColor(COLORS.textSecondary)
                .text(block.text, bqX + 18, bqStartY + 10, {
                    width: bqWidth - 30,
                    lineGap: CONFIG.LINE_GAP
                });

            doc.y = bqStartY + bqHeight + 8;
            doc.x = CONFIG.MARGIN;
            break;
        }

        case 'hr': {
            ensureSpace(doc, 30);
            doc.moveDown(0.5);

            const midX = doc.page.width / 2;

            doc.save();
            doc.moveTo(CONFIG.MARGIN, doc.y)
                .lineTo(midX - 15, doc.y)
                .strokeColor(COLORS.hrLine)
                .lineWidth(0.5)
                .stroke();
            doc.moveTo(midX + 15, doc.y)
                .lineTo(doc.page.width - CONFIG.MARGIN, doc.y)
                .strokeColor(COLORS.hrLine)
                .lineWidth(0.5)
                .stroke();
            doc.restore();

            // Small diamond
            doc.font(FONTS.sans)
                .fontSize(7)
                .fillColor(COLORS.gold)
                .text('◆', midX - 4, doc.y - 5, { lineBreak: false });

            doc.moveDown(0.8);
            break;
        }

        case 'table': {
            renderTable(doc, block);
            break;
        }

        default: {
            // Unknown block type — render as plain text
            if (block.text) {
                doc.font(fontFamily.regular)
                    .fontSize(11)
                    .fillColor(COLORS.textPrimary)
                    .text(block.text, CONFIG.MARGIN, doc.y, {
                        width: doc.page.width - CONFIG.MARGIN * 2,
                        lineGap: CONFIG.LINE_GAP
                    });
                doc.moveDown(0.3);
            }
        }
    }
}

// ─── Footer / Page Number Renderer ───────────────────────────────

/**
 * Add page numbers and footer accent to all pages after the cover.
 * Uses bufferedPages for random page access.
 */
function renderFooters(doc) {
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        // Skip cover page (page 0)
        if (i === 0) continue;

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const pageNum = i; // Page number (1-indexed for display)

        // Footer gold line
        doc.save();
        doc.moveTo(CONFIG.MARGIN, pageHeight - CONFIG.FOOTER_MARGIN - 10)
            .lineTo(pageWidth - CONFIG.MARGIN, pageHeight - CONFIG.FOOTER_MARGIN - 10)
            .strokeColor(COLORS.gold)
            .lineWidth(0.3)
            .stroke();
        doc.restore();

        // Page number — centered
        doc.font(FONTS.sans)
            .fontSize(8)
            .fillColor(COLORS.textMuted)
            .text(
                `— ${pageNum} —`,
                CONFIG.MARGIN,
                pageHeight - CONFIG.FOOTER_MARGIN,
                {
                    width: pageWidth - CONFIG.MARGIN * 2,
                    align: 'center',
                    lineBreak: false
                }
            );

        // Brand — left side
        doc.font(FONTS.sans)
            .fontSize(7)
            .fillColor(COLORS.textMuted)
            .text(
                'Celestial Insights',
                CONFIG.MARGIN,
                pageHeight - CONFIG.FOOTER_MARGIN,
                {
                    lineBreak: false
                }
            );
    }
}

// ─── Main Exported Function ───────────────────────────────────────

/**
 * Generate a premium PDF from a markdown astrology report.
 *
 * @param {string} report - Markdown content of the astrology report
 * @param {string} userName - Name of the report recipient
 * @returns {Promise<string>} - Absolute file path of the generated PDF
 */
async function generatePDF(report, userName) {
    // ── Input validation ──────────────────────────────────────
    if (!report || typeof report !== 'string') {
        throw new Error('generatePDF: report must be a non-empty string');
    }

    if (!userName || typeof userName !== 'string') {
        throw new Error('generatePDF: userName must be a non-empty string');
    }

    if (report.trim().length === 0) {
        throw new Error('generatePDF: report content is empty');
    }

    // ── Ensure reports directory exists ───────────────────────
    ensureDirectory(CONFIG.REPORTS_DIR);

    // ── Generate file path ────────────────────────────────────
    const timestamp = Date.now();
    const safeName = sanitizeFileName(userName);
    const fileName = `Celestial_Insights_${safeName}_${timestamp}.pdf`;
    const filePath = path.join(CONFIG.REPORTS_DIR, fileName);

    // ── Create PDF document ───────────────────────────────────
    const doc = new PDFDocument({
        size: CONFIG.PAGE_SIZE,
        margins: {
            top: CONFIG.CONTENT_TOP,
            bottom: CONFIG.CONTENT_BOTTOM + CONFIG.FOOTER_MARGIN,
            left: CONFIG.MARGIN,
            right: CONFIG.MARGIN
        },
        bufferPages: true,
        info: {
            Title: `Celestial Insights — Astrology Report for ${userName}`,
            Author: 'Celestial Insights',
            Subject: 'Premium Vedic Astrology Report',
            Creator: 'Celestial Insights AI Engine',
            Producer: 'Celestial Insights',
            CreationDate: new Date()
        }
    });

    // ── Load custom fonts ─────────────────────────────────────
    loadCustomFonts(doc);

    // ── Create write stream ───────────────────────────────────
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ── Render Cover Page ─────────────────────────────────────
    renderCoverPage(doc, userName);

    // ── Add first content page ────────────────────────────────
    doc.addPage();
    renderPageAccent(doc);

    // ── Parse and render report content ───────────────────────
    const blocks = parseMarkdown(report);

    for (const block of blocks) {
        // Skip the first H1 — it's already on the cover page
        if (block.type === 'h1' && blocks.indexOf(block) === 0) {
            continue;
        }

        renderBlock(doc, block);
    }

    // ── Add page numbers and footers ──────────────────────────
    renderFooters(doc);

    // ── Finalize PDF ──────────────────────────────────────────
    doc.end();

    // ── Wait for write stream to finish ───────────────────────
    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            const absolutePath = path.resolve(filePath);
            console.log(`[pdf.js] PDF generated: ${absolutePath}`);
            resolve(absolutePath);
        });

        stream.on('error', (err) => {
            console.error('[pdf.js] PDF write error:', err);
            reject(new Error(`generatePDF: Failed to write PDF — ${err.message}`));
        });
    });
}

// ─── Export ───────────────────────────────────────────────────────
module.exports = { generatePDF };