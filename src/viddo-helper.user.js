// ==UserScript==
// @name         viddo-helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  fill forms and stuff
// @author       szkrd
// @match        http://viddo.test:4000/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    const $ = window.jQuery;
    const css = `
#monkey-menu { width: 15px; height: 15px; position: fixed; z-index: 9999; border-radius: 10px; background: rgba(255,255,255,.2); opacity: .5; top: 3px; left: 3px; overflow: hidden; border: 1px solid gray; transition: all .2s linear; }
#monkey-menu:hover { width: auto; height: auto; opacity: 1; border-radius: 0; background: orange; }
#monkey-menu:hover div { display: block; }
#monkey-menu div { font-weight: bold; cursor: pointer; padding: 2px 5px; display: none; }
#monkey-menu div:hover { text-decoration: underline; }
`;
    GM_addStyle(css.replace(/\/\/ .*/g, ''));

    const moMenu = $('<div id="monkey-menu"></div>');
    moMenu.prependTo(document.body);

    function addMenuItem (title, action, flush) {
        if (flush) {
            moMenu.html('');
        }
        const menuItem = $(`<div>${title}</div>`);
        if (action) {
            menuItem.on('click', action);
        }
        menuItem.appendTo(moMenu);
    }

    function fillInput (el, value) {
        el = $(el).get(0);
        if (!el) {
            return console.error('El not found', el);
        }
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    let lastPath = '';
    function updateMenu () {
        const pathName = window.location.pathname;
        if (lastPath === pathName) {
            return;
        }
        lastPath = pathName;
        addMenuItem('logout', () => { window.location.href = '/logout'; }, true);
        if (pathName === '/') {
            const login = (username, password, noSubmit) => {
                fillInput($('.input.input--text:eq(0) input[type=text]'), username);
                fillInput($('.input.input--text:eq(1) input[type=password]'), password || '123456');
                if (!noSubmit) {
                    $('.button.button--orange:eq(0)').click();
                }
            };
            addMenuItem('login moderator', () => { login('moderatoruser'); });
            addMenuItem('login uploader', () => { login('uploaderuser'); });
            addMenuItem('login finance', () => { login('financeuser'); });
            addMenuItem('login exporter', () => { login('exporteruser'); });
            addMenuItem('login admin', () => { login('adminuser'); });
        }
        if (pathName === '/registration') {
            const reg = (username) => {
                fillInput('input:eq(0)', username + '+test@viddo.com');
                fillInput('input:eq(1)', username);
                fillInput('input:eq(2)', '123456');
                $('.radio-input__control--checkbox:eq(0)').click();
            };
            addMenuItem('reg alma', () => { reg('alma'); });
            addMenuItem('reg korte', () => { reg('korte'); });
            addMenuItem('reg eper', () => { reg('eper'); });
            addMenuItem('reg dinnye', () => { reg('dinnye'); });
        }
    }

    // ---

    moMenu.on('mouseenter', updateMenu);
})();
