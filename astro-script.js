/**
 * Celestial Insights — Frontend Application
 * Vanilla JS · No frameworks · No jQuery
 */
(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════════════
       CONFIGURATION
       ═══════════════════════════════════════════════════════════ */
    var API = 'http://localhost:3000';

    var REPORT_PRICES = {
        basic: 4900,
        premium: 9900,
        deluxe: 12900,
        complete: 19900
    };

    var REPORT_DISPLAY = {
        basic: 49,
        premium: 99,
        deluxe: 129,
        complete: 199
    };

    var REPORT_LABELS = {
        basic: 'Basic Astrology Report',
        premium: 'Premium Astrology Report',
        deluxe: 'Deluxe Astrology Report',
        complete: 'Complete AI Astrology Report'
    };

    var MAX_LOADING_MS = 2000;

    /* ═══════════════════════════════════════════════════════════
       STATE
       ═══════════════════════════════════════════════════════════ */
    var state = {
        step: 1,
        selectedReport: null,
        generatedReport: null,
        isProcessing: false,
        initDone: false
    };

    /* ═══════════════════════════════════════════════════════════
       DOM HELPERS
       ═══════════════════════════════════════════════════════════ */
    function $(id) { return document.getElementById(id); }
    function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

    /* ═══════════════════════════════════════════════════════════
       LOADING SCREEN  (initial page loader — max 2 s)
       ═══════════════════════════════════════════════════════════ */
    var safetyTimer = setTimeout(function () {
        if (!state.initDone) hideLoadingScreen();
    }, MAX_LOADING_MS);

    function hideLoadingScreen() {
        var el = $('loading-screen');
        if (!el) return;
        el.classList.add('hidden');
        setTimeout(function () { el.style.display = 'none'; }, 700);
    }

    /* ═══════════════════════════════════════════════════════════
       LOADING OVERLAY  (report generation)
       ═══════════════════════════════════════════════════════════ */
    function showOverlay(msg, sub) {
        var ov = $('loading-overlay');
        if (ov) ov.classList.add('visible');
        var m = $('overlay-msg'); if (m) m.textContent = msg || 'Generating Your Report';
        var s = $('overlay-sub'); if (s) s.textContent = sub || 'Please wait...';
        document.body.style.overflow = 'hidden';
    }

    function updateOverlay(msg, sub) {
        var m = $('overlay-msg'); if (m && msg) m.textContent = msg;
        var s = $('overlay-sub'); if (s && sub) s.textContent = sub;
    }

    function hideOverlay() {
        var ov = $('loading-overlay');
        if (ov) ov.classList.remove('visible');
        document.body.style.overflow = '';
    }

    /* ═══════════════════════════════════════════════════════════
       TOAST
       ═══════════════════════════════════════════════════════════ */
    function toast(message, type) {
        type = type || 'info';
        var c = $('toast-container');
        if (!c) return;
        var icons = { error: 'fa-circle-exclamation', success: 'fa-circle-check', info: 'fa-circle-info' };
        var t = document.createElement('div');
        t.className = 'toast toast-' + type;
        t.innerHTML = '<i class="fa-solid ' + (icons[type] || icons.info) + '"></i> ' + escapeHtml(message);
        c.appendChild(t);
        setTimeout(function () {
            t.style.opacity = '0'; t.style.transform = 'translateX(50%)';
            setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
        }, 4000);
    }

    function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    /* ═══════════════════════════════════════════════════════════
       FORM NAVIGATION
       ═══════════════════════════════════════════════════════════ */
    function goToStep(n) {
        state.step = n;
        $$('.form-step').forEach(function (s) { s.classList.remove('active'); });
        var target = $('step-' + n);
        if (target) target.classList.add('active');

        $$('.progress-step').forEach(function (ps) {
            var s = parseInt(ps.getAttribute('data-step'));
            ps.classList.remove('active', 'completed');
            if (s < n) ps.classList.add('completed');
            if (s === n) ps.classList.add('active');
        });

        $$('.progress-line').forEach(function (pl, i) {
            pl.classList.toggle('active', i < n - 1);
        });

        var back = $('btn-back');
        var cont = $('btn-continue');
        var gen = $('btn-generate');

        if (back) back.classList.toggle('visible', n > 1);
        if (cont) cont.classList.toggle('hidden', n === 3);
        if (gen) gen.classList.toggle('visible', n === 3);
    }

    /* ═══════════════════════════════════════════════════════════
       VALIDATION
       ═══════════════════════════════════════════════════════════ */
    function clearErrors() {
        $$('.field-error').forEach(function (e) { e.classList.remove('visible'); });
        $$('.field-input').forEach(function (i) { i.classList.remove('error'); });
        $$('.gender-pill input').forEach(function (i) { i.classList.remove('error'); });
    }

    function showFieldError(inputId, errorId, msg) {
        var inp = $(inputId);
        var err = $(errorId);
        if (inp) inp.classList.add('error');
        if (err) { if (msg) err.textContent = msg; err.classList.add('visible'); }
    }

    function validateStep1() {
        clearErrors();
        var ok = true;
        var firstError = null;

        var name = $('fullName');
        if (!name || !name.value.trim() || name.value.trim().length < 2) {
            showFieldError('fullName', 'fullNameError', 'Please enter your full name (at least 2 characters)');
            if (!firstError) firstError = name;
            ok = false;
        }

        var gender = document.querySelector('input[name="gender"]:checked');
        if (!gender) {
            var ge = $('genderError');
            if (ge) ge.classList.add('visible');
            $$('.gender-pill input').forEach(function (i) { i.classList.add('error'); });
            if (!firstError) firstError = $('gender');
            ok = false;
        }

        var dob = $('dob');
        if (!dob || !dob.value) {
            showFieldError('dob', 'dobError', 'Please enter your date of birth');
            if (!firstError) firstError = dob;
            ok = false;
        } else if (new Date(dob.value) > new Date()) {
            showFieldError('dob', 'dobError', 'Date cannot be in the future');
            if (!firstError) firstError = dob;
            ok = false;
        }

        var tob = $('tob');
        if (!tob || !tob.value) {
            showFieldError('tob', 'tobError', 'Please enter your time of birth');
            if (!firstError) firstError = tob;
            ok = false;
        }

        var bp = $('birthPlace');
        if (!bp || !bp.value.trim() || bp.value.trim().length < 2) {
            showFieldError('birthPlace', 'birthPlaceError', 'Please enter your birth place');
            if (!firstError) firstError = bp;
            ok = false;
        }

        var lang = $('language');
        if (!lang || !lang.value) {
            showFieldError('language', 'languageError', 'Please select a language');
            if (!firstError) firstError = lang;
            ok = false;
        }

        if (!ok && firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            toast('Please fill in all required fields', 'error');
        }
        return ok;
    }

    function validateStep2() {
        clearErrors();
        var checked = document.querySelector('input[name="reportType"]:checked');
        if (!checked) {
            var e = $('reportTypeError');
            if (e) e.classList.add('visible');
            toast('Please select a report type', 'error');
            var grid = $('report-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
        return true;
    }

    /* ═══════════════════════════════════════════════════════════
       READ FORM DATA
       ═══════════════════════════════════════════════════════════ */
    function readData() {
        var g = document.querySelector('input[name="gender"]:checked');
        var r = document.querySelector('input[name="reportType"]:checked');
        return {
            name: $('fullName') ? $('fullName').value.trim() : '',
            gender: g ? g.value : '',
            dob: $('dob') ? $('dob').value : '',
            tob: $('tob') ? $('tob').value : '',
            birthPlace: $('birthPlace') ? $('birthPlace').value.trim() : '',
            language: $('language') ? $('language').value : '',
            reportType: r ? r.value : ''
        };
    }

    /* ═══════════════════════════════════════════════════════════
       REVIEW POPULATION
       ═══════════════════════════════════════════════════════════ */
    function populateReview() {
        var d = readData();
        var fDate = d.dob;
        try { fDate = new Date(d.dob + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { /* keep raw */ }
        var fTime = d.tob;
        try { var h = parseInt(d.tob.split(':')[0]); var ampm = h >= 12 ? 'PM' : 'AM'; fTime = (h % 12 || 12) + ':' + d.tob.split(':')[1] + ' ' + ampm; } catch (e) { /* keep raw */ }

        var rows = [
            { k: 'Full Name', v: d.name },
            { k: 'Gender', v: d.gender },
            { k: 'Date of Birth', v: fDate },
            { k: 'Time of Birth', v: fTime },
            { k: 'Birth Place', v: d.birthPlace },
            { k: 'Language', v: d.language },
            { k: 'Report Type', v: REPORT_LABELS[d.reportType] || d.reportType }
        ];

        var rc = $('review-card');
        if (rc) {
            rc.innerHTML = rows.map(function (r) {
                return '<div class="review-row"><div class="review-key">' + r.k + '</div><div class="review-value">' + escapeHtml(r.v) + '</div></div>';
            }).join('');
        }

        var tp = $('review-total-price');
        if (tp) tp.innerHTML = '&#8377;' + (REPORT_DISPLAY[d.reportType] || 0);
    }

    /* ═══════════════════════════════════════════════════════════
       PAYMENT FLOW
       ═══════════════════════════════════════════════════════════ */
    async function createOrder(data) {
        var amount = REPORT_PRICES[data.reportType];
        if (!amount) throw new Error('Invalid report type');

        var res = await fetch(API + '/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount, currency: 'INR', reportType: data.reportType })
        });

        if (!res.ok) {
            var e = null; try { e = await res.json(); } catch (x) { /* */ }
            throw new Error((e && e.error) ? e.error : 'Failed to create order (HTTP ' + res.status + ')');
        }
        var o = await res.json();
        if (!o || !o.id) throw new Error('Invalid order response');
        return o;
    }

    function openRazorpay(order, data) {
        return new Promise(function (resolve, reject) {
            if (typeof Razorpay === 'undefined') {
                reject(new Error('Razorpay not loaded. Refresh and try again.'));
                return;
            }
            var opts = {
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                name: 'Celestial Insights',
                description: REPORT_LABELS[data.reportType] || 'Astrology Report',
                order_id: order.id,
                theme: { color: '#D4AF37' },
                prefill: { name: data.name },
                handler: function (r) { resolve(r); },
                modal: { ondismiss: function () { reject(new Error('Payment cancelled')); } }
            };
            var rzp = new Razorpay(opts);
            rzp.on('payment.failed', function (r) {
                reject(new Error('Payment failed: ' + (r.error && r.error.description ? r.error.description : 'Unknown error')));
            });
            rzp.open();
        });
    }

    async function verifyPayment(payRes, data) {
        var res = await fetch(API + '/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_order_id: payRes.razorpay_order_id,
                razorpay_payment_id: payRes.razorpay_payment_id,
                razorpay_signature: payRes.razorpay_signature,
                userDetails: data
            })
        });
        if (!res.ok) {
            var e = null; try { e = await res.json(); } catch (x) { /* */ }
            throw new Error((e && e.error) ? e.error : 'Verification failed (HTTP ' + res.status + ')');
        }
        var v = await res.json();
        if (!v || !v.verified) throw new Error('Payment could not be verified');
        return v;
    }

    async function generateReport(orderId, data) {
        var res = await fetch(API + '/api/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderId, userDetails: data })
        });
        if (!res.ok) {
            var e = null; try { e = await res.json(); } catch (x) { /* */ }
            throw new Error((e && e.error) ? e.error : 'Report generation failed (HTTP ' + res.status + ')');
        }
        var r = await res.json();
        if (!r || !r.report) throw new Error('Empty report returned');
        return r.report;
    }

    /* ═══════════════════════════════════════════════════════════
       MAIN GENERATE FLOW
       ═══════════════════════════════════════════════════════════ */
    async function handleGenerate() {
        if (state.isProcessing) return;
        var data = readData();
        if (!validateStep1() || !validateStep2()) return;

        state.isProcessing = true;

        try {
            showOverlay('Preparing Payment', 'Connecting to secure gateway...');
            var order = await createOrder(data);

            hideOverlay();
            var payRes;
            try { payRes = await openRazorpay(order, data); }
            catch (pe) { hideOverlay(); toast(pe.message, 'error'); state.isProcessing = false; return; }

            showOverlay('Verifying Payment', 'Securing your transaction...');
            var verify = await verifyPayment(payRes, data);

            updateOverlay('Generating Report', 'Calculating planetary positions...');
            await delay(1200);
            updateOverlay('Generating Report', 'Interpreting celestial alignments...');

            var report = await generateReport(verify.orderId, data);

            updateOverlay('Generating Report', 'Crafting your document...');
            await delay(800);

            state.generatedReport = report;
            hideOverlay();
            displayReport(report);
            toast('Your cosmic report is ready!', 'success');

        } catch (err) {
            hideOverlay();
            toast(err.message || 'An unexpected error occurred', 'error');
        } finally {
            state.isProcessing = false;
        }
    }

    function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* ═══════════════════════════════════════════════════════════
       REPORT DISPLAY
       ═══════════════════════════════════════════════════════════ */
    function displayReport(md) {
        $('form-section').style.display = 'none';
        var rs = $('report-section');
        if (rs) { rs.style.display = 'block'; rs.classList.add('visible'); }

        var rc = $('report-content');
        if (rc) {
            var html = '';
            if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                try { html = marked.parse(md); } catch (e) { html = fallbackMarkdown(md); }
            } else {
                html = fallbackMarkdown(md);
            }
            rc.innerHTML = html;
        }

        rs.scrollIntoView({ behavior: 'smooth' });
    }

    function fallbackMarkdown(t) {
        if (!t) return '';
        var h = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
        h = h.replace(/`(.+?)`/g, '<code>$1</code>');
        h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
        h = h.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
        h = h.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        h = h.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
        h = h.replace(/^(-{3,}|\*{3,})$/gm, '<hr>');
        var lines = h.split('\n'); var out = [];
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i].trim();
            if (!l) { out.push(''); continue; }
            if (l.charAt(0) === '<') { out.push(l); continue; }
            out.push('<p>' + l + '</p>');
        }
        return out.join('\n');
    }

    /* ═══════════════════════════════════════════════════════════
       PDF DOWNLOAD
       ═══════════════════════════════════════════════════════════ */
    function downloadPDF() {
        if (!state.generatedReport) { toast('No report available', 'error'); return; }
        toast('Preparing PDF...', 'info');

        var rc = $('report-content');
        if (!rc) { toast('Report content not found', 'error'); return; }

        if (typeof html2pdf !== 'undefined') {
            var name = ($('fullName') ? $('fullName').value.trim() : 'Celestial').replace(/\s+/g, '_');
            var type = REPORT_LABELS[state.selectedReport] || 'Report';
            html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: name + '_' + type.replace(/\s+/g, '_') + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            }).from(rc).save().then(function () {
                toast('PDF downloaded', 'success');
            }).catch(function () {
                toast('PDF failed, trying print...', 'info');
                window.print();
            });
        } else {
            window.print();
        }
    }

    /* ═══════════════════════════════════════════════════════════
       NEW REPORT
       ═══════════════════════════════════════════════════════════ */
    function resetAll() {
        state.step = 1; state.selectedReport = null;
        state.generatedReport = null; state.isProcessing = false;

        $('form-section').style.display = '';
        var rs = $('report-section');
        if (rs) { rs.style.display = 'none'; rs.classList.remove('visible'); }

        var rc = $('report-content'); if (rc) rc.innerHTML = '';
        var form = $('report-form'); if (form) form.reset();

        $$('.report-card').forEach(function (c) { c.classList.remove('selected'); });
        goToStep(1);
        clearErrors();
        $('form-section').scrollIntoView({ behavior: 'smooth' });
    }

    /* ═══════════════════════════════════════════════════════════
       BUTTON HANDLERS
       ═══════════════════════════════════════════════════════════ */
    function onContinue() {
        if (state.step === 1) { if (!validateStep1()) return; }
        if (state.step === 2) { if (!validateStep2()) return; populateReview(); }
        if (state.step < 3) goToStep(state.step + 1);
    }

    function onBack() {
        if (state.step > 1) goToStep(state.step - 1);
    }

    function onGenerate() {
        handleGenerate();
    }

    /* ═══════════════════════════════════════════════════════════
       REPORT TYPE CARDS
       ═══════════════════════════════════════════════════════════ */
    function initReportCards() {
        $$('.report-card').forEach(function (card) {
            card.addEventListener('click', function () {
                $$('.report-card').forEach(function (c) { c.classList.remove('selected'); });
                card.classList.add('selected');
                var radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
                state.selectedReport = radio ? radio.value : '';
                var e = $('reportTypeError');
                if (e) e.classList.remove('visible');
            });
        });
    }

    /* ═══════════════════════════════════════════════════════════
       AUTO-CLEAR ERRORS ON INPUT
       ═══════════════════════════════════════════════════════════ */
    function initAutoClear() {
        $$('.field-input').forEach(function (inp) {
            inp.addEventListener('input', function () {
                inp.classList.remove('error');
                var err = inp.parentElement.querySelector('.field-error');
                if (err) err.classList.remove('visible');
            });
        });
        $$('input[name="gender"]').forEach(function (r) {
            r.addEventListener('change', function () {
                $$('.gender-pill input').forEach(function (i) { i.classList.remove('error'); });
                var e = $('genderError'); if (e) e.classList.remove('visible');
            });
        });
        $$('input[name="reportType"]').forEach(function (r) {
            r.addEventListener('change', function () {
                var e = $('reportTypeError'); if (e) e.classList.remove('visible');
            });
        });
    }

    /* ═══════════════════════════════════════════════════════════
       INIT
       ═══════════════════════════════════════════════════════════ */
    function init() {
        try {
            goToStep(1);
            initReportCards();
            initAutoClear();

            $('btn-continue').addEventListener('click', onContinue);
            $('btn-back').addEventListener('click', onBack);
            $('btn-generate').addEventListener('click', onGenerate);
            $('btn-download-pdf').addEventListener('click', downloadPDF);
            $('btn-print').addEventListener('click', function () { window.print(); });
            $('btn-new-report').addEventListener('click', resetAll);

            var dob = $('dob');
            if (dob) dob.setAttribute('max', new Date().toISOString().split('T')[0]);

            $$('[data-scroll]').forEach(function (el) {
                el.addEventListener('click', function (e) {
                    e.preventDefault();
                    var target = $(el.getAttribute('data-scroll'));
                    if (target) target.scrollIntoView({ behavior: 'smooth' });
                });
            });

            window.addEventListener('scroll', function () {
                var nav = $('main-nav');
                if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
            });

            var rs = $('report-section');
            if (rs) rs.style.display = 'none';

            state.initDone = true;
            clearTimeout(safetyTimer);
            hideLoadingScreen();

        } catch (err) {
            console.error('[Celestial Insights] Init error:', err);
            state.initDone = true;
            clearTimeout(safetyTimer);
            hideLoadingScreen();
            toast('Initialization error. Please refresh.', 'error');
        }
    }

    /* ═══════════════════════════════════════════════════════════
       DOM READY
       ═══════════════════════════════════════════════════════════ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ═══════════════════════════════════════════════════════════
       GLOBAL ERROR GUARDS
       ═══════════════════════════════════════════════════════════ */
    window.addEventListener('error', function () {
        if (!state.initDone) { state.initDone = true; clearTimeout(safetyTimer); hideLoadingScreen(); }
    });

    window.addEventListener('unhandledrejection', function (ev) {
        if (!state.initDone) { state.initDone = true; clearTimeout(safetyTimer); hideLoadingScreen(); }
        hideOverlay(); state.isProcessing = false;
        if (ev.reason && ev.reason.message) toast(ev.reason.message, 'error');
    });

})();