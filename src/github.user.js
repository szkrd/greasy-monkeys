// ==UserScript==
// @name         GitHub
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  github extras
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

    let prListCss = `
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

// hide unneeded lines
.gm-pr_row_hovercard > div > div.f6 { display: none !!; } // name and date opened
.gm-pr_row_hovercard > div > div.d-flex > div.d-flex > a.d-block { display: none !!; } // pr title
.gm-pr_row_hovercard > div > div.d-flex.mt-2 > div > div.d-flex.flex-items-center { position: absolute; right: 0; margin-top: -6px; opacity: .7; } // branches
.gm-pr_row_hovercard > div > div.d-flex > div.d-flex > div.lh-condensed { height: 15px; font-size: 13px !!; position: relative; top: -5px; } // pr desc
.gm-pr_row_hovercard > div > div.d-flex > span { display: none !!; } // little merged icon
.gm-pr_row_hovercard .gm-hc_labels_line { display: none !!; } // labels
`;

    function modifyPRList () {
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
            $.get(`//github.com/${owner}/${repo}/pull/${pullId}/hovercard`).then(response => {
                response = response.replace(/Jira Ticket\s+/, 'J: ').replace(/Description\s+/, '⟶ ');
                $(`<div class="gm-pr_row_hovercard">${response}</div>`).appendTo(row);
                row.find('.IssueLabel').parent().parent().addClass('gm-hc_labels_line');
                row.find('span:contains("You are assigned and opened")').parent().remove();
                row.find('.gm-pr_row_hovercard span:contains("Review required")').parent().remove();
                row.find('a:contains(Approved)')
                    .addClass('gm-label_colored gm-label_approved')
                    .closest('.gm-pr_row').addClass('gm-pr_row_approved');
                row.find('a:contains(Review required)').addClass('gm-label_colored gm-label_review');
                row.find('a:contains(Changes requested)').addClass('gm-label_colored gm-label_changesreq');
            });
        });
    }

    if (window.location.pathname.endsWith('/pulls')) {
        setTimeout(modifyPRList, 100);
    }
})();
