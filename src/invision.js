// ==UserScript==
// @name         Invision
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Timestamp for invision.
// @author       szkrd
// @match        https://*.invisionapp.com/*
// @grant        none
// ==/UserScript==
(function () {
    'use strict';
    const div = document.createElement('div');
    const text = document.createTextNode(new Date() + ' BUD szkrd');
    div.appendChild(text);
    div.addEventListener('click', () => { div.style.display = 'none'; });
    Object.assign(div.style, {
        position: 'fixed',
        zIndex: 9999,
        top: 0,
        left: 0,
        fontSize: 12,
        color: '#fff',
        textShadow: '0 0 1px #333',
        padding: '0 5px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: '0 0 5px 0',
        cursor: 'default'
    });
    setTimeout(() => { document.body.appendChild(div); }, 1000);
})();
