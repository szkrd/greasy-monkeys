// ==UserScript==
// @name         Viddo-helper
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
#monkey-menu:hover { width: auto; height: auto; opacity: 1; border-radius: 2px; background: orange; box-shadow: 2px 2px 2px rgba(0, 0, 0, .3); }
#monkey-menu:hover li { display: block; }
#monkey-menu li { font-weight: bold; cursor: pointer; padding: 2px 5px; display: none; }
#monkey-menu li.action:hover { text-decoration: underline; }
`;
    GM_addStyle(css.replace(/\/\/ .*/g, ''));

    function fillInput (el, value) {
        el = $(el).get(0);
        if (!el) {
            return console.error('El not found', el);
        }
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function addMenuItem (target, title, action, flush) {
        if (flush) {
            target.html('');
        }
        const menuItem = $(`<li>${title}</li>`);
        if (action) {
            menuItem.on('click', action);
            menuItem.addClass('action');
        }
        menuItem.appendTo(target);
    }

    let lastPath = '';
    function updatePathMenu () {
        const pathName = window.location.pathname;
        if (lastPath === pathName) {
            return;
        }
        lastPath = pathName;
        const pathList = $('#monkey-menu-path');
        pathList.html('');
        if (pathName === '/') {
            const login = (username, password, noSubmit) => {
                fillInput($('.input.input--text:eq(0) input[type=text]'), username);
                fillInput($('.input.input--text:eq(1) input[type=password]'), password || '123456');
                if (!noSubmit) {
                    $('.button.button--orange:eq(0)').click();
                }
            };
            addMenuItem(pathList, 'login moderator', () => { login('moderatoruser'); });
            addMenuItem(pathList, 'login uploader', () => { login('uploaderuser'); });
            addMenuItem(pathList, 'login finance', () => { login('financeuser'); });
            addMenuItem(pathList, 'login exporter', () => { login('exporteruser'); });
            addMenuItem(pathList, 'login admin', () => { login('adminuser'); });
        }
        if (pathName === '/registration') {
            const reg = (username) => {
                fillInput('input:eq(0)', username + '+test@viddo.com');
                fillInput('input:eq(1)', username);
                fillInput('input:eq(2)', '123456');
                $('.radio-input__control--checkbox:eq(0)').click();
            };
            addMenuItem(pathList, 'reg alma', () => { reg('alma'); });
            addMenuItem(pathList, 'reg korte', () => { reg('korte'); });
            addMenuItem(pathList, 'reg eper', () => { reg('eper'); });
            addMenuItem(pathList, 'reg dinnye', () => { reg('dinnye'); });
        }
    }

    function createMenu () {
        const moMenu = $('<div id="monkey-menu"><ul id="monkey-menu-path"></ul><ul id="monkey-menu-static"></ul></div>');
        moMenu.prependTo(document.body);
        return moMenu;
    }

    function addStorageSwitcherMenuItem (target, name, value) {
        const key = `_${name}`;
        const action = () => {
            const thisMenuItem = $(`#monkey-menu-switcher-${name}`);
            const current = localStorage.getItem(key);
            if (current) {
                thisMenuItem.text(thisMenuItem.text().replace('☑', '☐'));
                localStorage.removeItem(key);
            } else {
                thisMenuItem.text(thisMenuItem.text().replace('☐', '☑'));
                localStorage.setItem(key, value);
            }
        };
        const current = localStorage.getItem(key);
        const title = (current ? '☑' : '☐') + ` ls ${name}`;
        const menuItem = $(`<li id="monkey-menu-switcher-${name}">${title}</li>`);
        menuItem.on('click', action);
        menuItem.addClass('action');
        menuItem.appendTo(target);
        return menuItem;
    }

    // ---

    (() => {
        const menu = createMenu();
        const staticList = $('#monkey-menu-static');
        addMenuItem(staticList, 'logout', () => { window.location.href = '/logout'; });
        addStorageSwitcherMenuItem(staticList, 'logRedux', '1');
        addStorageSwitcherMenuItem(staticList, 'logHlsjs', '1');
        addStorageSwitcherMenuItem(staticList, 'logAxios', '1');
        addStorageSwitcherMenuItem(staticList, 'logSocketio', '1');
        addStorageSwitcherMenuItem(staticList, 'logTimeStamp', '1');
        addStorageSwitcherMenuItem(staticList, 'logLevel', '0');
        menu.on('mouseenter', updatePathMenu);
    })();
})();
