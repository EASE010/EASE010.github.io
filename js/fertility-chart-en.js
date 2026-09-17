/*
    Total / one-child / second-child fertility rate, 2006-2020 (English).

    Replaces a chart that was hosted on dycharts.com. That embed stamped a
    watermark over the plot (its own saved config says watermarkDisplay.show =
    false, so the watermark was added at render time and could not be turned
    off), and it was authored on a 600x470 canvas while the slot in the article
    is 400x300 — a 1.5x horizontal / 1.57x vertical squash. This draws it with
    D3 at the slot's real size, so nothing is scaled.

    Lives in its own file so the article can draw the chart inline rather than
    through an <iframe>, which gave the block its own scroll context. Every
    selector below is scoped under .fx-chart and the custom properties are
    prefixed --fx-, because these styles now share a document with the article:
    an unscoped `text { ... }` rule would repaint every SVG on the page.
    Fertility_EN.html loads this same script for previewing the chart alone, so
    the data and styling here are the single source of truth.

    Data, y-range [0.3, 1.9] and 2px lines are carried over from the original
    chart's saved configuration; the palette was re-derived (see SERIES below).
    The title, the definitions, the legend and the source note live in the
    article's background image (PICS/0615生育率图/【英】生育率.png); this file
    draws only the plot that sits inside it.

    Usage:  initFertilityChartEN({ container: 'someDivId' })
*/
(function (global) {
    'use strict';

    // Source: www.stats.gov.cn; www.kylc.com; Recent Levels and Trends of
    // Fertility in China. One-child and second-child rates are unavailable for
    // 2018-2020, which is the gap the background image's footnote refers to.
    // Palette darkened from the published #ff9966 / #99cc99 / #339966, which
    // failed on the cream surface: the old light green measured 1.66:1 contrast
    // with chroma 0.089 (it read as grey), and both light tones sat above the
    // lightness band. These three clear 3:1 contrast, the chroma floor and an
    // OKLab CVD separation of >=8 on every pair. The legend dots in
    // PICS/0615生育率图/【英】生育率.png were recoloured to match.
    var SERIES = [
        { key: 'total',  name: 'Total Fertility Rate',        short: 'Total',        color: '#db6f35' },
        { key: 'first',  name: 'One-child Fertility Rate',    short: 'One-child',    color: '#379f6b' },
        { key: 'second', name: 'Second-child Fertility Rate', short: 'Second-child', color: '#336d36' }
    ];

    var ROWS = [
        { year: 2006, total: 1.625, first: 0.899, second: 0.581 },
        { year: 2007, total: 1.691, first: 0.924, second: 0.619 },
        { year: 2008, total: 1.714, first: 0.939, second: 0.617 },
        { year: 2009, total: 1.677, first: 0.904, second: 0.614 },
        { year: 2010, total: 1.637, first: 0.892, second: 0.591 },
        { year: 2011, total: 1.613, first: 0.882, second: 0.574 },
        { year: 2012, total: 1.781, first: 0.955, second: 0.658 },
        { year: 2013, total: 1.554, first: 0.807, second: 0.593 },
        { year: 2014, total: 1.670, first: 0.809, second: 0.697 },
        { year: 2015, total: 1.410, first: 0.616, second: 0.643 },
        { year: 2016, total: 1.770, first: 0.668, second: 0.943 },
        { year: 2017, total: 1.719, first: 0.540, second: 1.013 },
        { year: 2018, total: 1.690, first: null,  second: null  },
        { year: 2019, total: 1.520, first: null,  second: null  },
        { year: 2020, total: 1.300, first: null,  second: null  }
    ];

    // Geometry is tuned for this exact box: the margins, the 9px axis type and
    // "every other year" tick density all assume 400x300.
    var W = 400, H = 300;
    var M = { top: 14, right: 46, bottom: 26, left: 32 };

    var STYLE_ID = 'fx-chart-styles';
    var CSS = [
        '.fx-chart {',
        '    --fx-surface: #f6f4e7;',   /* matches the article background, so there is no seam */
        '    --fx-grid: #e6e1cd;',      /* one step off the surface, per chart chrome */
        '    --fx-axis: #cfc9b4;',
        '    --fx-ink-muted: #8a8474;',
        '    --fx-ink: #5a554a;',
        '    position: relative;',
        '    width: ' + W + 'px; height: ' + H + 'px;',
        '    background: var(--fx-surface);',
        '    font-family: "Segoe UI", Frutiger, "Helvetica Neue", Helvetica, Arial, sans-serif;',
        '    -webkit-font-smoothing: antialiased;',
        '}',
        '.fx-chart svg { display: block; }',
        '.fx-chart text { fill: var(--fx-ink-muted); font-size: 9px; }',
        '.fx-chart .fx-grid line { stroke: var(--fx-grid); stroke-width: 1; shape-rendering: crispEdges; }',
        '.fx-chart .fx-baseline { stroke: var(--fx-axis); stroke-width: 1; shape-rendering: crispEdges; }',
        '.fx-chart .fx-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }',
        /* The 2px ring is the surface colour, so dots stay legible where they
           cross a line or each other. */
        '.fx-chart .fx-dot { stroke: var(--fx-surface); stroke-width: 2; }',
        '.fx-chart .fx-end-label { fill: var(--fx-ink); font-size: 9.5px; }',
        '.fx-chart .fx-crosshair { stroke: var(--fx-ink-muted); stroke-width: 1; opacity: 0; shape-rendering: crispEdges; }',
        '.fx-chart .fx-hover-dots { opacity: 0; }',
        '.fx-chart .fx-hit { fill: transparent; cursor: crosshair; }',
        /* Keyboard users get a visible indicator; the plot rect is the focus target. */
        '.fx-chart .fx-hit:focus-visible { outline: 2px solid var(--fx-ink-muted); outline-offset: 2px; }',

        '.fx-chart .fx-tip {',
        '    position: absolute;',
        /* Anchored at the origin until a hover positions it, so it never takes
           a static position below the svg and stretches the container. */
        '    top: 0; left: 0;',
        '    pointer-events: none;',
        '    opacity: 0;',
        '    transition: opacity .12s;',
        '    background: #fffdf5;',
        '    border: 1px solid #e0dac4;',
        '    border-radius: 3px;',
        '    padding: 5px 7px;',
        '    font-size: 10px;',
        '    color: var(--fx-ink-muted);',
        '    box-shadow: 0 1px 4px rgba(90, 85, 74, .16);',
        '    white-space: nowrap;',
        '    z-index: 2;',
        '}',
        '.fx-chart .fx-tip .fx-year { font-weight: 700; color: var(--fx-ink); margin-bottom: 3px; font-size: 10.5px; }',
        '.fx-chart .fx-tip table { border-collapse: collapse; }',
        '.fx-chart .fx-tip td { padding: 1px 0; vertical-align: middle; }',
        /* A short stroke of the series colour keys each row — at tooltip density
           a filled box is data-weight ink doing a label's job. */
        '.fx-chart .fx-tip td.fx-key { width: 12px; }',
        '.fx-chart .fx-tip td.fx-key i { display: block; width: 10px; height: 2px; border-radius: 1px; }',
        '.fx-chart .fx-tip td.fx-name { padding-right: 8px; }',
        /* Value leads: the strong, high-contrast element; the name is secondary. */
        '.fx-chart .fx-tip td.fx-val { font-weight: 700; color: var(--fx-ink); text-align: right; font-variant-numeric: tabular-nums; }',

        /* Table view: every value stays reachable without hovering.
           This wraps the <table> in a div because a table ignores
           width/height:1px and lays itself out at full size — applied to the
           table directly it occupied ~569x689 and stretched the document.
           overflow:hidden on a positioned 1x1 box keeps it out of the scroll area. */
        '.fx-chart .fx-sr-only {',
        '    position: absolute; top: 0; left: 0;',
        '    width: 1px; height: 1px;',
        '    padding: 0; overflow: hidden;',
        '    clip: rect(0 0 0 0); white-space: nowrap; border: 0;',
        '}'
    ].join('\n');

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) { return; }
        var el = document.createElement('style');
        el.id = STYLE_ID;
        el.textContent = CSS;
        document.head.appendChild(el);
    }

    var uid = 0;

    /**
     * Mount the chart.
     *   container - element or element id to draw into
     */
    global.initFertilityChartEN = function (opts) {
        opts = opts || {};
        var host = typeof opts.container === 'string'
            ? document.getElementById(opts.container)
            : opts.container;
        if (!host) { return null; }

        injectStyles();
        uid += 1;
        var titleId = 'fx-title-' + uid;
        var descId = 'fx-desc-' + uid;

        var wrap = document.createElement('div');
        wrap.className = 'fx-chart';
        host.appendChild(wrap);

        var iw = W - M.left - M.right;
        var ih = H - M.top - M.bottom;

        var fmt = d3.format('.2f');
        var years = ROWS.map(function (d) { return d.year; });

        var x = d3.scalePoint().domain(years).range([0, iw]);
        var y = d3.scaleLinear().domain([0.3, 1.9]).range([ih, 0]);  // range from the original chart
        var yTicks = d3.range(0.3, 1.91, 0.2);

        var svg = d3.select(wrap).append('svg')
            .attr('width', W).attr('height', H)
            .attr('viewBox', '0 0 ' + W + ' ' + H)
            .attr('role', 'img')
            .attr('aria-labelledby', titleId + ' ' + descId);

        svg.append('title').attr('id', titleId)
            .text('Total, one-child and second-child fertility rate in China, 2006 to 2020');
        svg.append('desc').attr('id', descId)
            .text('The total fertility rate rises to 1.77 in 2016, the year every couple '
                + 'could legally have a second child, then falls to 1.30 by 2020. The '
                + 'one-child rate declines steadily from 0.96 in 2012 to 0.54 in 2017 '
                + 'while the second-child rate climbs to 1.01, so the second-child policy '
                + 'shifted the composition of births rather than raising the total.');

        var g = svg.append('g').attr('transform', 'translate(' + M.left + ',' + M.top + ')');

        // --- grid, axes -----------------------------------------------------
        // Hairline, solid, one step off the surface: present enough to read a
        // value against, quiet enough to stay behind the data.
        g.append('g').attr('class', 'fx-grid')
          .selectAll('line').data(yTicks).join('line')
            .attr('x1', 0).attr('x2', iw)
            .attr('y1', function (d) { return y(d); })
            .attr('y2', function (d) { return y(d); });

        g.append('g')
          .selectAll('text').data(yTicks).join('text')
            .attr('x', -7).attr('y', function (d) { return y(d); })
            .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
            .text(function (d) { return d3.format('.1f')(d); });

        g.append('line').attr('class', 'fx-baseline')
            .attr('x1', 0).attr('x2', iw).attr('y1', ih).attr('y2', ih);

        // Every other year: 15 labels in 322px would collide.
        g.append('g')
          .selectAll('text').data(years.filter(function (d, i) { return i % 2 === 0; })).join('text')
            .attr('x', function (d) { return x(d); }).attr('y', ih + 13)
            .attr('text-anchor', 'middle')
            .text(function (d) { return d; });

        // --- lines ----------------------------------------------------------
        // curveLinear, not a smoothed spline: a curve through these 15 points
        // would invent intermediate values the sources do not contain.
        SERIES.forEach(function (s) {
            var shaped = d3.line()
                .defined(function (d) { return d[s.key] !== null; })
                .x(function (d) { return x(d.year); })
                .y(function (d) { return y(d[s.key]); })
                .curve(d3.curveLinear);

            g.append('path')
                .datum(ROWS)
                .attr('class', 'fx-line')
                .attr('stroke', s.color)
                .attr('d', shaped);

            // End dot + label. The dot carries the colour; the label stays in
            // ink, so identity never depends on reading colour out of small text.
            var last = ROWS.slice().reverse().find(function (d) { return d[s.key] !== null; });
            g.append('circle').attr('class', 'fx-dot')
                .attr('cx', x(last.year)).attr('cy', y(last[s.key])).attr('r', 3.5)
                .attr('fill', s.color);
            g.append('text').attr('class', 'fx-end-label')
                .attr('x', x(last.year) + 7).attr('y', y(last[s.key]))
                .attr('dominant-baseline', 'middle')
                .text(s.short);
        });

        // --- hover / focus layer --------------------------------------------
        var crosshair = g.append('line').attr('class', 'fx-crosshair')
            .attr('y1', 0).attr('y2', ih);

        var hoverGroup = g.append('g').attr('class', 'fx-hover-dots');
        var hoverDots = hoverGroup
          .selectAll('circle').data(SERIES).join('circle')
            .attr('class', 'fx-dot').attr('r', 3.5)
            .attr('fill', function (d) { return d.color; });

        var tip = document.createElement('div');
        tip.className = 'fx-tip';
        tip.setAttribute('role', 'status');
        tip.setAttribute('aria-live', 'polite');
        wrap.appendChild(tip);

        var active = null;

        function nearestYear(px) {
            var i = d3.leastIndex(years, function (a) { return Math.abs(x(a) - px); });
            return years[i];
        }

        function show(year) {
            active = year;
            var row = ROWS.find(function (d) { return d.year === year; });
            crosshair.attr('x1', x(year)).attr('x2', x(year)).attr('opacity', 0.5);

            hoverGroup.attr('opacity', 1);
            hoverDots
                .attr('cx', x(year))
                .attr('cy', function (d) { return row[d.key] === null ? -99 : y(row[d.key]); })
                .attr('opacity', function (d) { return row[d.key] === null ? 0 : 1; });

            // Built with DOM nodes and textContent: series names are data,
            // never markup.
            tip.textContent = '';
            var head = document.createElement('div');
            head.className = 'fx-year';
            head.textContent = year;
            tip.appendChild(head);

            var table = document.createElement('table');
            SERIES.forEach(function (s) {
                var tr = table.insertRow();
                var k = tr.insertCell(); k.className = 'fx-key';
                var i = document.createElement('i');
                i.style.background = s.color;
                k.appendChild(i);
                var n = tr.insertCell(); n.className = 'fx-name';
                // Short form: in a 400px plot the full names make a tooltip wide
                // enough to bury the line it is describing. The full names are in
                // the page's legend above the chart, and in the table view.
                n.textContent = s.short;
                var v = tr.insertCell(); v.className = 'fx-val';
                v.textContent = row[s.key] === null ? 'no data' : fmt(row[s.key]);
            });
            tip.appendChild(table);
            tip.style.opacity = 1;

            // Clamp inside the 400x300 box so the tooltip never widens the
            // container it sits in.
            var tw = tip.offsetWidth, th = tip.offsetHeight;
            var left = M.left + x(year) + 12;
            if (left + tw > W - 2) { left = M.left + x(year) - tw - 12; }
            left = Math.max(2, Math.min(left, W - tw - 2));
            var top = Math.max(2, Math.min(M.top + 4, H - th - 2));
            tip.style.left = left + 'px';
            tip.style.top = top + 'px';
        }

        function hide() {
            active = null;
            crosshair.attr('opacity', 0);
            hoverGroup.attr('opacity', 0);
            tip.style.opacity = 0;
        }

        // The hit area is the whole plot, so the reader aims at a year, never
        // at a 2px line.
        g.append('rect').attr('class', 'fx-hit')
            .attr('x', 0).attr('y', 0).attr('width', iw).attr('height', ih)
            .attr('tabindex', 0)
            .attr('aria-label', 'Fertility rate by year. Use the left and right arrow keys to read each year.')
            // Both pointer and mouse events: some embedded/automated browsers
            // deliver only the mouse pair, and show() is idempotent so double
            // delivery is free.
            .on('pointermove mousemove', function (event) { show(nearestYear(d3.pointer(event, this)[0])); })
            .on('pointerleave mouseleave', hide)
            .on('focus', function () { show(active === null ? years[years.length - 1] : active); })
            .on('blur', hide)
            .on('keydown', function (event) {
                var i = years.indexOf(active === null ? years[years.length - 1] : active);
                if (event.key === 'ArrowRight') { show(years[Math.min(i + 1, years.length - 1)]); event.preventDefault(); }
                if (event.key === 'ArrowLeft') { show(years[Math.max(i - 1, 0)]); event.preventDefault(); }
                if (event.key === 'Escape') { hide(); }
            });

        // --- table view -----------------------------------------------------
        var srWrap = d3.select(wrap).append('div').attr('class', 'fx-sr-only');
        var t = srWrap.append('table');
        t.append('caption').text('Fertility rate in China by year, 2006 to 2020');
        t.append('thead').append('tr')
          .selectAll('th')
          .data(['Year'].concat(SERIES.map(function (s) { return s.name; })))
          .join('th')
            .attr('scope', 'col').text(function (d) { return d; });
        t.append('tbody')
          .selectAll('tr').data(ROWS).join('tr')
          .selectAll('td')
          .data(function (r) {
              return [r.year].concat(SERIES.map(function (s) {
                  return r[s.key] === null ? 'no data' : fmt(r[s.key]);
              }));
          })
          .join('td').text(function (d) { return d; });

        return { element: wrap, show: show, hide: hide };
    };
})(window);
