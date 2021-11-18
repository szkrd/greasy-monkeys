// ==UserScript==
// @name         BBCNews
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  make BBC News, the most ad and tracker infested news site on Earth, somewhat bearable
// @author       foobar
// @match        https://www.bbc.com/news*
// @icon         https://www.google.com/s2/favicons?domain=bbc.com
// @grant        none
// @run-at       document-start
// ==/UserScript==
(function () {
    // FIRST THING: add `$script,domain=www.bbc.com` to uBlock Origin "My Filters" section
    // this will thwart their script links, but not mjs and inline script, which is still
    // needed, without those we would get a mobile-ish broken site that's only useful for seo
    'use strict';
    const $$ = (sel = '') => document.querySelectorAll(sel);
    const $ = (sel = '') => $$(sel)[0];
    const hide = (sel = '') => { $$(sel).forEach(el => { el.style.display = 'none'; }); };
    // const remove = (el) => { el.parentNode.removeChild(el); };
    // they store the real img urls in datasets, along with a width preference, nothing unusual here
    const lazyLoadImgWithDataSet = (el) => {
        const dS = el.dataset;
        const widths = dS.widths.replace(/^\[/, '').replace(/]$/, '').split(',').map(num => parseInt(num, 10));
        const src = dS.src.replace(/\{width}/g, widths[0]);
        el.src = src;
        el.className = el.className.split(' ').filter(name => !name.includes('lazy')).join(' ');
    };
    const lazyLoadObserver = new IntersectionObserver(entries => {
        entries.filter(en => {
            return en.target.tagName === 'IMG' && en.target.className.includes('lazy') && en.isIntersecting;
        }).forEach(en => {
            lazyLoadImgWithDataSet(en.target);
        });
    });
    const parseNoscript = (el) => {
        // their <img plain text is usually in a classless noscript, other noscript tags are used for different hacks
        if (el.className) return;
        const text = el.innerText.trim();
        // there is a scorecard image beacon for tracking, let's skip that shit
        if (text.startsWith('<img') && !text.includes('scorecard')) el.parentNode.innerHTML = text;
    };
    // ---
    const onInit = () => {
        // so retro, very poor man's modules - let's hide requirejs errors
        // we encountered because of the uBlock filter rule
        window.define = () => {};
        const reqProxy = window.require = () => {};
        reqProxy.config = () => {};
    };
    const onLoad = () => {
        // let's be nice and still lazyload their images
        $$('img.lazyload').forEach(img => lazyLoadObserver.observe(img));
        // they do some shenanigans with noscript tags, because seo > sanity
        $$('noscript').forEach(parseNoscript);
        // the "more menu" at the topmost section and in the header is pure js
        hide('#orb-nav-more, div[class*="ToggleContainer"]');
        // the aside is a useless "related" link farm
        hide('aside[class*="AsideWrapper"]');
        // needlessly big header is needlessly big
        hide('.nw-c-news-navigation, div[class*="Masthead"]');
        $('.nw-o-news-branding').style.height = 'auto';
    };
    // ---
    onInit();
    document.addEventListener('DOMContentLoaded', onLoad);
})();
