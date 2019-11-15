// ==UserScript==
// @name         GitHub
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  github extras
// @author       szkrd
// @match        https://github.com/planorama/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    const INTERVAL_TIME = 2000;
    const $ = window.jQuery;

    let css = `
.label_colored { display: inline-block; padding: 0 3px; border-radius: 4px; }
.label_approved { background-color: palegreen; }
`;

    GM_addStyle(css.replace(/\/\/ .*/g, ''));
    const useDecorators = () => {
        $('.js-navigation-item a:contains(Approved)').each((i, el) => {
            $(el).addClass('label_colored label_approved');
        });
    };
    setTimeout(useDecorators, 100);
    setInterval(useDecorators, INTERVAL_TIME);
})();
