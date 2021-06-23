// ==UserScript==
// @name         Viddo-helper
// @namespace    http://tampermonkey.net/
// @version      1.3.1
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

#monkey-react-path { display: none; z-index: 9999; font-size: 10; position: fixed; background: #f2f2f2; padding: 1px 3px; border-top: 1px solid #cfcfcf; border-left: 1px solid #cfcfcf; border-radius: 3px 0 0 0; bottom: 0; right: 0; }
#monkey-react-path a { cursor: pointer; padding: 2px 3px; display: inline-block; }
#monkey-react-path a:hover { text-decoration: underline; }
`;
    GM_addStyle(css.replace(/\/\/ .*/g, ''));

    // react path
    // ==========

    function getNodeName (node) {
        let name;
        const { stateNode } = ((node || {})._debugOwner || {});
        const type = (node._debugOwner || {}).type;
        const stateNodeName = ((stateNode || {}).constructor || {}).name;
        const hasTypeFn = type && (typeof type === 'object' || typeof type === 'function');
        if (hasTypeFn) {
            name = type.name;
        } else if (stateNodeName) {
            name = stateNodeName;
        }
        return name;
    }

    function getElementName (element) {
        let name, node;
        for (const key in element) {
            if (key.toLowerCase().includes('reactinternalinstance')) {
                node = element[key];
                name = getNodeName(node);
                break;
            }
        }
        // skip one level and try to fallback to type fn name
        if (/^FontAwesome/.test(name) && node._debugOwner) {
            name = getNodeName(node._debugOwner);
        }
        return { node, name };
    }

    function getElementTree (element) {
        let names = [];
        let $el = $(element);
        while ($el && $el.length && !$el.is('body')) {
            const name = getElementName($el.get(0)).name;
            if (name && name !== 'Content' && names[names.length - 1] !== name) {
                names.push(name);
            }
            $el = $el.parent();
        }
        names = names.reverse();
        return names;
    }

    let reactPathLogger = !!localStorage.getItem('__reactPath');
    function createReactPathLogger () {
        const moReactPath = $('<div id="monkey-react-path"></div>');
        moReactPath.prependTo(document.body);
        moReactPath.on('click', (e) => {
            const $el = $(e.target);
            if (!$el.is('a')) {
                return;
            }
            const text = $el.text() + '.tsx';
            const copy = function (e) {
                e.preventDefault();
                if (e.clipboardData) {
                    e.clipboardData.setData('text/plain', text);
                } else if (window.clipboardData) {
                    window.clipboardData.setData('Text', text);
                }
            };
            window.addEventListener('copy', copy);
            document.execCommand('copy');
            window.removeEventListener('copy', copy);
        });
        if (reactPathLogger) {
            moReactPath.show();
        }
        let throttleTimer;
        $(document).on('mousemove', (e) => {
            if (!reactPathLogger) {
                return;
            }
            clearTimeout(throttleTimer);
            throttleTimer = null;
            throttleTimer = setTimeout(() => {
                const tree = getElementTree(e.target);
                if (tree.length) {
                    moReactPath.html(tree.map(s => `<a>${s}</a>`).join(' ↘ '));
                }
            }, 500);
        });
        return moReactPath;
    }

    // tester
    // ======

    function fillInput (el, value) {
        el = $(el).get(0);
        if (!el) {
            return console.error('El not found', el);
        }
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // utils
    // =====

    function randStr () {
        return Math.random().toString(36).replace('0.', '');
    }

    // menu
    // ====

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
        // PATH SPECIFIC
        // =============
        if (pathName === '/login') {
            const login = (username, password, noSubmit) => {
                fillInput($('.input.input--text:eq(0) input[type=email]'), username + '@viddo.com');
                fillInput($('.input.input--text:eq(1) input[type=password]'), password || '123456');
                if (!noSubmit) {
                    $('.button.button--orange:eq(0)').click();
                }
            };
            addMenuItem(pathList, 'login moderator', () => { login('moderator'); });
            addMenuItem(pathList, 'login uploader', () => { login('uploader'); });
            addMenuItem(pathList, 'login finance', () => { login('finance'); });
            addMenuItem(pathList, 'login consumer', () => { login('consumer'); });
            addMenuItem(pathList, 'login exporter', () => { login('exporter'); });
            addMenuItem(pathList, 'login agerestricted', () => { login('agerestricted'); });
            addMenuItem(pathList, 'login admin', () => { login('admin'); });
            addMenuItem(pathList, 'login +apple', () => { login('apple+test'); });
            addMenuItem(pathList, 'login +pear', () => { login('pear+test'); });
            addMenuItem(pathList, 'login +melon', () => { login('melon+test'); });
            addMenuItem(pathList, 'login +lemon', () => { login('lemon+test'); });
        }
        // PATH SPECIFIC
        // =============
        if (pathName === '/registration') {
            const reg = (username) => {
                fillInput('input[name=email]', username + '+test@viddo.com');
                $('input[name=terms-and-conditions]:not(:checked)').click();
            };
            addMenuItem(pathList, 'reg apple', () => { reg('apple'); });
            addMenuItem(pathList, 'reg pear', () => { reg('pear'); });
            addMenuItem(pathList, 'reg melon', () => { reg('melon'); });
            addMenuItem(pathList, 'reg lemon', () => { reg('lemon'); });
            addMenuItem(pathList, 'reg random', () => { reg(randStr()); });
        }
    }

    function createMenu () {
        const moMenu = $('<div id="monkey-menu"><ul id="monkey-menu-path"></ul><ul id="monkey-menu-static"></ul></div>');
        moMenu.prependTo(document.body);
        return moMenu;
    }

    function addStorageSwitcherMenuItem (target, name, text, value, actionTrue, actionFalse) {
        const key = `_${name}`;
        const action = () => {
            const thisMenuItem = $(`#monkey-menu-switcher-${name}`);
            const current = localStorage.getItem(key);
            if (current) {
                thisMenuItem.text(thisMenuItem.text().replace('☑', '☐'));
                localStorage.removeItem(key);
                if (actionFalse) { actionFalse(); }
            } else {
                thisMenuItem.text(thisMenuItem.text().replace('☐', '☑'));
                localStorage.setItem(key, value);
                if (actionTrue) { actionTrue(); }
            }
        };
        const current = localStorage.getItem(key);
        const title = (current ? '☑' : '☐') + ' ' + text;
        const menuItem = $(`<li id="monkey-menu-switcher-${name}">${title}</li>`);
        menuItem.on('click', action);
        menuItem.addClass('action');
        menuItem.appendTo(target);
        return menuItem;
    }

    function printTokens () {
        try {
            const tokens = JSON.parse(unescape(document.cookie.split(';').find(s => s.trim().startsWith('tokens')).replace(/.*tokens=/, '')));
            console.log('refreshToken:', tokens.refreshToken || '?');
            const parsed = JSON.parse(atob(tokens.token.split('.')[1]));
            const expired = (new Date().getTime() / 1000) > parsed.exp;
            parsed.exp = parsed.exp ? new Date(parsed.exp * 1000).toLocaleString() : null;
            parsed.iat = parsed.iat ? new Date(parsed.iat * 1000).toLocaleString() : null;
            console.log(`token (${expired ? 'expired' : 'not expired'}):`, parsed);
        } catch (error) {
            console.log('failed to decode tokens');
        }
    }

    // run
    // ===

    (() => {
        const menu = createMenu();
        const staticList = $('#monkey-menu-static');
        addMenuItem(staticList, 'logout', () => { window.location.href = '/logout'; });
        addMenuItem(staticList, 'tokens', printTokens);
        addMenuItem(staticList, 'remove locale ls data', () => { localStorage.removeItem('locale'); });
        addStorageSwitcherMenuItem(staticList, 'logRedux', 'log redux', '1');
        addStorageSwitcherMenuItem(staticList, 'logHlsjs', 'log hls', '1');
        addStorageSwitcherMenuItem(staticList, 'logAxios', 'log axios', '1');
        addStorageSwitcherMenuItem(staticList, 'logSocketio', 'log socketio', '1');
        addStorageSwitcherMenuItem(staticList, 'logTimeStamp', 'log with timestamps', '1');
        addStorageSwitcherMenuItem(staticList, 'logLevel', 'log verbosity all', '0');
        menu.on('mouseenter', updatePathMenu);
        const rpLogger = createReactPathLogger();
        addStorageSwitcherMenuItem(staticList, '_reactPath', 'react path', '1', () => { reactPathLogger = true; rpLogger.show(); }, () => { reactPathLogger = false; rpLogger.hide(); });
    })();
})();
