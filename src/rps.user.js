// ==UserScript==
// @name         rps
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Rps cleanup.
// @author       szkrd
// @match        https://www.rockpapershotgun.com/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
'use strict';

// runat: document start

let css = `
  .js-hide,
  ul#mobile-meta,
  #eg-network,
  #menu-utility-container,

  // feature or not
  .featured-block-title,

  // video content is crappy
  #rps-video-carousel,

  // taboolaish things
  #rps-article-carousel,

  // mostly just old or recycled content, sometimes years old
  #sidebar,

  // troll things
  div.reply,
  #respond,
  cite.fn,

  // tags are useless, they are just arbitrary words
  .article-footer p.tags
  { DIN !!!; }

  a[href^="https://www.rockpapershotgun.com/tag"] { color: gray !!!; }
  a { cursor: pointer !!!; }
  a:hover { text-decoration: underline !!!; }

  ul#menu-main-nav li a { color: rgba(255,255,255,0.2) !!!; transition: color ease-in 2s; }
  ul#menu-main-nav li a:hover { color: rgba(255,255,255,0.6) !!!; }

  #content-posts .post-inner p img { filter: grayscale(65%); opacity: 0.9; }
  body div.content .block p.comments { background-image: none; padding-left: 0; }

  ul.top-features { filter: grayscale(100%); opacity: 0.8; }
  ul.top-features a { opacity: 0.1; transition: all ease-out 0.5s; }
  ul.top-features a:hover { opacity: 0.9; }
  div#content div.content { width: 960px !!!; }
  body div.content .block img { margin: 0; }
`;

css = css.replace(/\/\/ .*/g, '')
  .replace(/!!!/g, '!important')
  .replace(/DIN/g, 'display:none')

GM_addStyle(css);

// case insensitive contains pseudo
$.expr[':'].containsi = $.expr.createPseudo((arg) =>
  (elem) => $(elem).text().toUpperCase().includes(arg.toUpperCase())
);

$(() => {
  let blacklist = (word, selector) => $(`.post-inner h1:containsi("${word}")`).closest('article').addClass('js-hide');
  ['overwatch', 'moba', 'win a ticket', 'best pc gaming deals',
   'counter-strike', 'for honor', 'rocket league', 'giveaway:'].forEach(word => blacklist(word));

  $('.byline:containsi("John Walker")').closest('article').addClass('js-hide'); // oh god, do I hate this guy
});

})();