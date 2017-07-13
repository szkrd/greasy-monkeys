// ==UserScript==
// @name         index
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Removes trashy content, mutes colors, hides gifs.
// @author       szkrd
// @match        http://index.hu/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
  'use strict';
  // runat: document start

  let css = `
    // generic
    .hirdetes,

    // header
    .content-above-header,
    .m-cf-fejlec,
    .header-parts,

    // mindekozben, MTI, best of
    .pp-hasab,

    // video collections. I hate videos.
    .medialepedo-blokk,

    // index2 ans everything below (tematic stuff I'm not really interested in)
    .index2, .index2-and-below,

    // bottom of main articles
    div[class^=cikk-vegi-ajanlo],

    // helpers. stuff I add with js below
    .helper-sport-block,
    .opinion-teaser,
    .dumb-content,

    // anti-social
    div.kovetes .btn-pass,
    .jobb-hasab,
    .index-social-box,
    img.szerzo-kep,

    // tricky ads
    div[class$=-text-ad],
    .nativead,
    .bcs-black-container,

    // pager on the left and link to i2 on the right
    .lapozo-bal, .lapozo-jobb,
    button[class^=c-content-pager],
    .c-index2-pager_link
    { display: none !important; }

    // ---

    // I don't really like strong colors
    .cimke-kulso-blog, .cimke-blog, .cimke-rovat-light.selected, .cimke-rovat, .cimke-mufaj, .cimke,
    .kiemelt-tetris .cikkcim { background-color: gray; }
    .kiemelt-csikkal, .kiemelt-blokk .ajanlo, .kiemelt-alahuzott > div { border-color: gray !important; }
    .index-header:after, .keretes:before { background-color: darkslategray !important; }

    // fejlec gone
    body { margin-top: 0; }

    // author info gone
    .author-share-date .bal-hasab { float: left; }

    // images lie
    img { filter: grayscale(90%) contrast(75%); opacity: 0.95; }

    // snowblindness
    body { background-color: #eee; }

    // gifs are smelly
    .gif-ahead { background-color: rgba(75, 75, 75, 0.2); }
    img[src$=".gif"] { visibility: hidden; }

    // funny headings are not so funny
    h3 .blokk-label { visibility: hidden; }
  `;

  GM_addStyle(css.replace(/\/\/ .*/g, ''));

  // case insensitive contains pseudo
  $.expr[':'].containsi = $.expr.createPseudo((arg) =>
    (elem) => $(elem).text().toUpperCase().includes(arg.toUpperCase())
  );

  $(() => {
    $('a.cimke.cimke-rovat:contains("Sport")').closest('.blokk').addClass('helper-sport-block');
    $('article.velemeny-anyag').closest('.cimlap-anyag').addClass('opinion-teaser');
    $('div.index2').nextAll('section, div').addClass('index2-and-below');
    $('img[src$=gif], img[data-original$=gif]').closest('div').addClass('gif-ahead');
    $('section.index-header').prevAll('div.container').addClass('content-above-header');

    let blacklist = (word) => $(`h1 a:containsi("${word}")`).closest('.cimlap-anyag, .cimlap-blokk-index').addClass('dumb-content');
    ['ötös lottó', 'hatos lotto', 'szex', 'szavazzon'].forEach(word => blacklist(word));
  });
})();
