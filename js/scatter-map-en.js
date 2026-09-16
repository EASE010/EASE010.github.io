/*
    Scatter map of housework-compensation affordability by province (English).

    Lives in its own file so the article can draw the map inline — it used to be
    an <iframe>, which gave the block its own scroll context: a reader whose
    pointer was over the map scrolled the map instead of the page and saw
    scrollbars appear inside it. indexen.html now mounts this directly, and
    Map_EN.html loads the same script for previewing the map on its own, so the
    data and styling below are the single source of truth.

    Originally built on the ECharts + Baidu Maps (bmap) example:
    https://echarts.apache.org/examples/zh/editor.html?c=effectScatter-bmap
    The Baidu base layer needed an api.map.baidu.com key and was unreachable for
    readers outside mainland China, so the base layer is drawn by ECharts itself
    from js/china-provinces.geo.json, which ships with this repo. No third-party
    map service and no API key is involved.

    Usage:  initScatterMapEN({ container: 'someDivId' })
*/
(function (global) {
    'use strict';

    var data1 = [
        { name: 'ShangHai', value: 18296 },
        { name: 'HeBei', value: 4230 }
    ];

    var data = [
        { name: 'BeiJing', value: 4955 },
        { name: 'LiaoNing', value: 7589 },
        { name: 'ChongQing', value: 13754 },
        { name: 'GuangDong', value: 6641 },
        { name: 'ShaanXi', value: 10517 },
        { name: 'TianJin', value: 8552 },
        { name: 'NeiMengGu', value: 5497 },
        { name: 'JiangSu', value: 9136 },
        { name: 'ZheJiang', value: 4706 },
        { name: 'AnHui', value: 10643 },
        { name: 'FuJian', value: 20984 },
        { name: 'JiangXi', value: 14941 },
        { name: 'ShanDong', value: 6559 },
        { name: 'HuBei', value: 15050 },
        { name: 'HuNan', value: 28728 },
        { name: 'GuangXi', value: 12410 },
        { name: 'HaiNan', value: 6135 },
        { name: 'SiChuan', value: 17353 },
        { name: 'GuiZhou', value: 17258 },
        { name: 'YunNan', value: 12126 },
        { name: 'XiZang', value: 42689 },
        { name: 'ShanXi', value: 11355 },
        { name: 'GanSu', value: 14667 },
        { name: 'QingHai', value: 11412 },
        { name: 'NingXia', value: 14407 },
        { name: 'XinJiang', value: 23292 },
        { name: 'JiLin', value: 4244 },
        { name: 'HeiLongJiang', value: 34361 },
        { name: 'HeNan', value: 13897 }
    ];

    // Nudged off the true provincial capitals in places so the circles sit
    // inside their province and overlap each other less.
    var geoCoordMap = {
        'XiZang': [88.11, 31],
        'ShangHai': [121.48, 31.22],
        'FuJian': [118.1, 25.66],
        'ZheJiang': [119.96, 28.86],
        'GuangDong': [113.23, 23.16],
        'ShanXi': [112.53, 38.87],
        'YunNan': [101.73, 24.04],
        'LiaoNing': [123.38, 42.8],
        'JiLin': [125.35, 44.88],
        'JiangXi': [116.6, 28.68],
        'HaiNan': [109.51, 19.00],
        'GuangXi': [108.74, 23.66],
        'NeiMengGu': [111.65, 42.42],
        'SiChuan': [102.06, 30],
        'ShaanXi': [108.2, 34],
        'JiangSu': [119.78, 34.04],
        'GuiZhou': [106.71, 26.5],
        'BeiJing': [116.46, 39.92],
        'XinJiang': [86.68, 41.77],
        'ShanDong': [118, 36.65],
        'GanSu': [104.73, 35.03],
        'TianJin': [117.2, 40.13],
        'HeNan': [113.65, 34],
        'HeiLongJiang': [127.63, 47.75],
        'HeBei': [115.48, 40.03],
        'HuNan': [112, 28.21],
        'AnHui': [117.27, 32.86],
        'HuBei': [112.31, 31.52],
        'QingHai': [97.31, 36.03],
        'ChongQing': [107.31, 30.52],
        'NingXia': [106.31, 37.52],
        'XiangGang': [114.31, 23.02],
        'AoMen': [114.01, 22.52],
        'TaiWan': [120.81, 25.02]
    };

    function convertData(rows) {
        var res = [];
        for (var i = 0; i < rows.length; i++) {
            var geoCoord = geoCoordMap[rows[i].name];
            if (geoCoord) {
                res.push({
                    name: rows[i].name,
                    value: geoCoord.concat(rows[i].value)
                });
            }
        }
        return res;
    }

    function buildOption() {
        return {
            title: {
                text: '\nOnly Shanghai and Hebei Residents can Afford Housework Compensation',
                subtext: '* The amount of housework compensation is based on domestic service industry',
                left: '10%',
                textStyle: {
                    fontSize: 25,
                    fontWeight: 'bolder',
                    fontFamily: 'Optima',
                    color: '#9a6733'
                },
                subtextStyle: {
                    fontSize: 16,
                    fontFamily: 'Optima',
                    color: '#9a6733',
                }
            },

            tooltip: {
                trigger: 'item',
                // valueFormatter touches only the number, so the default tooltip layout
                // (series name, colour marker, bold right-aligned value) is kept.
                // addCommas is needed because this replaces the default number format.
                valueFormatter: function (value) {
                    return '¥' + echarts.format.addCommas(value);
                }
            },
            geo: {
                map: 'china',
                // Fit the whole country below the title instead of cropping it the way
                // the old zoom-5 Baidu view did.
                layoutCenter: ['50%', '58%'],
                layoutSize: '100%',
                roam: 'move',       // drag to pan, same as the old Baidu base layer
                selectedMode: false,
                nameProperty: 'name_en',
                itemStyle: {
                    areaColor: '#ebebeb',
                    borderColor: '#c4c4c4',
                    borderWidth: 0.8
                },
                // The base map is scenery, not data: no tooltip, no hover highlight.
                // Only the circles carry information, so each series below opts its own
                // tooltip back in (a series inherits tooltip from its coordinate system).
                tooltip: { show: false },
                emphasis: {
                    label: { show: false },
                    itemStyle: {
                        areaColor: '#ebebeb',
                        borderColor: '#c4c4c4'
                    }
                }
            },
            series: [
                {
                    name: 'Even if all disposable income is used for compensation, there is still a shortfall of',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    tooltip: { show: true },
                    data: convertData(data),
                    symbolSize: function (val) {
                        return val[2] / 500;
                    },
                    encode: {
                        value: 2
                    },
                    // Translucent fill with a thin orange rim, so overlapping provinces
                    // read as distinct circles. The transparency is itemStyle.opacity
                    // rather than an alpha in the colour, because ECharts builds the
                    // tooltip's marker dot from the fill colour — an rgba() fill makes
                    // that dot nearly invisible. opacity fades the rim too, hence the
                    // deeper border colour.
                    itemStyle: {
                        color: '#ffbc87',
                        opacity: 0.6,
                        borderColor: '#d2691e',
                        borderWidth: 1
                    },
                    label: {
                        formatter: '{b}',
                        position: 'right',
                        show: false
                    },
                    emphasis: {
                        label: {
                            show: true
                        }
                    }
                },
                {
                    name: 'The value of per capita disposable income higher than the compensation amount',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    tooltip: { show: true },
                    data: convertData(data1),
                    symbolSize: function (val) {
                        return val[2] / 500;
                    },
                    encode: {
                        value: 2
                    },
                    color: '#339966',
                    showEffectOn: 'render',
                    rippleEffect: {
                        brushType: 'stroke'
                    },
                    hoverAnimation: true,
                    label: {
                        formatter: '{b}',
                        position: 'right',
                        show: false
                    },
                    emphasis: {
                        label: {
                            show: true
                        }
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: '#333'
                    },
                    zlevel: 1
                }
            ]
        };
    }

    /**
     * Mount the map.
     *   container   - element or element id to draw into
     *   geoJsonUrl  - province outlines; default works for a page at the repo root
     *   fallback    - element or id shown if the outlines can't be loaded
     */
    global.initScatterMapEN = function (opts) {
        opts = opts || {};
        var el = typeof opts.container === 'string'
            ? document.getElementById(opts.container)
            : opts.container;
        if (!el) { return null; }

        var fallbackEl = typeof opts.fallback === 'string'
            ? document.getElementById(opts.fallback)
            : opts.fallback;

        var chart = echarts.init(el);

        // The province outlines live in this repo, so nothing here depends on a
        // map provider being reachable from the reader's country.
        fetch(opts.geoJsonUrl || 'js/china-provinces.geo.json')
            .then(function (res) {
                if (!res.ok) { throw new Error('HTTP ' + res.status); }
                return res.json();
            })
            .then(function (geoJson) {
                echarts.registerMap('china', geoJson);
                chart.setOption(buildOption());
            })
            .catch(function (err) {
                console.error('Could not load the China map data:', err);
                chart.dispose();
                el.style.display = 'none';
                if (fallbackEl) { fallbackEl.style.display = 'block'; }
            });

        window.addEventListener('resize', function () {
            chart.resize();
        });

        return chart;
    };
})(window);
