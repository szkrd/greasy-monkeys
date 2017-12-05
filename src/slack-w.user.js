// ==UserScript==
// @name         Slack-W
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Customize slack
// @author       szkrd
// @match        https://wizzairdev.slack.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
  'use strict';
  
  // color scheme for copy-pasting:
  // `#343434,#242424,#c8427e,#fff2fa,#242424,#FFFFFF,#d74da5,#DE4C0D`

  let css = `
    // reactions
    .rxn_panel { display: none; }

    // icon next to name
    span.ts_tip_float.message_current_status { display: none !important; }

    // mute avatars
    .member_image,
    div.message_icon { filter: grayscale(100%); }

    // apps section in sidebar
    div[data-qa-channel-sidebar-section-heading="apps"] { display: none; }
  `;

  GM_addStyle(css.replace(/\/\/ .*/g, ''));
})();
