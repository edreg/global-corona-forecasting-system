import {CoronaChartResponseInterface} from "../interface/corona-chart-response-interface";
import * as $ from "jquery";
import {SeriesGeoInterface} from "../interface/series-geo-interface";

enum RegressionType {
    linear = 'linear',
    exponential = 'exponential',
    polynomial = 'polynomial',
}

export class GeoMapService
{
    private _geoCoordMap: {};
    private _selectedGeoChartLegend: {};
    private _geoMapCenter: number[];
    private _geoMapZoom: number;
    private _geoMapLeft: string;
    private _geoMapTop: string;
    private _geoMapBottom: string;
    private _geoMapRight: string;

    get geoCoordMap(): {} {
        return this._geoCoordMap;
    }

    set geoCoordMap(value: {}) {
        this._geoCoordMap = value;
    }

    get selectedGeoChartLegend(): {} {
        return this._selectedGeoChartLegend;
    }

    set selectedGeoChartLegend(value: {}) {
        this._selectedGeoChartLegend = value;
    }



    init(geoCoordMap) {
        this._geoCoordMap = geoCoordMap;
        this._selectedGeoChartLegend = {};
        this._geoMapCenter = [11, 13];
        this._geoMapLeft = '0%';
        this._geoMapTop = '0%';
        this._geoMapBottom = '0%';
        this._geoMapRight = '0%';
        this._geoMapZoom = 1;
    }

    convertGeoData(data)
    {
        let res = [];

        for (let i = 0; i < data.length; i++) {
            if (typeof data[i] != 'undefined')
            {
                let geoCoord = this._geoCoordMap[data[i].name];
                if (geoCoord) {
                    res.push({
                        name: data[i].name,
                        value: geoCoord.concat(data[i].value),
                        stat: data[i].stat
                    });
                }
            }

        }
        return res;
    }

    getGeoChartOptions(geoSeriesModelList): any
    {
        let series = [];
        let legendData = [];
        let legendSelected = {};

        for (let geoSeriesModel of geoSeriesModelList)
        {
            legendData.push(geoSeriesModel.name);
            series.push(this.getGeoSeries(geoSeriesModel));
            legendSelected[geoSeriesModel.name] = geoSeriesModel.selected;
        }

        if (typeof this._selectedGeoChartLegend === 'undefined')
        {
            this._selectedGeoChartLegend = legendSelected;
        }

        return {
            legend: {
                top: '2%',
                data: legendData,
                inactiveColor: '#3e4257',
                selectedMode: 'single',
                selected: this._selectedGeoChartLegend,
                left: '0%',
                orient: 'vertical',
                itemGap: 10,
                itemHeight: 20,
                textStyle: {
                    color: '#801117',
                    fontSize: 20
                },
                z: 500
            },
            name: 'geoBubbleChart',
            tooltip : {
                trigger: 'item',
                z: 500,
                formatter: (params) =>
                {
                    let stats = params.data.stat;
                    let result = params.data.name + ' (population: ' + stats.country.population + ')';

                    if (typeof stats !== 'undefined')
                    {
                        let mortality = 100 * (stats.amountTotal > 0 ? (stats.amountDeath / stats.amountTotal) : 0);
                        result += '<br>'
                            + 'cases: <strong>' + stats.amountTotal + '</strong>' + '<br>'
                            + 'infected: <strong>' + stats.amountInfected + '</strong>' + '<br>'
                            + 'healed: <strong>' + stats.amountHealed + '</strong>' + '<br>'
                            + 'death: <strong>' + stats.amountDeath + '</strong>' + '<br>'

                            + 'new cases: <strong>' + (stats.amountTotal - stats.amountTotalTheDayBefore) + '</strong>' + '<br>'
                            + 'new infected: <strong>' + (stats.amountInfected - stats.amountInfectedTheDayBefore) + '</strong>' + '<br>'
                            + 'new healed: <strong>' + (stats.amountHealed - stats.amountHealedTheDayBefore) + '</strong>' + '<br>'
                            + 'new death: <strong>' + (stats.amountDeath - stats.amountDeathTheDayBefore) + '</strong>' + '<br>'

                            + 'doubling total rate: <strong>' + parseFloat(stats.doublingTotalRate).toFixed(1) + '</strong>' + '<br>'
                            + 'doubling infected rate: <strong>' + parseFloat(stats.doublingInfectionRate).toFixed(1) + '</strong>' + '<br>'
                            + 'doubling healed rate: <strong>' + parseFloat(stats.doublingHealedRate).toFixed(1) + '</strong>' + '<br>'
                            + 'doubling death rate: <strong>' + parseFloat(stats.doublingDeathRate).toFixed(1) + '</strong>' + '<br>'
                            + 'mortality: <strong>' + parseFloat(mortality.toString()).toFixed(1) + '%</strong>' + '<br>'
                        ;
                    }

                    return result;
                }
            },
            toolbox: this.getToolbox(),
            brush: {
                geoIndex: 0,
                brushLink: 'all',
                inBrush: {
                    opacity: 1,
                    symbolSize: 14
                },
                outOfBrush: {
                    color: '#000',
                    opacity: 0.2
                },
                z: 10
            },
            // grid: [{
            //     left: '15%',
            //     right: '15%',
            //     bottom: '7%',
            //     top: '10%',
            //     containLabel: true,
            //     borderColor: 'transparent',
            //     backgroundColor: '#b2d7f0',
            //     z: 5
            // }],
            grid: [{
                show: true,
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderColor: 'transparent',
                backgroundColor: '#b2d7f0',
                z: 5
            }],
            geo: {
                map: 'world',
                center: this._geoMapCenter,
                silent: true,
                roam: true,
                emphasis: {
                    label: {
                        show: false,
                        areaColor: '#eee'
                    }
                },
                itemStyle: {
                    borderWidth: 0.2,
                    borderColor: '#2b3543',
                    areaColor: '#ebebeb',
                },
                left: this._geoMapLeft,
                top: this._geoMapTop,
                bottom: this._geoMapBottom,
                right: this._geoMapRight,
                zoom: this._geoMapZoom,
                z: 10
            },
            calculable : true,
            series: series
        }
    }

    getGeoSeries(geoSeriesModel: SeriesGeoInterface) {
        return {
            name: geoSeriesModel.name,
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: this.convertGeoData(geoSeriesModel.data),
            hoverAnimation: true,
            symbolSize: (val, params) => {
                let result;
                if (geoSeriesModel.regressionType === RegressionType.linear)
                {
                    let calculatedValue = 100 - val[2];

                    if (calculatedValue > 98)
                    {
                        result = 100;
                    }
                    else if (calculatedValue > 95)
                    {
                        result = 50;
                    }
                    else if (calculatedValue > 90)
                    {
                        result = 15;
                    }
                    else if (calculatedValue > 80)
                    {
                        result = 8;
                    }
                    else
                    {
                        result = 5;
                    }
                }
                else
                {
                    result = Math.max(Math.min((val[2] / geoSeriesModel.relativeAmount) * 100, 100), 5);
                }
                return result;
            },
            showEffectOn: 'render',
            rippleEffect: {
                brushType: 'stroke'
            },
            label: {
                show: false
            },
            emphasis: {
                label: {
                    show: false
                }
            },
            itemStyle: {
                borderColor: '#fff',
                color: geoSeriesModel.color,
                shadowBlur: 10,
                shadowColor: '#333'
            },
            zlevel: 100
        };
    }

    getToolbox() {
        return {
            show: false,
            orient: 'vertical',
            itemSize: 12,
            itemGap: 10,
            showTitle: true,
            right: '15px',
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                restore: {},
                saveAsImage: {
                    show: true,
                    type: 'jpeg',
                    title: 'save as image'
                },
                dataView: {
                    show: true,
                    title: 'show data'
                },
                //myToolX seems to be a pattern
                myTool1: {
                    show: true,
                    title: 'Customize',
                    icon: 'path://M432.45,595.444c0,2.177-4.661,6.82-11.305,6.82c-6.475,0-11.306-4.567-11.306-6.82s4.852-6.812,11.306-6.812C427.841,588.632,432.452,593.191,432.45,595.444L432.45,595.444z M421.155,589.876c-3.009,0-5.448,2.495-5.448,5.572s2.439,5.572,5.448,5.572c3.01,0,5.449-2.495,5.449-5.572C426.604,592.371,424.165,589.876,421.155,589.876L421.155,589.876z M421.146,591.891c-1.916,0-3.47,1.589-3.47,3.549c0,1.959,1.554,3.548,3.47,3.548s3.469-1.589,3.469-3.548C424.614,593.479,423.062,591.891,421.146,591.891L421.146,591.891zM421.146,591.891',
                    onclick: () => {
                        this.showModalDialog('#customToolBoxModal');
                    }
                },
            }
        };
    }

    showModalDialog(id)
    {
        // @ts-ignore
        $(id).modal('show');
    }
}
