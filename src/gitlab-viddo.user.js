// ==UserScript==
// @name         Gitlab
// @namespace    http://tampermonkey.net/
// @version      0.5.2
// @description  Colorful gitlab!
// @author       szkrd
// @match        https://gitlab.viddo.net/*
// @require      https://code.jquery.com/jquery-3.2.0.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';

    // add group classes to body
    const $ = window.$;
    const gon = unsafeWindow.gon || {}; // "gon" is a gitlab global
    const $body = $('body');
    const currentGroup = $body.data('page').split(':')[1];
    $body.addClass('gmg_current-group_' + currentGroup);

    const groups = {
        projects: ['show', 'activity', 'cycle_analytics'],
        repository: ['tree', 'commits', 'branches', 'tags', 'graphs', 'network', 'compare'],
        issues: ['issues', 'boards', 'labels', 'milestones'],
        merge_requests: ['merge_requests'],
        todos: ['todos']
    };

    // add extra helper class to body
    Object.keys(groups).forEach(key => {
        if (groups[key].includes(currentGroup)) {
            $('body').addClass(`gmg_${key}`);
        }
    });

    const gradients = {
        red: 'linear-gradient(to bottom, #a90329 0%,#470007 100%)',
        purple: 'linear-gradient(to bottom, #843f73 1%,#541f46 50%,#54003a 51%,#54153f 100%)',
        green: 'linear-gradient(to bottom, #87933e 0%,#67841e 50%,#67841e 50%,#4c7000 51%,#577019 100%)',
        yellow: 'linear-gradient(to bottom, #a59766 0%,#a88734 50%,#8c6400 52%,#8c7b52 100%)',
        blue: 'linear-gradient(to bottom, #5c98c9 0%,#33648e 50%,#1f5489 51%,#103875 100%)'
    };

    const topColors = {
        red: '#a90329',
        purple: '#54003a',
        green: '#87933e',
        yellow: '#a88734',
        blue: '#103875'
    };

    const authorColors = {
        rdi: 'tan',
        jko: 'limegreen',
        rga: 'salmon',
        baly: 'pink',
        abas: 'dimgray',
        etal: 'lightseagreen',
        oth: 'orange',
        ulik: 'deepskyblue',
        nde: 'lightgrey'
    };

    const authorSelfColor = localStorage.getItem('authorSelfColor');
    const currentUserName = gon.current_username;
    if (currentUserName && authorSelfColor) {
        authorColors[currentUserName] = authorSelfColor;
    }

    const authorColorsCss = '\n' + Object.keys(authorColors).map(name => {
        const color = authorColors[name];
        return `body .note-header-author-name, body a.author_link[href$="${name}"] span { color: ${color}; }\n` +
            `body a.user-avatar-link[href$="${name}"] img { box-shadow: 0 0 1px 3px ${color}; }`;
    }).join('\n') + '\n';

    let css = `
// authors
// =======
body .note-header-author-name, body a.author_link span { display: inline-block; }
${authorColorsCss}

// board cards
// ===========
body div.board-card-assignee { right: 2px !important; }
body .board-card-assignee a.user-avatar-link { position: absolute; top: 6px; right: 5px;}
body .board-card-assignee a.user-avatar-link img { width: 25px; height: 25px; }
body .board-card-header { margin-right: 35px; }
body .board-card { padding: 2px 10px 2px 8px; }
body .boards-list { overflow-x: auto; }

// header bar colors
// =================
body.gmg_repository header.navbar-gitlab { background: ${gradients.red}; }
body.gmg_issues header.navbar-gitlab { background: ${gradients.green}; }
body.gmg_projects header.navbar-gitlab { background: ${gradients.purple}; }
body.gmg_merge_requests header.navbar-gitlab { background: ${gradients.yellow}; }
body.gmg_todos header.navbar-gitlab { background: ${gradients.blue}; }

// left sidebar unique colors
// ==========================
body.gmg_repository .nav-sidebar .home.active { box-shadow: inset 5px 0 0 ${topColors.red} !important; }
body.gmg_issues .nav-sidebar .home.active { box-shadow: inset 5px 0 0 ${topColors.green} !important; }
body.gmg_projects .nav-sidebar .home.active { box-shadow: inset 5px 0 0 ${topColors.purple} !important; }
body.gmg_merge_requests .nav-sidebar .home.active { box-shadow: inset 5px 0 0 ${topColors.yellow} !important; }
body.gmg_todos .nav-sidebar .home.active { box-shadow: inset 5px 0 0 ${topColors.blue} !important; }
a.shortcuts-tree span.nav-item-name { color: firebrick; }
a.shortcuts-issues span.nav-item-name { color: forestgreen; }
a.shortcuts-project span.nav-item-name { color: mediumvioletred; }
a.shortcuts-merge_requests span.nav-item-name { color: darkgoldenrod; }
a.shortcuts-todos span.nav-item-name { color: dodgerblue; }

// left sidebar selected item accent
.nav-sidebar .sidebar-sub-level-items .active a { color: #000; }
.nav-sidebar .sidebar-sub-level-items .active { background-color: #ccc; border-radius: 5px; border: 1px solid #777; }

// breadcrumbs
// ===========
.breadcrumbs-list { float: right; }
.breadcrumbs-container { text-align: right; }
.breadcrumbs-container a { opacity: .3; }
.breadcrumbs-container a:hover { opacity: 1; }

// tag badges in board cards
// =========================
.board-card-footer button.badge { opacity: .8; }
.board-card-footer button.badge:hover { opacity: 1; }

// open-pending-closed-done-merged states
// ======================================
a#state-opened, li.todos-pending a { color: red !important; }
a#state-closed, li.todos-done a { color: limegreen; }
a#state-merged { color: blue; }

// compress
// ========
.navbar-gitlab .container-fluid .nav>li>a { margin: 0; padding: 6px 4px; } // top right buttons
ul.projects-list > li { padding: 0; line-height: 16px; }
nav.breadcrumbs { min-height: 30px; }
body table.table tr td { padding: 2px; }
body .info-well .well-segment { padding: 9px; }
body .event-item: { padding: 2px 0 2px 40px; }
.event-item .event-body,
.event-item .event-body .content-list event_commits,
.event-item .event-body * { font-size: 11px; }
body li.issue { padding: 4px 0 !important; }
.right-sidebar .block { padding: 9px 0; }
body li.timeline-entry .timeline-entry-inner { padding: 2px; border: 0; }
.board.is-expandable.is-collapsed { margin: 0 -13px; }
.board.is-collapsed .board-inner { font-size: 10px; font-weight: normal; }
.board.is-collapsed { width: 32px; opacity: .6; }
body .board-card-footer { margin: -5px 0 0; }

// colorize
// ========
body a.commit-sha { color: #ffc107 !important; }
body .gfm.gfm-issue { color: #007bff; }
.navbar-sub-nav li a, .navbar-sub-nav li button { color: #fff; }
body #merge-requests > .card-slim { box-shadow: 0 0 2px #1aaa55; border: 1px solid #1aaa55; }

// newly added
// ===========
.btn.gmg-submit { margin-right: 10px; border: 1px solid #444; }
.gmg_nav-shortcut { opacity: .6; }

// left sidebar unimportant items
// ==============================
.nav-sidebar a.shortcuts-project-cycle-analytics,
.nav-sidebar a[href*="viddo/graphs"],
.nav-sidebar a[href*="viddo/labels"],
.nav-sidebar a[href*="viddo/milestones"],
.nav-sidebar a[href*="viddo/pipelines"],
.nav-sidebar a[href*="viddo/environments"],
.nav-sidebar a[href*="viddo/wikis"],
.nav-sidebar a[href*="viddo/settings/members"],
.nav-links a[href$="/explore"],
.nav-links li.md-header-toolbar.active
{ opacity: .2; }
.user-access-role { opacity: .3; }

// thinner scrollbars
// ==================
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { border-radius: 6px; background-color: rgba(0,0,0,.1); }
::-webkit-scrollbar-thumb { border-radius: 6px; background-color: rgba(0,0,0,.1); }

// merge request info checker and content (injected)
// =================================================
.board-card-number { cursor: pointer; }
.board-card-number:hover { color: blue; text-decoration: underline; }
.gmg_mr_id { opacity: .5; }
.gmg_mr_wip { color: red; }
.gmg_mr_final { color: seagreen; }
.gmg_mr_final::after { content: " 👁"; }
.gmg_mr_merged { color: green; }
.gmg_mr_merged::after { content: " ✅"; }
.gmg_mr_none { color: gray; }

// create merge request
// ====================
.new-branch-col { text-align: inherit !important; } // move it left to the place of like-dislike emoji
.btn.js-create-merge-request.btn-success.btn-inverted { // we never branch from master, so this button is a real pain
  pointer-events: none;
}

// issue page navbar extra buttons
// ===============================

.gmg-board-link.gmg-board-link--mr a {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23fff' d='M11 11.268V5a1 1 0 0 0-1-1H9v.793a.5.5 0 0 1-.854.353L6.354 3.354a.5.5 0 0 1 0-.708L8.146.854A.5.5 0 0 1 9 1.207V2h1a3 3 0 0 1 3 3v6.268a2 2 0 1 1-2 0zM3 4.732a2 2 0 1 1 2 0v6.536a2 2 0 1 1-2 0V4.732zM4 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'/%3E%3C/svg%3E") center center no-repeat;
  background-size: 22px; width: 22px; height: 22px; display: inline-block; padding: 14px; cursor: pointer; position: relative; top: 3px; opacity: .7;
}

// trash
// =====
.block div.time_tracker,
.block.issuable-sidebar-item.confidentiality,
.block.project-reference,
.block.due_date,
.project-full-name .namespace-name,
div.avatar-container,
.project-avatar,
.context-header,
.collapse-text,
.js-noteable-awards,
a.dashboard-shortcuts-snippets { display: none !important; }
`;

    // add a submit button to the board filter
    $('#js-add-list')
        .prepend('<button class="btn gmg-submit">Submit</submit>');

    // fetch all mr-s for visible mr ids
    const fetchAllMrsForVisibleLinks = () => $('.board-card-number').filter(':visible').click();
    $(document).keypress('m', (event) => {
        if (event.ctrlKey) {
            fetchAllMrsForVisibleLinks();
        }
    });

    // add a button to fetch mrs
    const isBoardView = $('body .boards-list').length && window.location.pathname.endsWith('/boards');
    if (isBoardView) {
        const link = $('<li class="gmg-board-link gmg-board-link--mr" title="⚡ fetch visible mrs"><a id="gmg-board-link--mr"></a></li>');
        link.appendTo('.list-unstyled.navbar-sub-nav');
        link.on('click', fetchAllMrsForVisibleLinks);
    }

    // add card title tiny button for getting merge requests
    $(document.body).on('click', (event) => {
        const el = $(event.target);
        if (!el.is('.board-card-number')) {
            return;
        }
        if (event.shiftKey) { // refresh all in this column
            el.closest('.board-list').find('.board-card-number').filter(':visible').click();
            return false;
        }
        const issueId = el.text().replace(/[^\d]/g, '');
        const projectUriPrefix = el.closest('li').find('a').attr('href').replace(/\/issues.*/, '');
        if (!issueId || !projectUriPrefix) {
            console.error('issue id or project location not found');
            return;
        }
        const discUrl = `${projectUriPrefix}/issues/${issueId}/discussions.json?notes_filter=0`; // gitlab saves this value
        $.getJSON(discUrl, (discussion) => {
            const notes = (discussion || []).reduce((acc, item) => {
                acc = acc.concat(item.notes);
                return acc;
            }, []);
            const mergeRelated = notes.filter(item => (item.note || '').includes('mentioned in merge request'));
            mergeRelated.forEach(item => {
                item.mrId = item.note.replace(/[^\d]/g, '');
                item.mrUrl = `${projectUriPrefix}/merge_requests/${item.mrId}`;
                item.mrIsOpen = !item.note_html.includes('(closed)');
                item.mrMetaUrlRaw = `${projectUriPrefix}/merge_requests/${item.mrId}.json`;
                item.mrMetaUrl = item.mrMetaUrlRaw + '?serializer=sidebar';
            });
            // create injection target below card item footer
            let dumpTarget = el.closest('li').find('.board-card-injected').eq(0);
            if (!dumpTarget.length) {
                dumpTarget = $('<div class="board-card-injected"></div>');
                dumpTarget.appendTo(el.closest('li'));
            }
            // render ul li for merge request ids
            const openMrs = mergeRelated.filter(item => item.mrIsOpen);
            const mrList = openMrs.map(item => {
                return `<li class="gmg_mr" data-mrid="${item.mrId}">` +
                    `<a href="${item.mrUrl}" class="gmg_mr_id">${item.mrId}:</a> ` +
                    `<span class="gmg_mr_meta">...</span>` +
                    `</li>`;
            });
            if (!mrList.length) {
                mrList.push('<li class="gmg_mr gmg_mr_none">no mr found</li>');
            }
            dumpTarget.html(`<ul>${mrList.join('')}</ul>`);

            // fetch mrs one by one along with their metadata
            openMrs.forEach(item => {
                $.getJSON(item.mrMetaUrl, mrMeta => {
                    const assigneeName = (mrMeta.assignee || {}).name || 'unassigned';
                    const isHoncho = assigneeName.toLowerCase().includes('paul');
                    $.getJSON(item.mrMetaUrlRaw, mrMetaRaw => {
                        const isMerged = mrMetaRaw.state === 'merged';
                        const isWip = mrMetaRaw.title.startsWith('WIP:');
                        const wipText = isWip ? '🔨 WIP' : '';
                        $(`[data-mrid=${item.mrId}]`)
                            .toggleClass('gmg_mr_wip', isWip)
                            .toggleClass('gmg_mr_final', isHoncho)
                            .toggleClass('gmg_mr_merged', isMerged)
                            .find('.gmg_mr_meta')
                            .text(wipText + ' ' + assigneeName);
                    });
                });
            });
        });
        return false;
    });

    GM_addStyle(css.replace(/\/\/ .*/g, ''));
})();
