// ==UserScript==
// @name         Slack condensed
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Mostly decrease list sizes in the sidebar and grey out less important items
// @author       szkrd
// @match        https://app.slack.com/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    const $ = window.jQuery;
    const updateInterval = 1000;
    let isActive = false;
    let css = `
//# jira message boxes
//# ------------------
body.GM_active div.GM_list-item--jira-cloud .c-message_kit__blocks b,
body.GM_active div.GM_list-item--jira-cloud a[data-qa="message_sender_name"],
body.GM_active div.GM_list-item--jira-cloud .c-message_kit__gutter__left img.c-avatar__image,
body.GM_active div.GM_list-item--jira-cloud div.p-section_block__accessory
{ opacity: .5; color: red !important; filter: grayscale(100%); }

//# sidebar
//# -------
body.GM_active .p-channel_sidebar__static_list__item { position: static!!; }
body.GM_active .p-channel_sidebar__channel,
body.GM_active .p-channel_sidebar__link { height: auto!!; line-height: 1!!; font-size: 14px; }
`;
    css = css.replace(/!!/g, ' !important').replace(/\/\/#.*/g, '');
    GM_addStyle(css);

    // hitting F2 (outside a slack managed textfield) toggles the changes
    $(document.body).on('keyup', e => {
        if (e.key === 'F2') { isActive = !isActive; $(e.target).toggleClass('GM_active', isActive); }
    });

    setInterval(() => {
        if (!isActive) return;

        // if the element has the app id of Jira Cloud
        // or it has text with jira-like strings...
        $('[data-stringify-text="Jira Cloud"]').closest('div[role="listitem"]').addClass('GM_list-item--jira-cloud');
        $('div.p-mrkdwn_element > span > b').each((i, el) => {
            const $el = $(el);
            if (/(transitioned a|⟶)/.test($el.text())) {
                $el.closest('div[role="listitem"]').addClass('GM_list-item--jira-cloud');
            }
        });
    }, updateInterval);
})();
