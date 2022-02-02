// ==UserScript==
// @name         azure dev
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  try to take over the world!
// @author       szkrd
// @match        https://dev.azure.com/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';
    if (!window.location.href.includes('/pullrequest')) return;
    const $ = window.jQuery;
    const css = `
td.cell-resolved { background-color: rgba(0, 255, 0, .2); border-radius: 5px }
td.cell-active { background-color: rgba(200, 255, 0, .2); border-radius: 5px }

.monkey-clickable { cursor: pointer; display: inline-block; border-radius: 3px; padding: 0 2px; }
.monkey-clickable:hover { background-color: cyan; }

.monkey-copy-to-clipboard { text-decoration: none; }
.monkey-collapse { overflow: hidden; height: 64px; border-bottom: 2px solid lightsalmon; }
`;
    GM_addStyle(css.replace(/\/\/ .*/g, ''));

    function colorizeCommentSections () {
        $('div.bolt-dropdown-expandable-button-label:contains("Resolved")').closest('td').addClass('cell-resolved');
        $('div.bolt-dropdown-expandable-button-label:contains("Active")').closest('td').addClass('cell-active');
    }

    function addCopyBranchNameButton () {
        if ($('.pr-header-branches .monkey-clickable').length > 0) return;
        const branchLink = $('.pr-header-branches a.bolt-link').first();
        const branchName = branchLink.text();
        const dlLink = $('<a href="#" class="monkey-clickable monkey-copy-to-clipboard">📋</a>');
        dlLink.on('click', () => {
            navigator.clipboard.writeText(branchName);
            return false;
        });
        dlLink.insertAfter(branchLink.first());
    }

    function makeDescriptionCollapsible () {
        const sel = '.repos-pr-description-card div[role=heading]';
        if ($(`${sel}.monkey-clickable`).length > 0) return;
        $(sel).addClass('monkey-clickable').on('click', () => {
            $('.repos-pr-description-card').toggleClass('monkey-collapse');
        });
    }

    // we need the interval because azure dev is a spa (with heavy socket usage)
    setInterval(() => {
        colorizeCommentSections();
        addCopyBranchNameButton();
        makeDescriptionCollapsible();
    }, 1000);
})();
