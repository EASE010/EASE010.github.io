/*
    总和 / 一孩 / 二孩生育率折线图，2006-2020（中文）。

    替换原先托管在 dycharts.com 的图表。那个嵌入会在图上压一个水印
    （它自己保存的配置里 watermarkDisplay.show = false，说明水印是渲染时
    另外加的，在配置里关不掉），而且图是按 600x470 画布做的，正文里的位置
    只有 400x300 —— 横向压缩 1.5 倍、纵向压缩 1.57 倍。这里用 D3 按位置的
    真实尺寸绘制，不再有缩放。

    单独成文件，是为了让正文内联绘制，不再用 <iframe>（iframe 会让嵌入块
    形成自己的滚动区域）。下面所有选择器都限定在 .fx-chart 之下、自定义
    属性都加了 --fx- 前缀，因为这些样式现在和正文共处一个文档：一条没有
    限定范围的 `text { ... }` 规则会把页面上所有 SVG 的文字都重绘一遍。
    Fertility_CN.html 也加载同一个脚本用于单独预览。

    数据、y 轴范围 [0.3, 1.9] 和 2px 线宽沿用原图表保存的配置；
    配色另行推导（见下面的 SERIES）。标题、名词解释、图例和数据来源都在正文的
    背景图里（PICS/0615生育率图/除数据图外的其他要素的底图（透明底）.png），
    本文件只画嵌在其中的折线部分。

    用法：initFertilityChartCN({ container: '某个div的id' })
*/
(function (global) {
    'use strict';

    // 数据来源：《中国近10年来的生育水平与趋势》、国家统计局、快易数据。
    // 2018-2020 年缺一孩、二孩数据，也就是背景图注释里说的那段缺失。
    // name 用背景图图例里的写法，short 是图上直接标注和提示框里的简称。
    // 配色相对原先的 #ff9966 / #99cc99 / #339966 调深了：原来的浅绿在米色
    // 背景上对比度只有 1.66:1、色度 0.089（看起来接近灰色），两个浅色的
    // 明度也超出了范围。现在这三个颜色都满足 3:1 对比度、色度下限，
    // 且任意两色在 OKLab 色盲模拟下的距离都 >=8。
    // 背景图 PICS/0615生育率图/除数据图外的其他要素的底图（透明底）.png
    // 里的图例圆点也已改成同样的颜色。
    var SERIES = [
        { key: 'total',  name: '总和生育率', short: '总和', color: '#db6f35' },
        { key: 'first',  name: '一孩生育率', short: '一孩', color: '#379f6b' },
        { key: 'second', name: '二孩生育率', short: '二孩', color: '#336d36' }
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

    // 尺寸是按这个方框调好的：边距、9px 的轴文字、"隔年显示" 的刻度密度
    // 都假定画布是 400x300。
    var W = 400, H = 300;
    // 中文简称比英文短，右边距可以比英文版小一些。
    var M = { top: 14, right: 34, bottom: 26, left: 32 };

    var STYLE_ID = 'fx-chart-cn-styles';
    var CSS = [
        '.fx-chart-cn {',
        '    --fx-surface: #f6f4e7;',   /* 与正文背景一致，接缝看不出来 */
        '    --fx-grid: #e6e1cd;',      /* 比背景深一档，属于图表底纹 */
        '    --fx-axis: #cfc9b4;',
        '    --fx-ink-muted: #8a8474;',
        '    --fx-ink: #5a554a;',
        '    position: relative;',
        '    width: ' + W + 'px; height: ' + H + 'px;',
        '    background: var(--fx-surface);',
        '    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", sans-serif;',
        '    -webkit-font-smoothing: antialiased;',
        '}',
        '.fx-chart-cn svg { display: block; }',
        '.fx-chart-cn text { fill: var(--fx-ink-muted); font-size: 9px; }',
        '.fx-chart-cn .fx-grid line { stroke: var(--fx-grid); stroke-width: 1; shape-rendering: crispEdges; }',
        '.fx-chart-cn .fx-baseline { stroke: var(--fx-axis); stroke-width: 1; shape-rendering: crispEdges; }',
        '.fx-chart-cn .fx-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }',
        /* 2px 描边用背景色，圆点压在线上或彼此重叠时依然看得清 */
        '.fx-chart-cn .fx-dot { stroke: var(--fx-surface); stroke-width: 2; }',
        '.fx-chart-cn .fx-end-label { fill: var(--fx-ink); font-size: 10px; }',
        '.fx-chart-cn .fx-crosshair { stroke: var(--fx-ink-muted); stroke-width: 1; opacity: 0; shape-rendering: crispEdges; }',
        '.fx-chart-cn .fx-hover-dots { opacity: 0; }',
        '.fx-chart-cn .fx-hit { fill: transparent; cursor: crosshair; }',
        /* 键盘操作时给出可见的聚焦提示，聚焦目标是整个绘图区 */
        '.fx-chart-cn .fx-hit:focus-visible { outline: 2px solid var(--fx-ink-muted); outline-offset: 2px; }',

        '.fx-chart-cn .fx-tip {',
        '    position: absolute;',
        /* 未悬停前先固定在原点，否则它会落在 svg 下方把容器撑高 */
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
        '.fx-chart-cn .fx-tip .fx-year { font-weight: 700; color: var(--fx-ink); margin-bottom: 3px; font-size: 10.5px; }',
        '.fx-chart-cn .fx-tip table { border-collapse: collapse; }',
        '.fx-chart-cn .fx-tip td { padding: 1px 0; vertical-align: middle; }',
        /* 每行用一小段系列色的线做标识——提示框这个密度下，实心色块属于
           用数据的笔墨做标签的活 */
        '.fx-chart-cn .fx-tip td.fx-key { width: 12px; }',
        '.fx-chart-cn .fx-tip td.fx-key i { display: block; width: 10px; height: 2px; border-radius: 1px; }',
        '.fx-chart-cn .fx-tip td.fx-name { padding-right: 8px; }',
        /* 数值优先：它是高对比的重点元素，系列名是次要信息 */
        '.fx-chart-cn .fx-tip td.fx-val { font-weight: 700; color: var(--fx-ink); text-align: right; font-variant-numeric: tabular-nums; }',

        /* 表格视图：不悬停也能拿到每一个数值。
           这里必须用 div 包住 <table>：表格会忽略 width/height:1px 按内容
           铺开，直接套在表格上会占掉约 569x689 并把文档撑大。1x1 定位盒加
           overflow:hidden 才能把内容挡在滚动区域之外。 */
        '.fx-chart-cn .fx-sr-only {',
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

    global.initFertilityChartCN = function (opts) {
        opts = opts || {};
        var host = typeof opts.container === 'string'
            ? document.getElementById(opts.container)
            : opts.container;
        if (!host) { return null; }

        injectStyles();
        uid += 1;
        var titleId = 'fx-cn-title-' + uid;
        var descId = 'fx-cn-desc-' + uid;

        var wrap = document.createElement('div');
        wrap.className = 'fx-chart-cn';
        host.appendChild(wrap);

        var iw = W - M.left - M.right;
        var ih = H - M.top - M.bottom;

        var fmt = d3.format('.2f');
        var years = ROWS.map(function (d) { return d.year; });

        var x = d3.scalePoint().domain(years).range([0, iw]);
        var y = d3.scaleLinear().domain([0.3, 1.9]).range([ih, 0]);  // 沿用原图表的范围
        var yTicks = d3.range(0.3, 1.91, 0.2);

        var svg = d3.select(wrap).append('svg')
            .attr('width', W).attr('height', H)
            .attr('viewBox', '0 0 ' + W + ' ' + H)
            .attr('role', 'img')
            .attr('aria-labelledby', titleId + ' ' + descId);

        svg.append('title').attr('id', titleId)
            .text('中国总和生育率、一孩生育率、二孩生育率，2006 至 2020 年');
        svg.append('desc').attr('id', descId)
            .text('总和生育率在全面二孩政策实施的 2016 年升到 1.77，随后一路降到 '
                + '2020 年的 1.30。同期一孩生育率从 2012 年的 0.96 持续降到 2017 年的 '
                + '0.54，二孩生育率则升到 1.01：二孩政策改变的是出生人口的结构，'
                + '而不是把总量拉了起来。');

        var g = svg.append('g').attr('transform', 'translate(' + M.left + ',' + M.top + ')');

        // --- 网格与坐标轴 ---------------------------------------------------
        // 1px 实线、比背景深一档：够用来读数，又始终退在数据后面。
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

        // 隔年显示：15 个年份标签挤在 334px 里会互相压到。
        g.append('g')
          .selectAll('text').data(years.filter(function (d, i) { return i % 2 === 0; })).join('text')
            .attr('x', function (d) { return x(d); }).attr('y', ih + 13)
            .attr('text-anchor', 'middle')
            .text(function (d) { return d; });

        // --- 折线 -----------------------------------------------------------
        // 用 curveLinear 而不是平滑曲线：15 个点之间的平滑曲线会凭空造出
        // 数据来源里并不存在的中间值。
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

            // 线尾的圆点 + 标注。颜色由圆点承载，文字保持墨色，
            // 这样辨认系列就不必从小号彩色文字里读颜色。
            var last = ROWS.slice().reverse().find(function (d) { return d[s.key] !== null; });
            g.append('circle').attr('class', 'fx-dot')
                .attr('cx', x(last.year)).attr('cy', y(last[s.key])).attr('r', 3.5)
                .attr('fill', s.color);
            g.append('text').attr('class', 'fx-end-label')
                .attr('x', x(last.year) + 7).attr('y', y(last[s.key]))
                .attr('dominant-baseline', 'middle')
                .text(s.short);
        });

        // --- 悬停 / 聚焦层 ---------------------------------------------------
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

            // 用 DOM 节点和 textContent 拼装：系列名是数据，不是标记。
            tip.textContent = '';
            var head = document.createElement('div');
            head.className = 'fx-year';
            head.textContent = year + '年';
            tip.appendChild(head);

            var table = document.createElement('table');
            SERIES.forEach(function (s) {
                var tr = table.insertRow();
                var k = tr.insertCell(); k.className = 'fx-key';
                var i = document.createElement('i');
                i.style.background = s.color;
                k.appendChild(i);
                var n = tr.insertCell(); n.className = 'fx-name';
                n.textContent = s.name;
                var v = tr.insertCell(); v.className = 'fx-val';
                v.textContent = row[s.key] === null ? '无数据' : fmt(row[s.key]);
            });
            tip.appendChild(table);
            tip.style.opacity = 1;

            // 夹在 400x300 之内，提示框不会把所在容器撑宽。
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

        // 命中区域是整个绘图区，读者瞄的是年份，而不是一条 2px 的线。
        g.append('rect').attr('class', 'fx-hit')
            .attr('x', 0).attr('y', 0).attr('width', iw).attr('height', ih)
            .attr('tabindex', 0)
            .attr('aria-label', '各年度生育率。可用左右方向键逐年查看。')
            // 同时监听 pointer 和 mouse：有些嵌入式/自动化浏览器只派发
            // mouse 那一组，而 show() 是幂等的，重复触发没有代价。
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

        // --- 表格视图 -------------------------------------------------------
        var srWrap = d3.select(wrap).append('div').attr('class', 'fx-sr-only');
        var t = srWrap.append('table');
        t.append('caption').text('中国各年度生育率，2006 至 2020 年');
        t.append('thead').append('tr')
          .selectAll('th')
          .data(['年份'].concat(SERIES.map(function (s) { return s.name; })))
          .join('th')
            .attr('scope', 'col').text(function (d) { return d; });
        t.append('tbody')
          .selectAll('tr').data(ROWS).join('tr')
          .selectAll('td')
          .data(function (r) {
              return [r.year].concat(SERIES.map(function (s) {
                  return r[s.key] === null ? '无数据' : fmt(r[s.key]);
              }));
          })
          .join('td').text(function (d) { return d; });

        return { element: wrap, show: show, hide: hide };
    };
})(window);
