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
import {AjaxService} from "../../service/ajax-service";
import {InitializableInterface} from "../../interface/initializable-interface";
import {DestroyableInterface} from "../../interface/destroyable-interface";
import {CoronaChartInterface} from "../interface/corona-chart-interface";
import {CoronaChartResponseInterface} from "../interface/corona-chart-response-interface";
import {CoronaStatInterface} from "../interface/corona-stat-interface";
import {CountryInterface} from "../interface/country-interface";
import {SeriesChartInterface} from "../interface/series-chart-interface";
import {RegressionAndDataService} from "../service/regression-and-data-service";
import {DateTimeService} from "../../service/date-time-service";
import {GeoMapService} from "../service/geo-map-service";
import {DataTableService} from "../../service/data-table-service";
import {LoadingLayerHelper} from "../../service/loading-layer-helper";

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
    private _triggerRegressionRecalculation: boolean;


    constructor(settingContainerId: string) {
        let settingsSelector = $('#' + settingContainerId);

        if (settingsSelector.length != 0) {
            this._settings = JSON.parse(settingsSelector.html());
        }
    }

    init(): void {
        this._countryId = 0;
        this._triggerRegressionRecalculation = true;
        this._geoChartDiv = $('div#corona-geo-chart-div').get(0);
        this._geoChart = echarts.init(this._geoChartDiv);
        this._chartPerCountryDiv = $('div#corona-chart-per-country-div').get(0);
        this._chartPerCountry = echarts.init(this._chartPerCountryDiv);
        this._seriesChartModelList = [];
        this._selectedCountryIdList = [0];
        this._dataTableService = new DataTableService();
        this._dataTableService.tableId = 'corona-stats';
        this._dataTableService.initTable();

        this._countrySelection = $('select#country-selection');

        this.initChart();
    }

    initChart(): void {
        LoadingLayerHelper.show();
        AjaxService.ajaxRequest(this._settings.jsonDataUrl, []).done((response: CoronaChartResponseInterface) => {
            //console.log($.extend(true, {}, response));
            this._chartResponseInterface = response;
            this._dataService = new RegressionAndDataService(response);
            this._dateTimeService = new DateTimeService();
            this.buildAdvancedRangeConfig();
            this.buildDateRangeConfigs();

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
            LoadingLayerHelper.hide();
        });
    }

    handleChartResponse(): void
    {
        this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);

        this._geoChart.setOption(this._geoMapService.getGeoChartOptions(this._dataService.seriesGeoModelList), true);
        this._geoChart.on('legendselectchanged', (params) => {
            this._geoMapService.selectedGeoChartLegend = params.selected;
        });

        this._dataTableService.selectedDateDataIndex = this._dataService.getDataPositionByDate(this._dataService.selectedDate);
        this._dataTableService.regressionModelList = this._dataService.regressionModelList;
        this._dataTableService.buildTable();
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

    buildDateRangeConfigs()
    {
        this.buildDateConfig('#selected-date-geo', 'input#slider-date-range-geo', true);
        this.buildDateConfig('#selected-date-table', 'input#slider-date-range-table', false);
    }

    buildDateConfig(labelSelector: string, rangeControlSelector: string, isGeo: boolean) {

        let dateLabel = $(labelSelector);
        let labelColor = '#f6931f';

        this._dataService.selectedDate = this._dataService.lastDate;
        let lastDate = Math.floor(new Date().getTime() / 1000) - 86400;
        // let configDateInput = $('input#stats-config-datepicker');
        // let inputValue: string|any = configDateInput.val();
        // let configDate = new Date(inputValue);
        // console.log(this._dateTimeService.formatDate(configDate));

        this._dataService.lastDate = this._dateTimeService.formatDate(new Date((lastDate) * 1000));
        //this._dataService.lastDate = this._dateTimeService.formatDate(configDate);
        this._dataService.selectedDate = this._dataService.lastDate;

        let plusDays = this._dataService.forecastInDays * 86400 + lastDate;

        let rangeControl = $(rangeControlSelector);
        let min = new Date('2020-01-22').getTime() / 1000;
        let max = new Date(plusDays).getTime();

        rangeControl.attr('min', min);
        rangeControl.attr('max', max);
        rangeControl.attr('step', 86400);
        rangeControl.val(lastDate);
        dateLabel.text(new Date((lastDate) * 1000).toDateString());

        rangeControl.off('input change').on("input change", (event) => {
            LoadingLayerHelper.show();
            let val = $(event.target).val();
            let timeStamp = parseInt(val.toString());
            let date = new Date(timeStamp * 1000);
            let label = date.toDateString();
            let tmpLabelColor = labelColor;
            if (timeStamp > lastDate)
            {
                tmpLabelColor = '#9e1a22';
                label += ' forecast!'
            }
            dateLabel.text(label);
            dateLabel.css('color', tmpLabelColor);
            this._dataService.selectedDate = this._dateTimeService.formatDate(date);

            if (isGeo)
            {
                this.rebuildGeoMap();
            }
            else
            {
                this._dataTableService.selectedDateDataIndex = this._dataService.getDataPositionByDate(this._dataService.selectedDate);
                this._dataTableService.regressionModelList = this._dataService.regressionModelList;
                this._dataTableService.buildTable();
            }
            LoadingLayerHelper.hide();
        });
    }

    rebuildCharts()
    {
        this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);
        this.rebuildGeoMap();
        this.fireRoamingEvents();
    }

    rebuildGeoMap()
    {
        this._dataService.buildGeoSeriesData();
        this._geoChart.setOption(this._geoMapService.getGeoChartOptions(this._dataService.seriesGeoModelList), true);
    }

    buildAdvancedRangeConfig()
    {
        let rangeValueSpan = $('#polynomial-coefficients-value');
        let forecastDaysSpan = $('#forecast-days-value');
        let buildRegressionDaysSpan = $('#amount-days-build-regression-value');
        let rangeControl = $('input#polynomial-coefficients-range-control');
        rangeControl.on("input", (event) => {
            let val = parseInt($(event.target).val().toString());
            rangeValueSpan.text(val);
        });
        rangeControl.on("change", (event) => {
            LoadingLayerHelper.show();
            let val = $(event.target).val();
            this._dataService.regressionFactor = (parseInt(val.toString()));
            this._dataService.triggerRegressionRecalculation = true;
            this.rebuildCharts();
            LoadingLayerHelper.hide();
        }).val(this._dataService.regressionFactor);

        let forecastControl = $('input#forecast-days-range-control');
        forecastControl.on("input", (event) => {
            let val = parseInt($(event.target).val().toString());
            forecastDaysSpan.text(val);
        });
        forecastControl.on("change", (event) => {
            LoadingLayerHelper.show();
            let val = $(event.target).val();
            this._dataService.forecastInDays = (parseInt(val.toString()));
            this.buildDateRangeConfigs();
            this._dataService.triggerRegressionRecalculation = true;
            this.rebuildCharts();
            LoadingLayerHelper.hide();
        }).val(this._dataService.forecastInDays);

        let regressionDaysControl = $('input#amount-days-build-regression-range-control');
        regressionDaysControl.on("input", (event) => {
            let val = parseInt($(event.target).val().toString());
            buildRegressionDaysSpan.text(val);
        });
        regressionDaysControl.on("change", (event) => {
            LoadingLayerHelper.show();
            let val = $(event.target).val();
            this._dataService.amountOfDaysToBuildRegression = (parseInt(val.toString()));
            this.buildDateRangeConfigs();
            this._dataService.triggerRegressionRecalculation = true;
            this.rebuildCharts();
            LoadingLayerHelper.hide();
        }).val(this._dataService.amountOfDaysToBuildRegression);
    }

    buildCountryConfig(): void {
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
        let legendSelectedObject = {};
        let buildLegend = true;

        this._seriesChartModelList = [];
        this._dataService.checkRegressionRecalculation();

        for (let countryId of this._selectedCountryIdList)
        {
            let doublingCasesRate = [];
            let amountCases = [];
            let amountCasesNew = [];
            let amountCasesNewPercent = [];
            let amountInfected = [];
            let amountInfectedNew = [];
            let amountInfectedNewPercent = [];
            let amountHealed = [];
            let amountHealedNew = [];
            let amountHealedNewPercent = [];
            let amountDied = [];
            let amountDiedNew = [];
            let amountDiedNewPercent = [];

            let amountMortality = [];
            let country: CountryInterface = this._dataService.countryById[countryId];

            chartNameList.push(country.name);

            $.each(this._dataService.regressionModelList[countryId], (key:number, stat:CoronaStatInterface) => {
                if (key <= this._dataService.getLastDateWithForecastDataPosition())
                {
                    amountCases.push(stat.amountTotal);
                    amountCasesNew.push(stat.amountTotal - stat.amountTotalTheDayBefore);
                    amountCasesNewPercent.push(CoronaStatInterface.getPercentageValueToDayBefore(stat.amountTotal, stat.amountTotalTheDayBefore));

                    amountHealed.push(stat.amountHealed);
                    amountHealedNew.push(stat.amountHealed - stat.amountHealedTheDayBefore);
                    amountHealedNewPercent.push(CoronaStatInterface.getPercentageValueToDayBefore(stat.amountHealed, stat.amountHealedTheDayBefore));

                    amountInfected.push(stat.amountInfected);
                    amountInfectedNew.push(stat.amountInfected - stat.amountInfectedTheDayBefore);
                    amountInfectedNewPercent.push(CoronaStatInterface.getPercentageValueToDayBefore(stat.amountInfected, stat.amountInfectedTheDayBefore));

                    amountDied.push(stat.amountDeath);
                    amountDiedNew.push(stat.amountDeath - stat.amountDeathTheDayBefore);
                    amountDiedNewPercent.push(CoronaStatInterface.getPercentageValueToDayBefore(stat.amountDeath, stat.amountDeathTheDayBefore));
                    //amountInfected.push(stat.amountTotal - stat.amountHealed - stat.amountDeath);
                    amountMortality.push(Math.min((stat.amountTotal > 0 ? 100 * (stat.amountDeath / stat.amountTotal) : 0), 100));
                    doublingCasesRate.push(stat.doublingTotalRate);

                }
            });

            this._seriesChartModelList.push({formula: 'cases', countryName: country.name, data: amountCases, name: 'cases', regressionFormulaKey: 'amountTotal|' + country.name,});
            this._seriesChartModelList.push({formula: 'y = cases - healed - died', countryName: country.name, data: amountInfected, name: 'active cases', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'healed', countryName: country.name, data: amountHealed, name: 'healed', regressionFormulaKey: 'amountHealed|' + country.name});
            this._seriesChartModelList.push({formula: 'died', countryName: country.name, data: amountDied, name: 'died', regressionFormulaKey: 'amountDeath|' + country.name});
            this._seriesChartModelList.push({formula: 'y = cases - (cases_the_day_before)', countryName: country.name, data: amountCasesNew, name: 'new cases', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = active cases - (active_cases_the_day_before)', countryName: country.name, data: amountInfectedNew, name: 'new active cases', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = healed - (healed_the_day_before)', countryName: country.name, data: amountHealedNew, name: 'new healed', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = died - (died_the_day_before)', countryName: country.name, data: amountDiedNew, name: 'new died', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = 100 * (new_cases - new_cases_the_day_before) / new_cases', countryName: country.name, data: amountCasesNewPercent, name: 'new cases (%)', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = 100 * (new_active_cases - new_active_cases_the_day_before) / new_active_cases', countryName: country.name, data: amountInfectedNewPercent, name: 'new active cases (%)', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = 100 * (new_healed_cases - new_healed_cases_the_day_before) / new_healed_cases', countryName: country.name, data: amountHealedNewPercent, name: 'new healed (%)', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = 100 * (new_died_cases - new_died_cases_the_day_before) / new_died_cases', countryName: country.name, data: amountDiedNewPercent, name: 'new died (%)', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = 100 * died / cases', countryName: country.name, data: amountMortality, name: 'mortality', regressionFormulaKey: null});
            this._seriesChartModelList.push({formula: 'y = ln(2) / ln(cases/cases_the_day_before)', countryName: country.name, data: doublingCasesRate, name: 'doubling cases rate', regressionFormulaKey: null});

            if (buildLegend)
            {
                let selected = true;
                for (let chartModel of this._seriesChartModelList)
                {
                    legendData.push(chartModel.name);
                    legendSelectedObject[chartModel.name] = selected;
                    selected = false;
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
        //console.log(legendSelectedObject);

        $.each(this._dataService.xAxisAssignment, (date, key) => {
            if (key <= this._dataService.getLastDateWithForecastDataPosition())
            {
                xAxisData.push(date);
            }
        });

        return {
            title: {
                text: 'COVID-19 for ' + chartNameList.join(' & '),
                left: '0%',
            },
            legend: {
                top: '9%',
                left: '0%',
                inactiveColor: '#9098ae',
                //selectedMode: 'single',
                type: 'scroll',
                data: legendData,
                selected: this._selectedChartLegend,
                orient: 'vertical',
                itemGap: 15,
                itemHeight: 40,
                textStyle: {
                    color: '#801117',
                    fontSize: 20
                },
                // tooltip: {
                //     trigger: 'item',
                //     formatter: (params) => {
                //         console.log(params)
                //     }
                // }
            },
            tooltip: this.getTooltip(),
            grid: {
                left: '15%',
                right: '15%',
                bottom: '7%',
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
                name: 'date',
                splitLine: {
                    lineStyle: {
                        type: 'dashed'
                    }
                },
                smooth: true,
                axisLine: {onZero: true},
                axisLabel: {
                    rotate: 315,
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
                //min: 0,
            },
            series: series
        };
    }

    private buildDataSeries(chartModel: SeriesChartInterface) {
        let regressionData = chartModel.data;
        let formula = chartModel.formula;

        //console.log(chartModel.regressionFormulaKey);
        if (typeof this._dataService.regressionFormulaByName[chartModel.regressionFormulaKey] !== 'undefined')
        {
            formula = this._dataService.regressionFormulaByName[chartModel.regressionFormulaKey];
        }

        formula +=  ' ' + chartModel.countryName;

        return {
            name: chartModel.name,
            id: chartModel.name + ' for ' + chartModel.countryName,
            type: 'line',
            //stack: chartModel.countryName,
            smooth: true,
            data: regressionData,
            markLine: this.getMarkLine(formula, regressionData),
            markArea: {
                itemStyle: {
                    borderWidth: 1,
                    opacity: 0.1
                },
                label: {
                    show: true
                },
                data: [
                    [
                        {
                            name: "trend",
                            xAxis: this._dataService.getLastRealDateDataPosition(),
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

    getMarkLine(formula: string, regressionData: Array<any>) {
        return {
            label: {
                show: true,
                position: 'middle',
                formatter: formula,
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

