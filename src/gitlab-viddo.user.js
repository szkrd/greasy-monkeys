// ==UserScript==
// @name         Gitlab
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Colorful gitlab!
// @author       szkrd
// @match        https://gitlab.viddo.net/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==
(function () {
  'use strict';

  // add group classes to body
  const currentGroup = $('body').data('page').split(':')[1];
  $('body').addClass('gmg_current-group_' + currentGroup);

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

  let css = `
    // header colors for  merge requests
    body.gmg_current-group_merge_requests.ui-dark header.navbar-gitlab { background: ${gradients.red}; }

    // authors
    body .note-header-author-name, body a.author_link span { display: inline-block; }
    body .note-header-author-name, body a.author_link[href$="rdi"] span { color: tan; }
    body .note-header-author-name, body a.author_link[href$="jko"] span { color: limegreen; }
    body .note-header-author-name, body a.author_link[href$="rga"] span { color: salmon; }
    body .note-header-author-name, body a.author_link[href$="baly"] span { color: pink; }
    body .note-header-author-name, body a.author_link[href$="oth"] span { color: orange; }
    body .note-header-author-name, body a.author_link[href$="ulik"] span { color: deepskyblue; }
    body .note-header-author-name, body a.author_link[href$="nde"] span { color: lightgrey; }
    // +
    body a.user-avatar-link[href$="rdi"] img { box-shadow: 0 0 1px 3px tan; }
    body a.user-avatar-link[href$="jko"] img { box-shadow: 0 0 1px 3px limegreen; }
    body a.user-avatar-link[href$="rga"] img { box-shadow: 0 0 1px 3px salmon; }
    body a.user-avatar-link[href$="baly"] img { box-shadow: 0 0 1px 3px pink; }
    body a.user-avatar-link[href$="oth"] img { box-shadow: 0 0 1px 3px orange; }
    body a.user-avatar-link[href$="ulik"] img { box-shadow: 0 0 1px 3px deepskyblue; }
    body a.user-avatar-link[href$="nde"] img { box-shadow: 0 0 1px 3px lightgrey; }

    // board cards
    body div.board-card-assignee { right: 2px !important; }
    body .board-card-assignee a.user-avatar-link img { width: 25px; height: 25px; }
    body .board-card-title { margin-right: 35px; }
    body .board-card { padding: 2px 10px 2px 8px; }

    // header colors
    body.gmg_repository.ui-dark header.navbar-gitlab { background: ${gradients.red}; }
    body.gmg_issues.ui-dark header.navbar-gitlab { background: ${gradients.green}; }
    body.gmg_projects.ui-dark header.navbar-gitlab { background: ${gradients.purple}; }
    body.gmg_merge_requests.ui-dark header.navbar-gitlab { background: ${gradients.yellow}; }
    body.gmg_todos.ui-dark header.navbar-gitlab { background: ${gradients.blue}; }

    // sidebar colors
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

    // sidebar selected item accent
    .nav-sidebar .sidebar-sub-level-items .active a { color: #000; }
    .nav-sidebar .sidebar-sub-level-items .active { background-color: #ccc; border-radius: 5px; border: 1px solid #777; }

    // misc
    .project-home-panel .project-repo-buttons { background: #aaa; padding: 10px; border-radius: 10px; }
    .breadcrumbs-list { float: right; }
    .breadcrumbs-container { text-align: right; }
    .breadcrumbs-container a { opacity: .3; }
    .breadcrumbs-container a:hover { opacity: 1; }
    body .content-block.emoji-block { float: right; }
    body .boards-list { overflow-x: auto; }
    .board-card-footer button.badge { opacity: .6; box-shadow: 0 0 12px 2px inset #fff; }
    .board-card-footer button.badge:hover { opacity: 1; box-shadow: none; }
    ul.notes.timeline { margin: 52px 0 0 0px; }

    // base
    .btn { background: linear-gradient(to bottom, #eff5f9 0%,#c5d1db 100%); }
    .btn.btn-remove { background: linear-gradient(to bottom, #fffcfc 15%,#ffbfbf 85%); color: ${topColors.red}; }
    .btn.btn-create { background: linear-gradient(to bottom, #e1f2de 16%,#9ad398 86%); color: ${topColors.green}; }
    .btn.btn-remove:hover, .btn.btn-remove:hover *, .btn.btn-create:hover { color: #000 !important; }
    a#state-opened, li.todos-pending a { color: red !important; }
    a#state-closed, li.todos-done a { color: limegreen; }
    a#state-merged { color: blue; }

    // compress
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
    body a.commit-sha { color: #ffc107 !important; }
    body .gfm.gfm-issue { color: #007bff; }
    .navbar-sub-nav li a, .navbar-sub-nav li button { color: #fff; }

    // logo
    h1.title { width: 20px; background-color: rgba(255, 255, 255, .2); }
    h1.title a { display: block; width: 100%; height: 100%; padding 0 !important; margin: 0 !important; }
    h1.title a img { display: none; }

    // newly added
    .btn.gmg-submit { margin-right: 10px; border: 1px solid #444; }
    .gmg_nav-shortcut { opacity: .6; }

    // not really needed, not important to me or just plain obvious
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

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { border-radius: 6px; background-color: rgba(0,0,0,.1); }
    ::-webkit-scrollbar-thumb { border-radius: 6px; background-color: rgba(0,0,0,.1); }

    // trash
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
  $('btn gmg-submit').on('click', () => { $('form.filter-form').get(0).submit(); });

  // add shortcuts to header
  $('.navbar-sub-nav')
    .append('<li class="gmg_nav-shortcut"><a href="/viddo/viddo/boards">ViBo</a></li>')
    .append('<li class="gmg_nav-shortcut"><a href="/viddo/viddo/merge_requests">ViMr</a></li>');

  GM_addStyle(css.replace(/\/\/ .*/g, ''));
})();
