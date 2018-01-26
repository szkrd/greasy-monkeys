// ==UserScript==
// @name         Slack-W
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Customize slack
// @author       szkrd
// @match        https://wizzairdev.slack.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  // color scheme for copy-pasting:
  // `#343434,#242424,#c8427e,#fff2fa,#242424,#FFFFFF,#d74da5,#DE4C0D`

  function loop () {
    let sbLinkButtons = Array.from(document.querySelectorAll('.p-channel_sidebar__link'));
    sbLinkButtons.forEach(el => {
      if (el.textContent === '+ Add Apps') {
        el.classList.add('add-apps-button');
      }
    });
  }

  let css = `
    // reactions
    .rxn_panel, div.c-reaction_bar { display: none; }

    // icon next to name
    span.ts_tip_float.message_current_status { display: none !important; }

    // mute avatars
    .member_image, img.c-avatar__image,
    div.message_icon { filter: grayscale(100%); }

    // apps section in sidebar
    div[data-qa-channel-sidebar-section-heading="apps"] { display: none; }

    // bloated header
    #client_header { flex-basis: 5px; overflow: hidden; }
    #client_header:hover { flex-basis: 53px; }

    // add apps ad button
    .add-apps-button { display: none; }
  `;

  GM_addStyle(css.replace(/\/\/ .*/g, ''));
  setInterval(loop, 1000);
})();
