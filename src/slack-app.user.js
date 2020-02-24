// ==UserScript==
// @name         Slack condensed
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Mostly decrease list sizes in the sidebar
// @author       szkrd
// @match        https://app.slack.com/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';
    // const $ = window.jQuery;
    let css = `
// mute avatars
.member_image, img.c-avatar__image, div.message_icon { filter: grayscale(100%); }

// spacers in the sidebar
div.p-channel_sidebar__static_list div[role=presentation]:empty { display: none; }

// ctrl-k "searchbar" nonsense in the sidebar
div.p-channel_sidebar__navigation_bar { background: #fff; margin-top: 0; margin-bottom: 0; height: 6px; border-radius: 3px; opacity: .2; position: relative; top: -3px; }
div.p-channel_sidebar__navigation_bar:hover { opacity: .4; }

// condense list items in the sidebar
div.p-channel_sidebar__static_list .c-virtual_list__item { position: static; }
div.p-channel_sidebar__static_list div[role=listitem] { height: 20px !important; font-size: 13px; }
div.p-channel_sidebar__static_list div[role=listitem] a,
div.p-channel_sidebar__static_list div[role=listitem] button,
div.p-channel_sidebar__static_list div[role=listitem] > div.p-channel_sidebar__section_heading { line-height: 20px !important; height: 20px !important; }

// condensed subsection headings: pull left
div.p-channel_sidebar__static_list div[role=listitem] button { opacity: .6; margin-left: -10px; }

// sidebar list item small X buttons
div.p-channel_sidebar__static_list .p-channel_sidebar__close { zoom: .8; }
div.p-channel_sidebar__static_list .p-channel_sidebar__close > i { top: -4px; left: -3px; position: relative; }

#monkey_textArea { position: fixed; bottom: 26px; right: 90px; z-index: 200; width: 50%; opacity: .8; border-radius: 3px; font-size: 13px; height: 38px;}
`;

    GM_addStyle(css.replace(/\/\/ .*/g, ''));
})();
