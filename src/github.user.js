// ==UserScript==
// @name         GitHub
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  github plano extras
// @author       szkrd
// @match        https://github.com/planorama/*
// @require      https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.4.1.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    const $ = window.jQuery;
    // const INTERVAL_TIME = 2000;
    // const fetchHeaderHtml = { headers: { 'Content-Type': 'text/html' }, method: 'GET', credentials: 'include' };

    const prListCss = `
// colorize action texts
.gm-label_colored { display: inline-block; padding: 0 3px; border-radius: 4px; }
.gm-label_approved { background-color: palegreen; }
.gm-pr_row_approved { background-color: #dfd; }
.gm-label_review { background-color: #ff9; }
.gm-label_changesreq { background-color: pink; }

// pr row and injected hovercard
.gm-pr_row { position: relative; }
.gm-pr_row_hovercard > div { padding: 0 45px !!; } // this is the main hovercard

// remove tailwind crap
.gm-issue_list .mt-1 { margin-top: 0 !!; }
.gm-pr_row_hovercard .mt-2 { margin-top: 0 !!; }
.gm-pr_row_hovercard .mt-3 { margin-top: 2px !!; }
.gm-pr_row_hovercard .pt-3 { padding-top: 0 !!; }
.gm-pr_row_hovercard .px-3 { padding-left: 0 !!; }
.gm-pr_row_hovercard .ml-n3 { margin-left: 0 !!; }
.gm-pr_row_hovercard .mr-n3 { margin-right: 0 !!; }
.gm-pr_row_hovercard .border-top { border-top: 0 !!; }

// hide unneeded lines, customize elements inside the hovercard
.gm-pr_row_hovercard > div > div.f6 { display: none !!; } // name and date opened
.gm-pr_row_hovercard > div > div.d-flex > div.d-flex > a.d-block { display: none !!; } // pr title
.gm-pr_row_hovercard > div > div.d-flex.mt-2 > div > div.d-flex.flex-items-center { position: absolute; right: 0; margin-top: -6px; opacity: .7; } // branches
.gm-pr_row_hovercard > div > div.d-flex > div.d-flex > div.lh-condensed { height: 15px; font-size: 13px !!; position: relative; top: -5px; } // pr desc
.gm-pr_row_hovercard > div > div.d-flex > span { display: none !!; } // little merged icon
.gm-pr_row_hovercard .gm-hc_labels_line { display: none !!; } // labels

// the subpage version
//.gm-pr_row_subPage a { pointer-events: none; }
.gm-pr_row_subPage { padding: 0 12px; }
.gm-pr_row_subPage button[name="re_request_reviewer_id"] { display: none !!; }
.gm-pr_row_subPage > p { display: inline-block; padding-right: 5px; }
.gm-pr_row_subPage > p.mt-2 { color: #aaa; font-size: 13px; } // the text about what's needed to merge
.gm-pr_row_subPage > p span.reviewers-status-icon { margin: 0 5px; } // the little checkmark, orange dot or speech bubble
.gm-pr_row_subPage a.assignee span { display: none; }
.gm-pr_row_subPage svg.octicon.octicon-comment.text-gray { opacity: .5; }
.gm-pr_row_subPage svg.octicon.octicon-primitive-dot { opacity: .5; filter: grayscale(100%); }

.gm-pr_row_subPage .gm-jira_link { position: absolute; top: -10px; right: 0; padding: 0; filter: grayscale(1); opacity: .2; font-size: 20px; font-family: arial; }
.gm-pr_row_subPage .gm-jira_link:hover { opacity: 1; filter: grayscale(0); }
.gm-pr_row_subPage .gm-jira_link:hover a { text-decoration: none; }
.gm-pr_row_subPage .gm-timeline_badges { display: inline-flex; }
.gm-pr_row_subPage .gm-timeline_badges > .TimelineItem-badge { margin: 0; width: 32px; height: 32px; zoom: .5; }
.gm-pr_row_subPage .gm-timeline_badges > .gm-timeline_badge_single { opacity: .4; width: 18px; background-color: transparent; }
.gm-pr_row_subPage .gm-timeline_badges > .gm-timeline_badge_single:hover { opacity: 1; }
`;

    function textToColor (str) {
        for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash)); // eslint-disable-line
        const color = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1 * 16777216)).toString(16);
        return '#' + Array(6 - color.length + 1).join('0') + color;
    }

    function modifyPRList () {
        const useHoverCard = false;
        const useSubPage = true;

        const urlParts = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
        const owner = urlParts[0];
        const repo = urlParts[1];

        // helper classes and custom css
        $('body').addClass('gm-prs_page');
        $('div[id^=issue_]').eq(0).parent().addClass('gm-issue_list');
        GM_addStyle(prListCss.replace(/\/\/ .*/g, '').replace(/!!/g, '!important'));

        // add the info from the hovercard to each PR line
        $('div[id^=issue_]').each(function (i) {
            const row = $(this);
            row.addClass('gm-pr_row');
            const pullId = parseInt(row.attr('id').replace(/^issue_/, ''), 10);
            // github expects an xmlhttp call (not a fetch)
            if (useHoverCard) {
                $.get(`//github.com/${owner}/${repo}/pull/${pullId}/hovercard`).then(response => {
                    response = response.replace(/Jira Ticket\s+/, 'J: ').replace(/Description\s+/, '⟶ ');
                    $(`<div class="gm-pr_row_hovercard">${response}</div>`).appendTo(row);
                    row.find('.IssueLabel').parent().parent().addClass('gm-hc_labels_line');
                    row.find('span:contains("You are assigned and opened")').parent().remove();
                    row.find('.gm-pr_row_hovercard span:contains("Review required")').parent().remove();
                });
            }

            // okay, the hovercard kinda sucks, let's try something else
            if (useSubPage) {
                $.get(`//github.com/${owner}/${repo}/pull/${pullId}/`).then(response => {
                    response = response.replace(/js-hovercard-left/g, 'js-hovercard-right');
                    const html = $(response);
                    // simply copied using inspector: copy css path
                    const sidebarSelector = '#partial-discussion-sidebar > div.discussion-sidebar-item.sidebar-assignee.js-discussion-sidebar-item.position-relative > form > span > p';
                    const container = $('<div class="gm-pr_row_subPage"></div>');
                    container.appendTo(row);
                    html.find(sidebarSelector).appendTo(container);
                    // add link to jira issue (top right triangle)
                    const jiraLink = html.find('a[href*="atlassian.net/browse"]');
                    if (jiraLink.length) {
                        $(`<p class="gm-jira_link"><a target="_blank" href="${jiraLink.attr('href')}">◥</a></p>`).appendTo(container);
                    }
                    const timelineBadges = html.find('.js-timeline-item .TimelineItem-badge');
                    timelineBadges.each((i, el) => {
                        if (el.className.trim() === 'TimelineItem-badge') $(el).addClass('gm-timeline_badge_single');
                    });
                    if (timelineBadges.length) {
                        const badgeList = $('<p class="gm-timeline_badges"></p>');
                        badgeList.appendTo(container);
                        timelineBadges.appendTo(badgeList);
                    }
                });
            }

            // unrelated to the hover card
            row.find('a:contains(Approved)')
                .addClass('gm-label_colored gm-label_approved')
                .closest('.gm-pr_row').addClass('gm-pr_row_approved');
            row.find('a:contains(Review required)').addClass('gm-label_colored gm-label_review');
            row.find('a:contains(Changes requested)').addClass('gm-label_colored gm-label_changesreq');

            // colorize by username
            const userEl = row.find('a.muted-link[data-hovercard-type="user"]');
            const userName = userEl.text().trim();
            userEl.addClass('gm-link_opened_by');
            userEl.closest('.gm-pr_row').css({ borderLeft: `4px solid ${textToColor(userName)}` });
        });
    }

    if (window.location.pathname.endsWith('/pulls')) {
        setTimeout(modifyPRList, 100);
    }
})();
