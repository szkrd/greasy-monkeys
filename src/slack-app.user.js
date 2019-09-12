// ==UserScript==
// @name         Slack condensed
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Mostly decrease list sizes in the sidebar
// @author       szkrd
// @match        https://app.slack.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';
    let css = `
// mute avatars
.member_image, img.c-avatar__image, div.message_icon { filter: grayscale(100%); }

// spacers in the sidebar
div[role=presentation]:empty { display: none; }

// ctrl-k "searchbar" nonsense in the sidebar
div.p-channel_sidebar__navigation_bar { background: #fff; margin-top: 0; margin-bottom: 0; height: 6px; border-radius: 3px; opacity: .2; position: relative; top: -3px; }
div.p-channel_sidebar__navigation_bar:hover { opacity: .4; }

// condense list items in the sidebar
div.p-channel_sidebar__static_list div[role=listitem][style="height: 26px;"] { height: 20px !important; font-size: 13px; }
div.p-channel_sidebar__static_list div[role=listitem][style="height: 26px;"] a,
div.p-channel_sidebar__static_list div[role=listitem][style="height: 26px;"] button,
div.p-channel_sidebar__static_list div[role=listitem][style="height: 26px;"] > div.p-channel_sidebar__section_heading { line-height: 20px !important; height: 20px !important; }

// condensed subsection headings: pull left
div.p-channel_sidebar__static_list div[role=listitem][style="height: 26px;"] button { opacity: .6; margin-left: -10px; }

// sidebar list item small X buttons
div.p-channel_sidebar__static_list .p-channel_sidebar__close { zoom: .8; }
div.p-channel_sidebar__static_list .p-channel_sidebar__close > i { top: -4px; left: -3px; position: relative; }
`;

    GM_addStyle(css.replace(/\/\/ .*/g, ''));
})();
