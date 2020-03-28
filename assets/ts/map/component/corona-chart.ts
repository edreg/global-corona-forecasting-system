import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/slider';
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-select/dist/js/bootstrap-select';
import 'bootstrap-select/dist/css/bootstrap-select.css';
import 'bootstrap-datepicker/dist/js/bootstrap-datepicker';
import 'bootstrap-datepicker/dist/css/bootstrap-datepicker.css';
import * as echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import 'echarts/lib/chart/effectScatter';
import 'echarts/lib/chart/scatter';
import 'echarts/lib/action/geoRoam';
import 'echarts/map/js/world';
import 'echarts/lib/component/geo';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/dataZoom';
import 'echarts/lib/component/markPoint';
import 'echarts/lib/component/title';
import 'echarts/lib/component/toolbox';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/visualMap';
import * as ecStat from 'echarts-stat/dist/ecStat';
import {AjaxService} from "../../service/ajax-service";
import {ColorService} from "../../service/color-service";
import {InitializableInterface} from "../../interface/initializable-interface";
import {DestroyableInterface} from "../../interface/destroyable-interface";
import {CoronaChartInterface} from "../interface/corona-chart-interface";
import {CoronaChartResponseInterface} from "../interface/corona-chart-response-interface";
import {CoronaStatInterface} from "../interface/corona-stat-interface";
import {CountryInterface} from "../interface/country-interface";
import {SeriesGeoInterface} from "../interface/series-geo-interface";
import {SeriesChartInterface} from "../interface/series-chart-interface";
import {RegressionAndDataService} from "../service/regression-and-data-service";
import {DateTimeService} from "../../service/date-time-service";
import {GeoMapService} from "../service/geo-map-service";
import {DataTableService} from "../../service/data-table-service";

export class CoronaChart implements InitializableInterface, DestroyableInterface {

    private _settings: CoronaChartInterface;
    private _chartPerCountry: echarts.ECharts;
    private _geoChart: echarts.ECharts;
    private _chartResponseInterface: CoronaChartResponseInterface;
    private _chartPerCountryDiv: HTMLDivElement | any;
    private _geoChartDiv: HTMLElement | any;
    private _countrySelection: JQuery<HTMLElement>;
    private _countryId: number;
    private _selectedCountryIdList: any;

    private _selectedChartLegend: {};
    private _seriesChartModelList: Array<SeriesChartInterface>;


    private _dataService: RegressionAndDataService;
    private _dateTimeService: DateTimeService;
    private _geoMapService: GeoMapService;
    private _dataTableService: DataTableService;


    constructor(settingContainerId: string) {
        let settingsSelector = $('#' + settingContainerId);

        if (settingsSelector.length != 0) {
            this._settings = JSON.parse(settingsSelector.html());
        }
    }

    init(): void {
        this._countryId = 0;
        this._geoChartDiv = $('div#corona-geo-chart-div').get(0);
        this._geoChart = echarts.init(this._geoChartDiv);
        this._chartPerCountryDiv = $('div#corona-chart-per-country-div').get(0);
        this._chartPerCountry = echarts.init(this._chartPerCountryDiv);
        this._seriesChartModelList = [];
        this._selectedCountryIdList = [0];
        this._dataTableService = new DataTableService();
        this._dataTableService.initTable('corona-stats');

        this._countrySelection = $('select#country-selection');

        this.initChart();
    }

    initChart(): void {
        AjaxService.ajaxRequest(this._settings.jsonDataUrl, []).done((response: CoronaChartResponseInterface) => {
            this._chartResponseInterface = response;
            this._dataService = new RegressionAndDataService(response);
            this._dateTimeService = new DateTimeService();
            this.buildRangeConfig();
            this.buildDateConfig();
            this._dataService.init();
            this.buildCountryConfig();
            this._geoMapService = new GeoMapService();
            this._geoMapService.init(this._dataService.geoCoordMap);
            this.handleChartResponse();
        })
        .fail(() => {
            return 'unknown error';
        })
        .then(() => {
        });
    }

    handleChartResponse(): void
    {
        this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);

        this._geoChart.setOption(this._geoMapService.getGeoChartOptions(this._dataService.seriesGeoModelList), true);
        this._geoChart.on('legendselectchanged', (params) => {
            this._geoMapService.selectedGeoChartLegend = params.selected;
        });
        this._chartPerCountry.on('legendselectchanged', (params) => {
            this._selectedChartLegend = params.selected;
        });
        this._geoChart.on('georoam', (params) => {
             // console.log('georoam');
             // console.log(this._geoChart.getOption().geo);
        });
    }

    fireRoamingEvents() {
        this._geoChart.dispatchAction({
            type: 'geoRoam',
            //component: mainType,
            name: 'geoBubbleChart',
            dx: 0,
            dy: 0
        });

        //
        // this._geoChart.dispatchAction({
        //     type: 'geoRoam',
        //     //component: mainType,
        //     name: 'geoBubbleChart',
        //     zoom: 1,
        //     originX: 0,
        //     originY: 0
        // });
    }

    updateZoomAndCenterOfGeoChart()
    {
        // // @ts-ignore
        // this._geoMapZoom = this._geoChart.getOption().geo.zoom;
        // // @ts-ignore
        // this._geoMapCenter = this._geoChart.getOption().geo.center;
        // // @ts-ignore
        // this._geoMapLeft = this._geoChart.getOption().geo.left;
        // // @ts-ignore
        // this._geoMapTop = this._geoChart.getOption().geo.top;
        // // @ts-ignore
        // this._geoMapBottom = this._geoChart.getOption().geo.bottom;
        // // @ts-ignore
        // this._geoMapRight = this._geoChart.getOption().geo.right;
    }

    buildDateConfig() {

        let dateLabel = $("#selected-date");
        let labelColor = dateLabel.css('color');

        this._dataService.selectedDate = this._dataService.lastDate;
        let today = Math.floor(new Date().getTime() / 1000);
        let tableDateInput = $('input#stats-table-datepicker');
        let inputValue: string|any = tableDateInput.val();
        let tableDate = new Date(inputValue);
        //console.log(this._dateTimeService.formatDate(tableDate));

        this._dataService.lastDate = this._dateTimeService.formatDate(new Date((today - 86400) * 1000));
        this._dataService.selectedDate = this._dataService.lastDate;

        let plusSixtyDays = 60 * 86400 + today;

        let rangeControl = $('input#slider-date-range');
        let min = new Date('2020-01-22').getTime() / 1000;
        let max = new Date(plusSixtyDays).getTime();
        max = tableDate.getTime() / 1000;

        rangeControl.attr('min', min);
        rangeControl.attr('max', max);
        rangeControl.attr('step', 86400);
        rangeControl.val(today - 86400);
        dateLabel.text(new Date((today - 86400) * 1000).toDateString());

        rangeControl.on("input change", (event) => {
            let val = $(event.target).val();
            let timeStamp = parseInt(val.toString());
            let date = new Date(timeStamp * 1000);
            let label = date.toDateString();
            let tmpLabelColor = labelColor;
            if (timeStamp > today - 86400)
            {
                tmpLabelColor = '#9e1a22';
                label += ' forecast!'
            }
            dateLabel.text(label);
            dateLabel.css('color', tmpLabelColor);
            //this.updateZoomAndCenterOfGeoChart();
            this._dataService.selectedDate = this._dateTimeService.formatDate(date);
            this._dataService.buildGeoSeriesData();

            this._geoChart.setOption(this._geoMapService.getGeoChartOptions(this._dataService.seriesGeoModelList), true);
            this.fireRoamingEvents();
        });
    }

    buildRangeConfig()
    {
        let rangeControl = $('input#polynomial-coefficients-range-control');
        rangeControl.on("input change", (event) => {
            let val = $(event.target).val();
            this._dataService.regressionFactor = (parseInt(val.toString()));
            this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);
        }).val(this._dataService.regressionFactor);

        let forecastControl = $('input#forecast-days-range-control');
        forecastControl.on("input change", (event) => {
            let val = $(event.target).val();
            this._dataService.forecastInDays = (parseInt(val.toString()));
            this._dataService.regressionDateList = this._dataService.chartDateList;

            this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);
        }).val(this._dataService.forecastInDays);
    }

    buildCountryConfig(): void
    {
        $.each(this._dataService.countrySelectionList.sort(function (a, b) { return ((a.text < b.text) ? -1 : ((a.text > b.text) ? 1 : 0)); }), (key, value) => {
            let option = $("<option></option>").attr("value", value.id).attr("data-tokens", value.text).text(value.text);
            if (value.selected === true)
            {
                option.attr('selected', 'selected');
            }
            this._countrySelection.append(option);
        });

        // @ts-ignore
        this._countrySelection.selectpicker().selectpicker('refresh');

        this._countrySelection.off('changed.bs.select').on('changed.bs.select', (/*e, clickedIndex, isSelected, previousValue*/) => {
            this._selectedCountryIdList = $(this._countrySelection).val();
            this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);
        });
    }

    getChartPerCountryOptions(): any {
        let series = [];

        let chartNameList = [];
        let legendData = [];
        let legendSelectedObject = [];
        let buildLegend = true;
        this._seriesChartModelList = [];
        this._dataService.regressionDateList = $.extend(true, {}, this._dataService.chartDateList);

        for (let countryId of this._selectedCountryIdList)
        {
            let doublingInfectionRate = [];
            let amountCases = [];
            let amountInfected = [];
            let amountHealed = [];
            let amountDied = [];
            let amountCasesNew = [];
            let amountInfectedNew = [];
            let amountHealedNew = [];
            let amountDiedNew = [];
            let amountCasesGeoDataPopulation = [];
            let amountInfectedGeoDataPopulation = [];
            let amountHealedGeoDataPopulation = [];
            let amountDeathGeoDataPopulation = [];
            let country: CountryInterface = this._dataService.countryById[countryId];
            let perPopulation = (country.population) || 1;
            chartNameList.push(country.name);

            $.each(this._dataService.seriesDataByCountryId[countryId], (key, stat:CoronaStatInterface) => {
                doublingInfectionRate.push(stat.doublingInfectionRate);
                amountCases.push(stat.amountTotal);
                amountInfected.push(stat.amountInfected);
                amountHealed.push(stat.amountHealed);
                amountDied.push(stat.amountDeath);
                amountCasesNew.push(stat.amountTotal - stat.amountTotalTheDayBefore);
                amountInfectedNew.push(stat.amountInfected - stat.amountInfectedTheDayBefore);
                amountHealedNew.push(stat.amountHealed - stat.amountHealedTheDayBefore);
                amountDiedNew.push(stat.amountDeath - stat.amountDeathTheDayBefore);
                amountCasesGeoDataPopulation.push(stat.amountTotal / perPopulation);
                amountInfectedGeoDataPopulation.push(stat.amountInfected / perPopulation);
                amountHealedGeoDataPopulation.push(stat.amountHealed / perPopulation);
                amountDeathGeoDataPopulation.push(stat.amountDeath / perPopulation);
            });

            let newInfectedSeriesModel = {color: '#1c31ce', selected: false, countryName: country.name, data: amountInfectedNew, name: 'New infections', buildRegression: true, regressionType: 'polynomial'};
            this._dataService.getRegression(newInfectedSeriesModel);
            let amountInfectedByNewInfections = [];
            let tempValueAmountInfected = 0;
            $.each(newInfectedSeriesModel.data, (key, value) => {
                if (typeof amountInfected[key] === 'undefined')
                {
                    amountInfectedByNewInfections[key] = value + tempValueAmountInfected;
                }
                else
                {
                    amountInfectedByNewInfections[key] = amountInfected[key];
                }

                tempValueAmountInfected = amountInfectedByNewInfections[key];
            });
            newInfectedSeriesModel.buildRegression = false;
            this._seriesChartModelList.push({color: '#e1d423', selected: true, countryName: country.name, data: amountInfectedByNewInfections, name: 'cases', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#cbc42a', selected: false, countryName: country.name, data: amountCasesNew, name: 'new cases', buildRegression: true, regressionType: 'polynomial'});
            //this._seriesChartModelList.push({color: '#a6a12e', selected: false, countryName: country.name, data: amountCasesGeoDataPopulation, name: 'cases/population', buildRegression: true, regressionType: ''});
            this._seriesChartModelList.push({color: '#7832b2', selected: false, countryName: country.name, data: doublingInfectionRate, name: 'doubling infection rate', buildRegression: true, regressionType: 'linear'});
            this._seriesChartModelList.push({color: '#193ce1', selected: false, countryName: country.name, data: amountCases, name: 'infected', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push(newInfectedSeriesModel);
            //this._seriesChartModelList.push({color: '#2e3da2', selected: false, countryName: country.name, data: amountInfectedGeoDataPopulation, name: 'infected/population', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#2bd62c', selected: false, countryName: country.name, data: amountHealed, name: 'healed', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#33bf36', selected: false, countryName: country.name, data: amountHealedNew, name: 'new healed', buildRegression: true, regressionType: 'polynomial'});
            //this._seriesChartModelList.push({color: '#2b9c2e', selected: false, countryName: country.name, data: amountHealedGeoDataPopulation, name: 'healed/population', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#cb020c', selected: false, countryName: country.name, data: amountDied, name: 'died', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#bc020a', selected: false, countryName: country.name, data: amountDiedNew, name: 'new died', buildRegression: true, regressionType: 'polynomial'});
            //this._seriesChartModelList.push({color: '#9c020a', selected: false, countryName: country.name, data: amountDiedNew, name: 'died/population', buildRegression: true, regressionType: 'polynomial'});

            if (buildLegend)
            {
                for (let chartModel of this._seriesChartModelList)
                {
                    legendData.push(chartModel.name);
                    legendSelectedObject[chartModel.name] = chartModel.selected;
                }
                buildLegend = false;
            }
        }

        for (let chartModel of this._seriesChartModelList)
        {
            series.push(this.buildDataSeries(chartModel));
        }

        if (typeof this._selectedChartLegend === 'undefined')
        {
            this._selectedChartLegend = legendSelectedObject;
        }

        let xAxisData = [];

        $.each(this._dataService.regressionDateList, (key, date) => {
            xAxisData.push(date);
        });

        return {
            title: {
                text: 'COVID-19 for ' + chartNameList.join(' & '),
                left: '0%',
            },
            legend: {
                top: '7%',
                left: '0%',
                inactiveColor: '#3e4257',
                selectedMode: 'single',
                data: legendData,
                selected: this._selectedChartLegend,
                orient: 'vertical',
                textStyle: {
                    color: '#571117'
                },
            },
            tooltip: this.getTooltip(),
            grid: {
                left: '11%',
                right: '15%',
                bottom: '5%',
                top: '10%',
                containLabel: true
            },
            dataZoom: [{
                startValue: '2020-03-01'
            }, {
                type: 'inside'
            }],
            xAxis: {
                type: 'category',
                splitLine: {
                    lineStyle: {
                        type: 'dashed'
                    }
                },
                smooth: true,
                axisLine: {onZero: true},
                axisLabel: {
                    rotate: 270,
                    formatter: (value) =>
                    {
                        return value;
                    }
                },
                data: xAxisData
            },
            yAxis: {
                type: 'value',
                name: 'amount',
                min: 0,
            },
            series: series
        };
    }

    private buildDataSeries(chartModel: SeriesChartInterface)
    {
        if (chartModel.buildRegression === true)
        {
            this._dataService.getRegression(chartModel);
        }

        let regressionData = chartModel.data;

        return {
            name: chartModel.name,
            id: chartModel.name + ' for ' + chartModel.countryName,
            type: 'line',
            stack: chartModel.countryName,
            smooth: true,
            data: regressionData,
            markLine: {
                label: {
                    show: true,
                    position: 'middle',
                    formatter: (typeof this._dataService.regressionFormulaByName[chartModel.name] !== 'undefined' ? this._dataService.regressionFormulaByName[chartModel.name] : '') + ' ' + chartModel.countryName,
                    textStyle: {
                        color: '#333',
                        fontSize: 14
                    }
                },
                data: [
                    [
                        {
                            coord: [0, regressionData[0]]
                        },
                        {
                            coord: [regressionData.length - 1, regressionData[regressionData.length - 1]]
                        }
                    ]
                ]
            },
            markArea: {
                itemStyle: {
                    borderWidth: 1,
                },
                label: {
                    show: true
                },
                data: [
                    [
                        {
                            name: "trend",
                            xAxis: this._dataService.xAxisAssignment[this._dataService.lastDate]
                        },
                        {
                            xAxis: regressionData.length - 1
                        }
                    ]
                ],
            },
            markPoint: {
                itemStyle: {
                    normal: {
                        color: 'transparent'
                    }
                },
                label: {
                    normal: {
                        show: true,
                        //position: [10, 10],
                        position: 'right',
                        formatter: chartModel.countryName,
                        textStyle: {
                            color: '#333',
                            fontSize: 14
                        }
                    }
                },
                emphasis: {
                    formatter: chartModel.countryName
                },
                data: [{
                    coord: [regressionData.length - 1, regressionData[regressionData.length - 1]],

                }]
            },
        };
    }

    getTooltip() {
        return {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: (params) =>
            {
                let result = [];
                let name = '';

                for (let paramObject of params)
                {
                    name = paramObject.name;

                    result.push('<span style="color: ' + paramObject.color + '"># </span>' + paramObject.seriesId + ': ' + paramObject.value);
                }

                return name + '<br>' + result.join('<br>');
            }
        };
    }

    destroy(): void {}



}

