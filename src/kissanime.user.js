// ==UserScript==
// @name         kissanime
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hide ads, make playing videos easier.
// @author       szkrd
// @match        http://kissanime.ru/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';
  // runat: default

  let css = `
    // ads and anti-social
    div[class*="addthis_"], a[class*="addthis_"],
    #divAds2,
    iframe[src="about:blank"],
    iframe[src*="ads"],
    iframe[src*="facebook.com"],

    #___plusone_0,
    #btnShowComments,
    div[id^=taboola],
    div[id^=adsIfr]:not(.bigBarContainer),
    div[style*="768px"],
    iframe[style*="width:728px"],
    .js-hide { display: none !!!; }

    // layout changes
    // this is quite generic and useful content may be lost, but so it goes
    #rightside { display: none; }
    .episodeList > div > div { display: none !!!; }

    iframe { box-shadow: 0 0 10px green; }

    .divCloseBut a { color: gray; }
  `;

  GM_addStyle(css.replace(/\/\/ .*/g, '').replace(/!!!/g, '!important'));

  // case insensitive contains pseudo
  $.expr[':'].containsi = $.expr.createPseudo((arg) =>
    (elem) => $(elem).text().toUpperCase().includes(arg.toUpperCase())
  );

  let killCookies = () => document.cookie.split(';').forEach((c) => {
    document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });

  let flushStorages = () => {
    localStorage.clear();
    killCookies();
  };

  // ---

  $(() => {
    flushStorages();
    setTimeout(() => {
      window.onunload = flushStorages;
      window.onbeforeunload = () => {};
    }, 2000);

    $('.barTitle:containsi("comments")').closest('.bigBarContainer').addClass('js-hide');

    // external videos are "not good"
    setTimeout(() => {
      $('#divContentVideo > iframe').each((i, el) => {
        let src = el.src;
        $(`<a href="${src}" target="_blank">iframe src</a><br>`).insertBefore(el);
      });
    }, 3000);
  }); // end domcontentloaded
})();
