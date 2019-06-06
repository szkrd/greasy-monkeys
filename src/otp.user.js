// ==UserScript==
// @name         OTP
// @namespace    http://szabolcs.kurdi.space/
// @version      1.0.0
// @description  helps with the approval flow
// @author       szkrd
// @match        https://www.otpbank.hu/*
// @match        https://www.otpbankdirekt.hu/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';

    // well, I'm not a great fan of Selenium.., and in case anyone had doubts,
    // the OTP site's code is utter garbage, so retaining _some_ interactivity is a must

    const $ = window.jQuery;
    const _$ = (id) => document.getElementById(id);

    // ---

    const css = `
#monkey-bar { position: fixed; top: 5px; right: 0; z-index: 999; }
#monkey-bar li { display: block; float: right; padding: 3px 6px 3px 3px; border-radius: 4px; background: silver; margin: 0 5px; cursor: pointer; box-shadow: 2px 2px 4px rgba(0,0,0,.5); transition: all .2s ease-out; }
#monkey-bar li:hover { background: cyan; }
#monkey-bar li b { display: inline-block; font-size: 11px; border-radius: 50%; background: #eee; width: 16px; text-align: center; }
#monkey-bar li:hover b { box-shadow: 0 0 4px inset rgba(0,0,0,.2); }
#monkey-log { position: fixed; top: 35px; right: 0; padding: 1px; border: 0; width: 200px; height: 92px; font-size: 10px; font-family: arial; background: rgba(255,255,255,0.5); opacity: .5; text-align: right; pointer-events: none; }
`;
    GM_addStyle(css.replace(/\/\/ .*/g, ''));

    // ---

    // top right corner, holds the action buttons
    const toolbar = $('<ul id="monkey-bar"></ul>');

    // primitive log area (because the console is filled with crap)
    const logBox = $('<textarea id="monkey-log"></textarea>');
    const log = s => logBox.val(s + '\n' + logBox.val());

    // so secret, very cypher
    const rot13 = s => s.replace(/[a-zA-Z]/g, (c) => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));

    // wait for element (by raw id ) or a callback (truthy value)
    function waitFor (idOrFn, cb) {
        let ping = setInterval(() => {
            const el = typeof idOrFn === 'string' ? _$(idOrFn) : idOrFn();
            if (!el) {
                return;
            }
            clearInterval(ping);
            ping = null;
            cb(el);
        }, 1000);
    }

    // filling react inputs is a bit tricky
    function reactFillInput (el, value) {
        el = $(el).get(0);
        if (!el) {
            return console.error('El not found', el);
        }
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ---

    function logout () {
        $('#toolbar .quit > a').get(0).click();
    }

    // pre login: allow filling the input fields from locally stored values
    function setupLogin () {
        let btn = $('<li>🔑 login</li>');
        btn.on('click', () => {
            const secret = JSON.parse(localStorage.getItem('_secret')) || { userId: '123', accountId: '123', password: '123' };
            reactFillInput('#hb_identifier', secret.userId);
            reactFillInput('#hb_account_number', secret.accountId);
            reactFillInput('#hb_password', rot13(secret.password));
            $('#netbank-login-send-button').focus().click();
        });
        toolbar.append(btn);

        btn = $('<li>💾 store secret</li>');
        btn.on('click', () => {
            const userId = $('#hb_identifier').val();
            const accountId = $('#hb_account_number').val();
            const password = $('#hb_password').val();
            const data = { userId, accountId, password: rot13(password) };
            localStorage.setItem('_secret', JSON.stringify(data));
        });
        toolbar.append(btn);
    }

    // right after login
    function setupLoggedIn () {
        const btn = $('<li><b>1</b> tranzakciok lekerdezese</li>');
        btn.on('click', () => {
            $('li[id$=TRANZAKCIOK_ELLENORZESE]').find('a').get(0).click();
        });
        toolbar.append(btn);
    }

    // list of transactions, checkboxes, export to excel, submit
    function setupTransactionOverview () {
        log('waiting for info table');
        waitFor(() => $('#result_view').text().trim(), (txt) => {
            const btn = $('<li><b>2</b> alairasra var</li>');
            btn.on('click', () => {
                _$('alairas_view').click(); // not sure why jq failed here
            });
            toolbar.append(btn);
        });

        log('long waiting for data table');
        waitFor('tranzakcio_simple', (el) => {
            $(el).find('input[type=checkbox]').prop('checked', true);
            log('⚠️ export to excel clicked, waiting 5secs');
            $('#exportForm input').eq(0).click();

            setTimeout(() => {
                log('click sign');
                _$('btnAlairas').click();
            }, 5000);
        });
    }

    // final approve step (and transaction finished page)
    function setupApproveTransaction () {
        const btn1 = $('<li><b>3</b> jovahagy</li>');
        btn1.on('click', () => {
            _$('submit:rendben').click();
        });
        toolbar.append(btn1);

        waitFor(() => $('.feedback .success').length, () => {
            btn1.hide();
            const btn2 = $('<li><b>4</b> kilép</li>');
            btn2.on('click', logout);
            toolbar.append(btn2);
        });
    }

    // ===

    setTimeout(() => {
        toolbar.appendTo(document.body);
        logBox.appendTo(document.body);
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        if (path.includes('direkt/belepes')) {
            log('🚐 path: direkt-belepes');
            setupLogin();
        }
        if (path.includes('bankszamla/bankszamlamuvelet') || path.includes('/hb2/menuaccess')) {
            log('path: logged-in');
            setupLoggedIn();
        }
        if (search.includes('conversationname=tranzakciokellenorzese')) {
            log('🚐 path: tranzakciok-ellenorzese');
            setupTransactionOverview();
        }
        if (path.includes('bankszamla/tobbesalairas')) {
            log('🚐 path: tobbes-alairas');
            setupApproveTransaction();
        }
    }, 2000);
})();
