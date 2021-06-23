// ==UserScript==
// @name         ingatlan-com
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Fix some annoyances on ingatlan.com
// @author       szkrd
// @match        https://ingatlan.com/*
// @icon         https://www.google.com/s2/favicons?domain=ingatlan.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const $ = window.jQuery;
    if (!$) return console.log('USER SCRIPT: NO JQUERY');

    const css = `
.br_hitel_panel_icom, div[data-url*="hirdetotabla"] { display: none!!; }
// ---
.monkey-loading { box-shadow: 0 0 10px inset salmon; }
textarea.monkey { position: absolute; left: 0; fontSize: 11px; width: 200px; height: 15px; line-height: 15px; padding: 0; border: 1px solid silver; }
button.monkey { position: absolute; left: 0; height: 20px; line-height: 18px; border: 1px inset gray; padding: 0; margin: 0; display: block; border-radius: 3px; cursor: pointer; min-width: 100px; }
// ---
textarea#monkey-output { top: 0; height: 45px; }
button#monkey-search-fix { top: 0; }
button#monkey-header-toggle { top: 20px; }
body.monkey-hide-header .site__header { display: none!!; }
body.monkey-hide-header #szukito { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; } // do NOT hide this crap or else the map will show broken results
body.monkey-hide-header .site__content, body.monkey-hide-header #supportive-list { height: 100%!!; }
`.replace(/\/\/ .*/g, '').replace(/\s?!!/g, ' !important');

    const main = () => {
        $('head').append(`<style type="text/css">${css}</style>`);
        const body = $('body');
        const header = $('header').first();
        const area = $('.parameter.parameter-area-size .parameter-value').text();
        // subpage with flat details: create a textarea for copying essential details
        if (area) {
            const room = $('.parameter.parameter-room .parameter-value').text();
            const price = $('.parameter.parameter-price .parameter-value').text();
            const partner = $('.partner .call-the-advertiser').text();
            $('button.show-number').click();
            setTimeout(() => {
                const phone = $('.number.is-phone-number-visible').first().text();
                let text = `${area} | ${room}sz | ${price} | ${partner || '?'} | ${phone || '?'}`;
                text = text.replace(/ \+ /g, '+').replace('millió', 'M').replace('Ft', '').replace(/\s+/g, ' ').trim();
                const output = $('<textarea id="monkey-output" class="monkey"></textarea>');
                const urlId = window.location.href.replace(/.*\//, '');
                if (urlId && /^\d+$/.test(urlId)) text = `https://ingatlan.com/${urlId}\n${text}`;
                output.val(text);
                output.on('click', () => { output[0].select(); });
                output.appendTo(header);
            }, 1000);
        }
        // left sidebar with selected map item details: these assholes _sometimes_ will show even the hidden items
        // so let's create a button to hide the _hidden_ crap (TODO: do we want the same for the map-list?)
        const isMapPage = $('#map-list').length > 0;
        if (isMapPage) {
            const button = $('<button id="monkey-search-fix" class="monkey">fix over list</button>');
            const maxThreads = 5; // play nicely, but I intentionally am not caching the results
            const loaderClass = 'monkey-loading';
            button.appendTo(body);
            button.on('click', () => {
                $('#overlist').find('.list-element:visible()').each((i, el) => {
                    el = $(el);
                    const id = $(el).data('id');
                    if (!id) return;
                    setTimeout(() => {
                        el.addClass(loaderClass);
                        $.getJSON(`https://ingatlan.com/detailspage/api/${id}`, result => {
                            el.removeClass(loaderClass);
                            if (result.is_hidden) el.hide();
                        });
                    }, Math.floor(i / maxThreads) * 1000);
                });
            });
        }
        // add toggle header part, so that I can see the fucking map on my macbook
        if (isMapPage) {
            const button = $('<button id="monkey-header-toggle" class="monkey">toggle header</button>');
            button.appendTo(body);
            button.on('click', () => {
                $('body').toggleClass('monkey-hide-header');
            });
        }
    };
    setTimeout(main, 2000);
})();
