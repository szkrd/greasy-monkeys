// ==UserScript==
// @name         Zeplin
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Zeplin ux
// @author       szkrd
// @match        https://app.zeplin.io/*
// @require      https://code.jquery.com/jquery-3.2.0.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';

    const $ = window.$;

    const css = `
// section headers are just fucking huge
.section > .sectionHeader { padding: 0; background-color: rgb(124, 252, 0, .2); }

// bigger click area with js
.sectionHeader, .sectionInfo { cursor: pointer; }

// we use exports from sketch, so screen names are just plain garbage
#jumpToScreen { display: none; }

// remove big and useless help button from corner
.supportButton { display: none; }
`;
    // close all accordion items withc trl+m
    $(document).keypress('m', (event) => {
        if (event.ctrlKey) {
            $('div.section.user').addClass('collapsed');
        }
    });

    $(document.body).on('click', (event) => {
        const el = $(event.target);
        // let me switch the accordion with a bigger click area
        if (el.is('div.sectionHeader') || el.is('div.sectionInfo')) {
            if (event.shiftKey) {
                $('div.section.user').addClass('collapsed');
            } else {
                el.closest('.section.user').toggleClass('collapsed');
            }
        }
    });

    GM_addStyle(css.replace(/\/\/ .*/g, ''));
})();
