// ==UserScript==
// @name         Simu
// @namespace    http://tampermonkey.net/
// @version      2.4.1
// @description  Simulator helper.
// @author       szkrd
// @match        http://localhost:3000/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    // it can run on multiple ports, if that's what we want
    if (![3000].includes(~~window.location.port)) return;

    const SOURCE_WITH_LINE_COL = true; // should copy to clipboard use file path with line & col
    const WAIT_TIME = 800; // mouse hover timeout
    const DEFAULT_PORT = 3000;
    const BLACKLISTED_COMPONENT_NAMES = ['Transition', 'OutsideClickHandler', /^FontAwesome/];
    const $ = window.jQuery;
    const css = `
#monkey-menu { width: 15px; height: 15px; position: fixed; z-index: 1000001; border-radius: 10px; background: rgba(255,255,255,.2); opacity: .5; top: 3px; left: 3px; overflow: hidden; border: 1px solid gray; transition: all .2s linear; padding: 3px; }
#monkey-menu:hover { width: auto; height: auto; opacity: 1; border-radius: 2px; background: cyan; box-shadow: 2px 2px 2px rgba(0, 0, 0, .3); }
#monkey-menu:hover li { display: block; }
#monkey-menu > ul { padding: 0; margin: 0; font-size: 11px; font-weight: normal; }
#monkey-menu li { font-weight: bold; cursor: pointer; padding: 2px 5px; display: none; }
#monkey-menu li.action:hover { text-decoration: underline; }

html.monkey-react-path-disabled #monkey-react-path { display: none; }
#monkey-react-path { z-index: 1000001; font-family: Arial; font-size: 12px; position: fixed; background: #f2f2f2; padding: 1px 3px; border-top: 1px solid #cfcfcf; border-left: 1px solid #cfcfcf; border-radius: 3px 0 0 0; bottom: 0; right: 0; }
#monkey-react-path a { cursor: pointer; padding: 2px 3px; display: inline-block; }
#monkey-react-path a.without-source { opacity: .5; }
#monkey-react-path a.hidden { color: #aaa; font-size: 10px; }
#monkey-react-path a.hidden.confusing { color: #555; }
#monkey-react-path a:hover { text-decoration: underline; }
`;
    GM_addStyle(css.replace(/\/\/ .*/g, ''));

    // material UI v3 component names not active for now, see portal script for details
    const matUiV3CompNames = [];
    const hasMuiClass = node => Array.from((node || {}).classList || []).some(className => className.startsWith('Mui'));
    const otherPackages = BLACKLISTED_COMPONENT_NAMES.filter(item => typeof item === 'string');
    const otherPackagesRex = BLACKLISTED_COMPONENT_NAMES.filter(item => item instanceof RegExp);
    const escapeHtml = s => String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&#34;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // if a SelectContainer is followed by a Control, then everything's part of @react-select
    // (this is also true for other components)
    const atPattern = (metas, pattern) => {
        const names = metas.map(meta => meta.name);
        const startPos = names.indexOf(pattern[0]);
        return (startPos > -1 && names[startPos + 1] && names[startPos + 1] === pattern[1]) ? startPos : -1;
    };
    const markByPattern = (metas, pattern) => {
        const patternPos = atPattern(metas, pattern);
        if (patternPos > -1) {
            for (let i = patternPos, l = metas.length; i < l; i++) {
                metas[i].show = false;
            }
        }
    };

    // react path
    // ==========

    // get node metadata (mostly the name)
    function getNodeMeta (node) {
        let name;
        const { stateNode } = ((node || {})._debugOwner || {});
        const type = (node._debugOwner || {}).type;
        const stateNodeName = (stateNode && typeof stateNode === 'object') ? stateNode.constructor.name : '';
        const hasTypeFn = type && (typeof type === 'object' || typeof type === 'function');
        let show = true;
        let confusing = false;
        if (hasTypeFn) {
            name = type.name;
        } else if (stateNodeName) {
            name = stateNodeName;
        } else {
            show = false;
        }
        let source = show && node._debugSource ? node._debugSource.fileName : ''; // full absolute file path
        if (SOURCE_WITH_LINE_COL && node._debugSource && node._debugSource.lineNumber) {
            source += `:${node._debugSource.lineNumber}`;
            if (node._debugSource.columnNumber) {
                source += `:${node._debugSource.columnNumber}`;
            }
        }
        name = name || '';
        const isMaterialName = matUiV3CompNames.includes(name);
        const isMaterialClass = hasMuiClass(node.stateNode); // unless it has been overridden :(
        const isBlacklisted = otherPackages.includes(name) || otherPackagesRex.some(rex => rex.test(name));
        if (isMaterialName || isBlacklisted) {
            show = false;
        }
        if (isMaterialName && !isMaterialClass) {
            confusing = true; // materialish tag name, but not materialish classes
        }
        // sometimes people mark the withStyles hoc with a postfix
        if (name.endsWith('WithStyles')) {
            name = name.replace(/WithStyles$/, '');
        }
        return { name, show, source, confusing };
    }

    function getElementMeta (element) {
        let meta = { show: false };
        let node;
        for (const key in element) {
            const keyLow = key.toLowerCase();
            if (keyLow.includes('reactinternalinstance') || keyLow.startsWith('__react')) {
                node = element[key];
                meta = getNodeMeta(node);
                break;
            }
        }
        return { node, ...meta };
    }

    function getElementTree (element) {
        let metas = [];
        let $el = $(element);
        while ($el && $el.length && !$el.is('body')) {
            const meta = getElementMeta($el.get(0));
            const name = meta.name;
            if (name && name !== 'Content' && (metas[metas.length - 1] || {}).name !== name) {
                metas.push(meta);
            }
            $el = $el.parent();
        }
        metas = metas.reverse();
        markByPattern(metas, ['Ratio', 'ComponentEnhancer']); // @rc-slider
        markByPattern(metas, ['SelectContainer', 'Control']); // @react-select
        markByPattern(metas, ['DateRangePicker', 'OutsideClickHandler']); // @react-dates
        return metas;
    }

    function createReactPathLogger () {
        const moReactPath = $('<div id="monkey-react-path">&nbsp;</div>');
        moReactPath.prependTo(document.body);
        moReactPath.on('click', (e) => {
            const $el = $(e.target);
            if (!$el.is('a')) {
                return;
            }
            const text = $el.data('source') || $el.text(); // copy the path or the name of the element to the clipboard
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
        moReactPath.show();
        let throttleTimer;
        $(document).on('mousemove', (e) => {
            clearTimeout(throttleTimer);
            throttleTimer = null;
            throttleTimer = setTimeout(() => {
                const tree = getElementTree(e.target);
                if (tree.length) {
                    const html = tree.map(meta => {
                        let className = (meta.show ? 'visible' : 'hidden') + (meta.confusing ? ' confusing' : '');
                        if (!meta.source) className += ' without-source';
                        const source = escapeHtml(meta.source);
                        const name = escapeHtml(meta.name);
                        return `<a class="${className}" data-source="${source}">${name}</a>`;
                    }).join(' ↘ ');
                    moReactPath.html(html);
                }
            }, WAIT_TIME);
        });
        return moReactPath;
    }

    // Generic menu handling
    // ---------------------

    function createMenu () {
        const moMenu = $('<div id="monkey-menu"><ul id="monkey-menu-path"></ul><ul id="monkey-menu-static"></ul></div>');
        moMenu.prependTo(document.body);
        return moMenu;
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

    // Special menu items
    // ------------------

    function menuItemToggleReactPath () {
        $('html').toggleClass('monkey-react-path-disabled');
    }

    // run
    // ===

    // Startup ↘ App ↘ Layout ↘ Checks ↘ Filter ↘ SwitchWrapper ↘ ReactSwitch
    (() => {
        createMenu();
        // relogin may take us to the built version
        if (+window.location.port !== DEFAULT_PORT) {
            $('#monkey-menu').css({ backgroundColor: 'red' });
        }

        const staticList = $('#monkey-menu-static');
        // addMenuItem(staticList, 'remove locale ls data', () => { localStorage.removeItem('locale'); });
        addMenuItem(staticList, 'toggle react path', menuItemToggleReactPath);
        addStorageSwitcherMenuItem(staticList, 'logRedux', 'log redux actions', '1');
        addStorageSwitcherMenuItem(staticList, 'logWebSocket', 'log websocket', '1');
        addStorageSwitcherMenuItem(staticList, 'logTimeStamp', 'log with timestamps', '1');
        addStorageSwitcherMenuItem(staticList, 'logLevel', 'log level to zero', '0');
        createReactPathLogger();
    })();
})();
