// ==UserScript==
// @name         openload-video
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Remove coverlayer from video (popup opener is still active though).
// @author       szkrd
// @match        https://openload.co/embed/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    // runat: document start

    GM_addStyle(`
    #videooverlay { display: none !important; }
  `);

    $(() => {
        window.popAdsLoaded = true;
        $('#videooverlay').click();
        $('div[style*=9999999]').remove();
    });
})();
