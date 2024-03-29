// ==UserScript==
// @name         Simu
// @namespace    http://tampermonkey.net/
// @version      2.5.2
// @description  Simulator helper.
// @author       szkrd
// @match        http://localhost:3000/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    // it can run on multiple ports, if that's what we want
    if (~~window.location.port < 3000) return;

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
#monkey-menu li { font-weight: bold; cursor: pointer; padding: 2px 5px; display: none; color: #000; }
#monkey-menu li.action:hover { text-decoration: underline; }

html.monkey-react-path-disabled #monkey-react-path { display: none; }
#monkey-react-path { opacity: .7; color: #000; z-index: 1000001; font-family: Arial; font-size: 12px; position: fixed; background: #f2f2f2; padding: 1px 3px; border-top: 1px solid #cfcfcf; border-left: 1px solid #cfcfcf; border-radius: 3px 0 0 0; bottom: 0; right: 0; }
#monkey-react-path:hover { opacity: 1; }
#monkey-react-path a { cursor: pointer; padding: 2px 3px; display: inline-block; color: #000; }
#monkey-react-path a.without-source { opacity: .4; }
#monkey-react-path a.hidden { color: #aaa; font-size: 10px; }
#monkey-react-path a.hidden.confusing { color: #555; }
#monkey-react-path a:hover { text-decoration: underline; }

// style overrides for the app
// ---------------------------
html.monkey-style p { m0!!; p0!!; }
html.monkey-style button[type="button"] { m0; p0; height: auto; }

html.monkey-style .ms-List-cell { min-height: 22px; }
html.monkey-style div[role="row"] { height: 23px; line-height: 22px; min-height: 22px; m0; p0; }
html.monkey-style div[role="gridcell"] { m0; p0; line-height: 1; min-height: 20px; }
html.monkey-style div[class*="ms-MessageBar"] { min-height: auto; }
html.monkey-style div[class*="ms-MessageBar"] > div { m0; }

html.monkey-style .editor-simulationlist { m0; }
html.monkey-style #LayerSectionContainer { m0; p0; }
html.monkey-style div[class*="Layers_layerField"] { m0; }
html.monkey-style button[class*="LayerVisibleToggle"] { m0; }
html.monkey-style div[class*="ToggleGroup"] { p0; m0; }
html.monkey-style div[class*="LayerConfiguration_description"],
html.monkey-style p[class*="LayerConfiguration_description"] { m0; line-height: 1; font-size: 9px; }
html.monkey-style div[class*="EditorContainer_root"] { m0; p0; }
html.monkey-style div[data-testid="layer-properties"] { m0; }
html.monkey-style div[class*="CollapsibleGroup_header"] { box-shadow: 0 0 13px 1px inset rgba(55, 97, 122, .1); border-radius: 5px; }
html.monkey-style div[class*="CollapsibleGroup_container"] > div[class^="root"] { height: 2px; p0; }
html.monkey-style div[class*="CollapsibleGroup_content"] div { m0!!; }
html.monkey-style div[class*="CollapsibleGroup_button"] { min-height: 16px; min-width: 16px; m0; }
html.monkey-style div[class*="EditorCollapser"] { display: none; }
`;
    GM_addStyle(
        css
            .replace(/\/\/ .*/g, '')
            .replace(/!!/g, ' !important') // todo: only inside curly braces!
            .replace(/m0/g, 'margin: 0')
            .replace(/p0/g, 'padding: 0')
    );

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

    let reactPathMouseMoveHandler;
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
        const mouseMoveHandler = reactPathMouseMoveHandler = (e) => {
            clearTimeout(throttleTimer);
            throttleTimer = null;
            throttleTimer = setTimeout(() => {
                const tree = getElementTree(e.target);
                if (tree.length) {
                    const html = tree.map(meta => {
                        let className = (meta.show ? 'visible' : 'hidden') + (meta.confusing ? ' confusing' : '');
                        let title = '';
                        if (!meta.source) {
                            className += ' without-source';
                        } else {
                            title = meta.source.replace(/\\/g, '/');
                            if (title.includes('/src/')) title = title.replace(/^.*\/src\//, '/');
                        }
                        const source = escapeHtml(meta.source);
                        const name = escapeHtml(meta.name);
                        return `<a class="${className}" data-source="${source}" title="${title}">${name}</a>`;
                    }).join(' ↘ ');
                    moReactPath.html(html);
                }
            }, WAIT_TIME);
        };
        $(document).on('mousemove', mouseMoveHandler);
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

    function addStorageSwitcherMenuItem (target, name, text, value, actionTrue, actionFalse, runFirst) {
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
        if (runFirst) {
            const current = localStorage.getItem(key);
            if (current && actionTrue) { actionTrue(); }
            if (!current && actionFalse) { actionFalse(); }
        }
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

    function fluentModalFix () {
        const marker = 'monkeyMouseMoveHack';
        const wrapper = $(`div.ms-Fabric.ms-Layer-content > div[aria-modal="true"]:not(.${marker})`);
        if (wrapper.length > 0) {
            wrapper.parent().on('mousemove', reactPathMouseMoveHandler);
            wrapper.addClass(marker);
            console.log('[MONKEY] fluent modal fix applied');
        }
    }

    function addMonkeyStyleClass () {
        $('html').addClass('monkey-style');
    }

    function removeMonkeyStyleClass () {
        $('html').removeClass('monkey-style');
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
        addMenuItem(staticList, 'toggle react path', menuItemToggleReactPath);
        addStorageSwitcherMenuItem(staticList, 'logHistory', 'log history change', '1');
        addStorageSwitcherMenuItem(staticList, 'logRedux', 'log redux actions', '1');
        addStorageSwitcherMenuItem(staticList, 'logFetch', 'log fetch', '1');
        addStorageSwitcherMenuItem(staticList, 'logWebSocket', 'log websocket', '1');
        addStorageSwitcherMenuItem(staticList, 'logTimeStamp', 'log with timestamps', '1');
        addStorageSwitcherMenuItem(staticList, 'logLevel', 'log level to zero', '0');
        addStorageSwitcherMenuItem(staticList, 'monkeyStyle', 'toggle style override', '1', addMonkeyStyleClass, removeMonkeyStyleClass, true);
        createReactPathLogger();

        // fluent modals stop the bubbling of various events, so mousemove would not reach our topmost handler
        // (the keyboard shortcut is needed because of their aggressive cover layer that will catch every outside click)
        if (reactPathMouseMoveHandler) {
            addMenuItem(staticList, 'attach to fluent modal', fluentModalFix);
            $(document).on('keydown', (event) => {
                if (event.key === 'b' && event.ctrlKey) fluentModalFix();
            });
        }
    })();
})();
