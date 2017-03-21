// ==UserScript==
// @name         slashdot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Once a great site, now just a shadow of its former self.
// @author       szkrd
// @match        https://*.slashdot.org/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
'use strict';
// runat: document start

let css = `
  // my who-cares list
  .js-hide,
  ul.nav-site,
  .story-views,
  .main-content img,
  .message-bar,
  .nav-secondary-wrap,
  .dept-text,
  #clickgen,
  article[class*=ntv-sponsored],
  #firehose article aside.view_mode,
  .nav-primary a.btn.btn-success,
  footer,
  section.bq,
  .deals-wrapper,
  #slashboxes { display: none !!!; }

  #firehose { padding-top: 20px; }

  .main-content { margin-right: 0 !important; border-radius: 5px; }

  body { max-width: 1200px; margin: 0 auto; }

  section#besttabs { margin-bottom: 10px !!!; }

  #firehoselist .details a { font-weight: normal; }

  // nope, we are not feeding the trolls
  .inline_comment { display: none; }
  .by a, .otherdetails a { visibility: hidden; }
`;

GM_addStyle(css.replace(/\/\/ .*/g, '').replace(/!!!/g, '!important'));

// case insensitive contains pseudo
$.expr[':'].containsi = $.expr.createPseudo((arg) =>
  (elem) => $(elem).text().toUpperCase().includes(arg.toUpperCase())
);

$(() => {
  $(`strong:containsi("The Fine Print:")`).closest('aside').addClass('js-hide');
});

})();