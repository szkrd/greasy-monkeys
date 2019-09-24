// ==UserScript==
// @name         Portal-helper
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  tries to detect react component chains (named functions and classes only)
// @author       szkrd
// @match        http://localhost:3001/*
// @require      https://code.jquery.com/jquery-3.2.0.slim.min.js
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    const $ = window.jQuery;
    const css = `
#monkey-react-path { display: none; z-index: 9999; font-family: Arial; font-size: 12px; position: fixed; background: #f2f2f2; padding: 1px 3px; border-top: 1px solid #cfcfcf; border-left: 1px solid #cfcfcf; border-radius: 3px 0 0 0; bottom: 0; right: 0; }
#monkey-react-path a { cursor: pointer; padding: 2px 3px; display: inline-block; }
#monkey-react-path a.hidden { color: #aaa; font-size: 10px; }
#monkey-react-path a:hover { text-decoration: underline; }
`;
    GM_addStyle(css.replace(/\/\/ .*/g, ''));

    // material UI v3 component names (taken from node_modules), unfortunately
    // this is not enough, since some classnames in portal are the same as the ones in material
    const matUiV3CompNames = [
        'AppBar', 'Avatar', 'Backdrop', 'Badge', 'BottomNavigation', 'BottomNavigationAction', 'Box', 'Button',
        'ButtonBase', 'Card', 'CardActionArea', 'CardActions', 'CardContent', 'CardHeader', 'CardMedia', 'Checkbox',
        'Chip', 'CircularProgress', 'ClickAwayListener', 'Collapse', 'CssBaseline', 'Dialog', 'DialogActions', 'DialogContent',
        'DialogContentText', 'DialogTitle', 'Divider', 'Drawer', 'ExpansionPanel', 'ExpansionPanelActions',
        'ExpansionPanelDetails', 'ExpansionPanelSummary', 'Fab', 'Fade', 'FilledInput', 'FormControl', 'FormControlLabel',
        'FormGroup', 'FormHelperText', 'FormLabel', 'Grid', 'GridList', 'GridListTile', 'GridListTileBar', 'Grow',
        'Hidden', 'Icon', 'IconButton', 'Input', 'InputAdornment', 'InputBase', 'InputLabel', 'LinearProgress',
        'Link', 'List', 'ListItem', 'ListItemAvatar', 'ListItemIcon', 'ListItemSecondaryAction', 'ListItemText',
        'ListSubheader', 'Menu', 'MenuItem', 'MenuList', 'MobileStepper', 'Modal', 'NativeSelect', 'NoSsr',
        'OutlinedInput', 'Paper', 'Popover', 'Popper', 'Portal', 'Radio', 'RadioGroup', 'RootRef', 'Select',
        'Slide', 'Snackbar', 'SnackbarContent', 'Step', 'StepButton', 'StepConnector', 'StepContent', 'StepIcon',
        'StepLabel', 'Stepper', 'SvgIcon', 'SwipeableDrawer', 'Switch', 'Tab', 'Table', 'TableBody', 'TableCell',
        'TableFooter', 'TableHead', 'TablePagination', 'TableRow', 'TableSortLabel', 'Tabs', 'TextField', 'Toolbar',
        'Tooltip', 'Typography', 'Zoom',
        'HiddenCss'
    ];
    const hasMuiClass = node => Array.from((node || {}).classList || []).some(className => className.startsWith('Mui'));

    const someHocs = [ 'OutsideClickHandler' ];

    // if a SelectContainer is followed by a Control, then everything's part of @react-select
    // (this is also true for other components)
    const atPattern = (metas, pattern) => {
        const names = metas.map(meta => meta.name);
        const startPos = names.indexOf(pattern[0]);
        return (startPos > -1 && names[startPos + 1] && names[startPos + 1] === pattern[1]) ? startPos : -1;
    };
    const markByPattern = (metas, pattern) => {
        const patternPos = atPattern(metas, pattern);
        if (patternPos > -1) {
            for (let i = patternPos, l = metas.length; i < l; i++) {
                metas[i].show = false;
            }
        }
    };

    // react path
    // ==========

    // get node metadata (mostly the name)
    function getNodeMeta (node) {
        let name;
        const { stateNode } = ((node || {})._debugOwner || {});
        const type = (node._debugOwner || {}).type;
        const stateNodeName = ((stateNode || {}).constructor || {}).name;
        const hasTypeFn = type && (typeof type === 'object' || typeof type === 'function');
        let show = true;
        if (hasTypeFn) {
            name = type.name;
        } else if (stateNodeName) {
            name = stateNodeName;
        } else {
            show = false;
        }
        name = name || '';
        const isMaterial = matUiV3CompNames.includes(name) && hasMuiClass(node.stateNode);
        const isFontAwesomeIcon = name.startsWith('FontAwesome');
        const anotherHoc = someHocs.includes(name);
        if (isMaterial || isFontAwesomeIcon || anotherHoc) {
            show = false;
        }
        // sometimes people mark the withStyles hoc with a postfix
        if (name.endsWith('WithStyles')) {
            name = name.replace(/WithStyles$/, '');
        }
        return { name, show };
    }

    function getElementMeta (element) {
        let meta = { show: false };
        let node;
        for (let key in element) {
            if (key.toLowerCase().includes('reactinternalinstance')) {
                node = element[key];
                meta = getNodeMeta(node);
                break;
            }
        }
        return { node, ...meta };
    }

    function getElementTree (element) {
        let metas = [];
        let $el = $(element);
        while ($el && $el.length && !$el.is('body')) {
            const meta = getElementMeta($el.get(0));
            const name = meta.name;
            if (name && name !== 'Content' && (metas[metas.length - 1] || {}).name !== name) {
                metas.push(meta);
            }
            $el = $el.parent();
        }
        metas = metas.reverse();
        markByPattern(metas, ['Ratio', 'ComponentEnhancer']); // @rc-slider
        markByPattern(metas, ['SelectContainer', 'Control']); // @react-select
        markByPattern(metas, ['DateRangePicker', 'OutsideClickHandler']); // @react-dates
        return metas;
    }

    function createReactPathLogger () {
        const moReactPath = $('<div id="monkey-react-path"></div>');
        moReactPath.prependTo(document.body);
        moReactPath.on('click', (e) => {
            const $el = $(e.target);
            if (!$el.is('a')) {
                return;
            }
            const text = $el.text(); // copy the name of the element to the clipboard
            var copy = function (e) {
                e.preventDefault();
                if (e.clipboardData) {
                    e.clipboardData.setData('text/plain', text);
                } else if (window.clipboardData) {
                    window.clipboardData.setData('Text', text);
                }
            };
            window.addEventListener('copy', copy);
            document.execCommand('copy');
            window.removeEventListener('copy', copy);
        });
        moReactPath.show();
        let throttleTimer;
        $(document).on('mousemove', (e) => {
            clearTimeout(throttleTimer);
            throttleTimer = null;
            throttleTimer = setTimeout(() => {
                const tree = getElementTree(e.target);
                if (tree.length) {
                    const html = tree.map(meta => `<a class="${meta.show ? 'visible' : 'hidden'}">${meta.name}</a>`).join(' ↘ ');
                    moReactPath.html(html);
                }
            }, 500);
        });
        return moReactPath;
    }

    // run
    // ===

    // Startup ↘ App ↘ Layout ↘ Checks ↘ Filter ↘ SwitchWrapper ↘ ReactSwitch
    (() => {
        createReactPathLogger();
    })();
})();
