/*
    以家政服务业为标准的家务补偿金额散点地图（中文）。

    单独成文件，是为了让正文可以直接内联绘制地图。原先用 <iframe> 嵌入，
    嵌入块会形成自己的滚动区域：读者鼠标停在地图上继续滚动时，滚的是地图
    而不是页面，块内还会出现滚动条。现在 index.html 直接挂载本脚本，
    地图散点效果(2).html 也加载同一个脚本用于单独预览，因此下面的数据和
    样式是唯一的一份。

    原先基于 ECharts + 百度地图（bmap）示例：
    https://echarts.apache.org/examples/zh/editor.html?c=effectScatter-bmap
    百度底图需要 api.map.baidu.com 的密钥，境外读者也无法加载，
    现由 ECharts 直接读取仓库内的 js/china-provinces.geo.json 绘制底图，
    不依赖任何第三方地图服务和密钥。

    用法：initScatterMapCN({ container: '某个div的id' })
*/
(function (global) {
    'use strict';

    var data1 = [
        { name: '上海', value: 18296 },
        { name: '河北', value: 4230 }
    ];

    // 上海和河北在这一组里取 0，圆点半径为 0，实际由上面的绿色系列绘制。
    var data = [
        { name: '北京', value: 4955 },
        { name: '辽宁', value: 7589 },
        { name: '上海', value: 0 },
        { name: '重庆', value: 13754 },
        { name: '广东', value: 6641 },
        { name: '陕西', value: 10517 },
        { name: '天津', value: 8552 },
        { name: '河北', value: 0 },
        { name: '内蒙古', value: 5497 },
        { name: '江苏', value: 9136 },
        { name: '浙江', value: 4706 },
        { name: '安徽', value: 10643 },
        { name: '福建', value: 20984 },
        { name: '江西', value: 14941 },
        { name: '山东', value: 6559 },
        { name: '湖北', value: 15050 },
        { name: '湖南', value: 28728 },
        { name: '广西', value: 12410 },
        { name: '海南', value: 6135 },
        { name: '四川', value: 17353 },
        { name: '贵州', value: 17258 },
        { name: '云南', value: 12126 },
        { name: '西藏', value: 42689 },
        { name: '山西', value: 11355 },
        { name: '甘肃', value: 14667 },
        { name: '青海', value: 11412 },
        { name: '宁夏', value: 14407 },
        { name: '新疆', value: 23292 },
        { name: '吉林', value: 4244 },
        { name: '黑龙江', value: 34361 },
        { name: '河南', value: 13897 }
    ];

    var geoCoordMap = {
        '西藏': [91.11, 30.97],
        '上海': [121.48, 31.22],
        '福建': [118.1, 27.46],
        '浙江': [119.96, 29.86],
        '广东': [113.23, 24.16],
        '山西': [112.53, 38.87],
        '云南': [101.73, 25.04],
        '辽宁': [123.38, 42.8],
        '吉林': [125.35, 44.88],
        '江西': [115.89, 28.68],
        '海南': [109.51, 20.25],
        '广西': [108.74, 24.16],
        '内蒙古': [111.65, 42.42],
        '四川': [104.06, 31.67],
        '陕西': [108.95, 35.27],
        '江苏': [119.78, 33.04],
        '贵州': [106.71, 27.57],
        '北京': [116.46, 39.92],
        '新疆': [86.68, 41.77],
        '山东': [118, 36.65],
        '甘肃': [103.73, 37.03],
        '天津': [117.2, 40.13],
        '河南': [113.65, 34.76],
        '黑龙江': [127.63, 47.75],
        '河北': [115.48, 40.03],
        '湖南': [112, 28.21],
        '安徽': [117.27, 32.86],
        '湖北': [112.31, 31.52],
        '青海': [97.31, 37.03],
        '重庆': [107.31, 30.52],
        '宁夏': [106.31, 38.52],
        '香港': [114.31, 23.02],
        '澳门': [114.01, 22.52],
        '台湾': [120.81, 25.02]
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
                text: '\n只 有 上 海 和 河 北 能 够 承 担',
                subtext: '以 家 政 服 务 业 为 标 准 的 家 务 补 偿 金 额',
                left: '15%',
                textStyle: {
                    fontSize: 30,
                    fontWeight: 'bolder',
                    fontFamily: '汉仪劲楷简',
                    color: '#cc6633'
                },
                subtextStyle: {
                    fontSize: 25,
                    fontFamily: '汉仪劲楷简',
                    color: '#cc6633'
                }
            },

            tooltip: {
                trigger: 'item',
                // valueFormatter 只改数字本身，默认的提示框版式
                //（系列名、颜色圆点、右侧加粗数值）保持不变。
                // 因为覆盖了默认数字格式，所以要自己调用 addCommas 加千分位
                valueFormatter: function (value) {
                    return '¥' + echarts.format.addCommas(value);
                }
            },
            geo: {
                map: 'china',
                // 让全国完整显示在标题下方，不再像原先 zoom 5 的百度底图那样被裁切
                layoutCenter: ['50%', '58%'],
                layoutSize: '100%',
                roam: 'move',       // 鼠标拖拽功能，与原百度底图一致
                selectedMode: false,
                itemStyle: {
                    areaColor: '#ebebeb',
                    borderColor: '#c4c4c4',
                    borderWidth: 0.8
                },
                // 底图只是背景，不承载数据：不显示提示框，也不响应悬停高亮。
                // 只有散点承载数据，因此下面每个 series 单独把提示框打开
                //（series 会继承所属坐标系的 tooltip 配置）
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
                    name: '即使将所有可支配收入用于补偿，还差/元',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    tooltip: { show: true },
                    data: convertData(data),
                    symbolSize: function (val) {
                        return val[2] / 450;
                    },
                    encode: {
                        value: 2
                    },
                    // 半透明填充 + 细橙色描边，重叠的省份也能看清各自的圆。
                    // 透明度用 itemStyle.opacity 而不是颜色里的 alpha：
                    // ECharts 的提示框圆点取自填充色，rgba() 会让圆点几乎看不见。
                    // opacity 同时也会淡化描边，所以描边用了更深的橙色。
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
                    name: '人均可支配收入比补偿金额高/元',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    tooltip: { show: true },
                    data: convertData(data1),
                    symbolSize: function (val) {
                        return val[2] / 450;
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
     * 挂载地图。
     *   container   - 要绘制到的元素或元素 id
     *   geoJsonUrl  - 省界数据，默认路径适用于仓库根目录下的页面
     *   fallback    - 省界数据加载失败时显示的元素或 id
     */
    global.initScatterMapCN = function (opts) {
        opts = opts || {};
        var el = typeof opts.container === 'string'
            ? document.getElementById(opts.container)
            : opts.container;
        if (!el) { return null; }

        var fallbackEl = typeof opts.fallback === 'string'
            ? document.getElementById(opts.fallback)
            : opts.fallback;

        var chart = echarts.init(el);

        // 省界数据放在仓库里，读者在哪个国家都不依赖地图服务商是否可达。
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
                console.error('中国地图数据加载失败：', err);
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
