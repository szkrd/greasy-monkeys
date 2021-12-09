// ==UserScript==
// @name         startpage
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  better startpage
// @author       You
// @match        https://www.startpage.com/*
// @icon         https://www.google.com/s2/favicons?domain=startpage.com
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const $ = window.jQuery;
    const css = `
  #privacy-please-button,
  #feedback-button,
  h3.w-gl__label,
  div.layout-web__sidebar, // the info box in desktop
  .wp-qi-tp.wp-qi-tp--, // the info box in mobile
  .cn-qi-tp.cn-qi-tp--, // news results
  a.anonymous-link { display: none!!; }

  // the web/images/videos/news toolbar, which is useless
  div.inline-nav-menu-container { display: none!!; }

  // squash and cleanup header
  div.header { padding: 0; background-color: #fff; }
  div.layout-web__body { margin-top: 30px; }

  // the footer is irrelevant with the sidebar-menu
  div.layout-web__footer { display: none; }

  div.layout-web__search-filters-container { max-width: 100%; }
  div[class*="inline-nav-container"] { border-bottom: 1px dotted gray; }
  div.w-gl__result.linkHover, div.w-gl__result:hover { border-color: rgba(255,255,255,0); }
  div.w-gl__description { line-height: 1.3; }

  a.result-link { overflow: visible; color: blue; }
  a.result-link:visited { color: purple; }
  a.result-link.w-gl__result-url { color: green; }
  a.result-link.w-gl__result-url:visited { color: silver; }
  a.result-link[class*="result-title"] { font-weight: bold; }

  div.mainline-results,
  div.layout-web__mainline { margin: 0; max-width: 100%!!; }
  div.pagination { clear: both; margin: 0; }
  span.domain-info { line-height: 16px; background-color: linen; border-radius: 4px; padding: 0 2px; margin: 0 3px 0 0;
    color: gray; text-align: center; border-bottom: 1px solid #fff; display: inline-block; }

  // some extra coloring
  .domain-info.wikipedia { background-color: powderblue; }
  .domain-info.stackoverflow { background-color: wheat; }
  `.replace(/\/\/ .*/g, '').replace(/\s?!!/g, ' !important');
    $('head').append(`<style type="text/css">${css}</style>`);
    $('a.anonymous-link').remove();
    $('a.result-link').removeAttr('data-extra').removeAttr('data-thash')
        .removeAttr('rel').removeAttr('target')
        .each((i, el) => {
            const url = $(el).text().trim();
            $(el).text(url);
            if (url.startsWith('http')) {
                const matches = url.match(/([0-9a-z-_]*?\.(com|org|net|io))/i) || [];
                const domain = (matches[0] || '').replace(/\.(com|org|net|io)$/, '');
                if (domain) {
                    const abbrevs = {
                        stackoverflow: 'so',
                        mozilla: 'moz',
                        wikipedia: 'wiki',
                        imdb: 'imdb',
                        youtube: 'yt',
                        rottentomatoes: 'rt',
                        github: 'git',
                        gitlab: 'git',
                        amazon: 'a',
                        goodreads: 'gr',
                        reddit: 'red',
                        bbc: 'bbc',
                        cnn: 'cnn'
                    };
                    const abbrev = abbrevs[domain];
                    if (abbrev) {
                        $(el).parent().prepend(`<span class="domain-info ${domain}">${abbrev}</span>`);
                    }
                }
            }
        });
})();
