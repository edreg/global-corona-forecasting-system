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
import ExtensionAPI from 'echarts/lib/ExtensionAPI';
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

export class CoronaChart implements InitializableInterface, DestroyableInterface {

    private _settings: CoronaChartInterface;
    private _chartPerCountry: echarts.ECharts;
    private _geoChart: echarts.ECharts;
    private _chartResponseInterface: CoronaChartResponseInterface;
    private _chartPerCountryDiv: HTMLDivElement | any;
    private _geoChartDiv: HTMLElement | any;
    private _xAxisAssignment: {};
    private _statsPerCountry: {};
    private _seriesDataByCountryId: {};
    private _countrySelectionList: any[];
    private _countrySelection: JQuery<HTMLElement>;
    private _countryById: {};
    private _dataRowCount: number;
    private _dateList: {};
    private _regressionDateList: {};
    private _chartDateList: {};
    private _lastDate;
    private _selectedDate;
    private _regressionFactor: number;
    private _geoCoordMap: {};
    private _countryId: number;
    private _selectedCountryIdList: any;
    private _selectedGeoChartLegend: {};
    private _selectedChartLegend: {};
    private _regressionFormulaByName: {};
    private _seriesGeoModelList: Array<SeriesGeoInterface>;
    private _seriesChartModelList: Array<SeriesChartInterface>;
    private _geoMapCenter: number[];
    private _geoMapZoom: number;
    private _geoMapLeft: string;
    private _geoMapTop: string;
    private _geoMapBottom: string;
    private _geoMapRight: string;
    private _forecastInDays: number;
    private _geoChartApi: any;


    constructor(settingContainerId: string) {
        let settingsSelector = $('#' + settingContainerId);

        if (settingsSelector.length != 0) {
            this._settings = JSON.parse(settingsSelector.html());
        }
    }

    init(): void {
        this._dataRowCount = 0;
        this._countryId = 0;
        this._regressionFactor = 5;
        this._forecastInDays = 7;
        this._geoChartDiv = $('div#corona-geo-chart-div').get(0);
        this._geoChart = echarts.init(this._geoChartDiv);
        this._chartPerCountryDiv = $('div#corona-chart-per-country-div').get(0);
        this._chartPerCountry = echarts.init(this._chartPerCountryDiv);
        this._xAxisAssignment = {};
        this._statsPerCountry = {};
        this._regressionFormulaByName = {};
        this._countrySelectionList = [];
        this._seriesDataByCountryId = {};
        this._seriesGeoModelList = [];
        this._seriesChartModelList = [];
        this._dateList = {};
        this._regressionDateList = {};
        this._chartDateList = {};
        this._countryById = {};
        this._selectedCountryIdList = [0];
        this._geoCoordMap = {};
        this._geoMapCenter = [10, 59];
        this._geoMapLeft = '0%';
        this._geoMapTop = '15%';
        this._geoMapBottom = '15%';
        this._geoMapRight = '0%';
        this._geoMapZoom = 0;
        //this._geoChartApi = new ExtensionAPI(this._geoChart);
        this._countrySelection = $('select#country-selection');
        // @ts-ignore
        // $('#stats-table-datepicker').datepicker({
        //     uiLibrary: 'bootstrap4',
        //     format: 'yyyy-mm-dd',
        //
        // });
        this.initChart();
    }

    initChart(): void {
        AjaxService.ajaxRequest(this._settings.jsonDataUrl, []).done((response: CoronaChartResponseInterface) => {
            this._chartResponseInterface = response;
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
        this.processResponseData();
        this.buildRangeConfig();
        this.buildDateConfig();
        this.buildCountryConfig();

        this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);
        this._geoChart.setOption(this.getGeoChartOptions(), true);
        this._geoChart.on('legendselectchanged', (params) => {
            this._selectedGeoChartLegend = params.selected;
        });
        this._chartPerCountry.on('legendselectchanged', (params) => {
            // console.log(params);
            this._selectedChartLegend = params.selected;
        });
        this._geoChart.on('georoam', (params) => {
            console.log('georoam');
            console.log(params);
            //this._geoChart.getOption().geo.roam = true;
            //this.updateZoomAndCenterOfGeoChart();
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
        let sliderElement = $("#slider-range");
        let dateTextField = $("#selected-date");
        this._selectedDate = this._lastDate;

        // @ts-ignore
        sliderElement.slider({
            range: false,
            min: new Date('2020-01-22').getTime() / 1000,
            max: new Date(this._lastDate).getTime() / 1000,
            step: 86400,
            values: [
                new Date(this._selectedDate).getTime() / 1000,
            ],
            slide: (event, ui) => {
                let date = new Date(ui.values[0] * 1000);
                dateTextField.val(date.toDateString());
                this.updateZoomAndCenterOfGeoChart();
                this._selectedDate = this.formatDate(date);
                this._geoChart.setOption(this.getGeoChartOptions(), true);
                this.fireRoamingEvents();

            }
        });
        // @ts-ignore
        dateTextField.val((new Date(sliderElement.slider("values", 0) * 1000).toDateString()));
    }

    buildRangeConfig()
    {
        let rangeControl = $('input#polynomial-coefficients-range-control');
        rangeControl.on("input change", (event) => {
            let val = $(event.target).val();
            this._regressionFactor = (parseInt(val.toString()));
            this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);
        }).val(this._regressionFactor);

        let forecastControl = $('input#forecast-days-range-control');
        forecastControl.on("input change", (event) => {
            let val = $(event.target).val();
            this._forecastInDays = (parseInt(val.toString()));
            this._regressionDateList = this._chartDateList;

            this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);
        }).val(this._forecastInDays);
    }

    buildCountryConfig(): void
    {
        $.each(this._countrySelectionList, (key, value) => {
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

            //this._countryId = parseInt($(this._countrySelection).val().toString());
            this._chartPerCountry.setOption(this.getChartPerCountryOptions(), true);
        });
    }

    processResponseData(): void
    {
        let totalSeriesData = [];
        let totalCountry = { name: 'total', id: 0 };
        this._countryById[totalCountry.id] = totalCountry;

        for (let date of this._chartResponseInterface.dateList)
        {
            this._xAxisAssignment[date] = this._dataRowCount;
            this._dateList[this._dataRowCount] = date;
            this._chartDateList[this._dataRowCount] = date;
            this._lastDate = date;
            totalSeriesData.push({
                date: date,
                country: totalCountry,
                amountTotal: 0,
                amountInfected: 0,
                amountHealed: 0,
                amountDeath: 0,
                amountTotalTheDayBefore: 0,
                amountHealedTheDayBefore: 0,
                amountDeathTheDayBefore: 0,
                doublingInfectionRate: 0,
                doublingDeathRate: 0,
                doublingHealedRate: 0,
            });
            this._dataRowCount++;
        }

        this._seriesDataByCountryId[0] = totalSeriesData;

        let countrySelectionList = [];
        countrySelectionList.push({ id: 0, text: 'total', selected: true });

        for (let country of this._chartResponseInterface.countryList)
        {
            this._countryById[country.id] = country;
            countrySelectionList.push({ id: country.id, text: country.name, selected: false });
            let emptySeriesData = [];
            for (let date of this._chartResponseInterface.dateList)
            {
                emptySeriesData.push({
                    date: date,
                    country: country,
                    amountTotal: 0,
                    amountInfected: 0,
                    amountHealed: 0,
                    amountDeath: 0,
                    amountTotalTheDayBefore: 0,
                    amountHealedTheDayBefore: 0,
                    amountDeathTheDayBefore: 0,
                    doublingInfectionRate: 0,
                    doublingDeathRate: 0,
                    doublingHealedRate: 0,
                });
            }
            let countryData = emptySeriesData;

            if (this._chartResponseInterface.data[country.id])
            {
                this._statsPerCountry[country.id] = this._chartResponseInterface.data[country.id];
                for (let stat of this._statsPerCountry[country.id])
                {
                    countryData[this._xAxisAssignment[stat.date]] = stat;
                    this._seriesDataByCountryId[0][this._xAxisAssignment[stat.date]].amountTotal += stat.amountTotal;
                    this._seriesDataByCountryId[0][this._xAxisAssignment[stat.date]].amountInfected += stat.amountInfected;
                    this._seriesDataByCountryId[0][this._xAxisAssignment[stat.date]].amountHealed += stat.amountHealed;
                    this._seriesDataByCountryId[0][this._xAxisAssignment[stat.date]].amountDeath += stat.amountDeath;
                    this._seriesDataByCountryId[0][this._xAxisAssignment[stat.date]].amountTotalTheDayBefore += stat.amountTotalTheDayBefore;
                    this._seriesDataByCountryId[0][this._xAxisAssignment[stat.date]].amountHealedTheDayBefore += stat.amountHealedTheDayBefore;
                    this._seriesDataByCountryId[0][this._xAxisAssignment[stat.date]].amountDeathTheDayBefore += stat.amountDeathTheDayBefore;

                }

                this._seriesDataByCountryId[country.id] = countryData.sort(function (a, b) {
                    return ((a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
                });
            }
        }

        this._countrySelectionList = countrySelectionList.sort(function (a, b) {
            return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
        });

        for (let country of this._chartResponseInterface.countryList) {
            this._geoCoordMap[country.name] = [parseFloat(country.longitude.toString()), parseFloat(country.latitude.toString())];
        }

    }

    buildGeoSeriesData()
    {
        let lastAmountTotalGeoStatPerCountry = {};

        let amountTotal = 0;
        let amountInfected = 0;
        let amountHealed = 0;
        let amountDeath = 0;
        let amountTotalPerPopulation = 0;
        let amountHealedPerPopulation = 0;
        let amountDeathPerPopulation = 0;
        let amountInfectedPerPopulation = 0;
        let lastAmountTotalGeoData = [];
        let lastAmountInfectedGeoData = [];
        let lastAmountHealedGeoData = [];
        let lastAmountDeathGeoData = [];
        let lastAmountTotalGeoDataPopulation = [];
        let lastAmountInfectedGeoDataPopulation = [];
        let lastAmountHealedGeoDataPopulation = [];
        let lastAmountDeathGeoDataPopulation = [];

        let doublingRate = 0;
        let relativeAmountNewCases = 0;
        let doublingRateSeriesData = [];
        let newCasesSeriesData = [];

        for (let country of this._chartResponseInterface.countryList)
        {
            if (this._chartResponseInterface.data[country.id])
            {
                for (let stat of this._statsPerCountry[country.id])
                {
                    if (stat.date === this._selectedDate)
                    {
                        lastAmountTotalGeoStatPerCountry[country.id] = stat;
                    }
                }
            }
        }

        $.each(lastAmountTotalGeoStatPerCountry, (key, stat: CoronaStatInterface) => {

            let perPopulation = (stat.country.population) || 1;

            let totalPerPopulation = (stat.amountTotal / perPopulation);
            let healedPerPopulation = (stat.amountHealed / perPopulation);
            let deathPerPopulation = (stat.amountDeath / perPopulation);
            let infectedPerPopulation = ((stat.amountTotal - stat.amountHealed - stat.amountDeath) / perPopulation);
            let newCases = stat.amountTotal - stat.amountTotalTheDayBefore;

            if (amountTotal < stat.amountTotal) { amountTotal = stat.amountTotal; }
            if (amountInfected < stat.amountInfected) {amountInfected = stat.amountInfected;}
            if (amountHealed < stat.amountHealed) {amountHealed = stat.amountHealed;}
            if (amountDeath < stat.amountDeath) {amountDeath = stat.amountDeath;}
            if (relativeAmountNewCases < newCases) {relativeAmountNewCases = newCases;}
            if (amountTotalPerPopulation < totalPerPopulation) {amountTotalPerPopulation = totalPerPopulation;}
            if (amountHealedPerPopulation < healedPerPopulation) {amountHealedPerPopulation = healedPerPopulation;}
            if (amountDeathPerPopulation < deathPerPopulation) {amountDeathPerPopulation = deathPerPopulation;}
            if (amountInfectedPerPopulation < infectedPerPopulation) {amountInfectedPerPopulation = infectedPerPopulation;}
            if (stat.doublingInfectionRate > 0 && doublingRate < stat.doublingInfectionRate) {doublingRate = stat.doublingInfectionRate;}

            lastAmountTotalGeoData.push({name: stat.country.name, value: stat.amountTotal, stat: stat});
            lastAmountInfectedGeoData.push({name: stat.country.name, value: stat.amountTotal - stat.amountHealed - stat.amountDeath, stat: stat});
            lastAmountHealedGeoData.push({name: stat.country.name, value: stat.amountHealed, stat: stat});
            lastAmountDeathGeoData.push({name: stat.country.name, value: stat.amountDeath, stat: stat});
            newCasesSeriesData.push({name: stat.country.name, value: newCases, stat: stat});
            if (stat.doublingInfectionRate > 0)
            {
                doublingRateSeriesData.push({name: stat.country.name, value: stat.doublingInfectionRate, stat: stat});
            }
            lastAmountTotalGeoDataPopulation.push({name: stat.country.name, value: (stat.amountTotal / perPopulation), stat: stat});
            lastAmountInfectedGeoDataPopulation.push({name: stat.country.name, value: ((stat.amountTotal - stat.amountHealed - stat.amountDeath) / perPopulation), stat: stat});
            lastAmountHealedGeoDataPopulation.push({name: stat.country.name, value: (stat.amountHealed / perPopulation), stat: stat});
            lastAmountDeathGeoDataPopulation.push({name: stat.country.name, value: (stat.amountDeath / perPopulation), stat: stat});
        });

        this._seriesGeoModelList = [];

        this._seriesGeoModelList.push({
            name: 'cases',
            data: lastAmountTotalGeoData,
            relativeAmount: amountTotal,
            color: '#ffce1b',
            invertRelativeAmount: false,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'infected',
            data: lastAmountInfectedGeoData,
            relativeAmount: amountTotal,
            color: '#112aff',
            invertRelativeAmount: false,
            selected: true
        });
        this._seriesGeoModelList.push({
            name: 'healed',
            data: lastAmountHealedGeoData,
            relativeAmount: amountHealed,
            color: '#2a7a2d',
            invertRelativeAmount: false,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'new cases',
            data: newCasesSeriesData,
            relativeAmount: relativeAmountNewCases,
            color: '#7a1345',
            invertRelativeAmount: false,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'doublingRateInfections',
            data: doublingRateSeriesData,
            relativeAmount: doublingRate,
            color: '#7a4e73',
            invertRelativeAmount: true,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'death',
            data: lastAmountDeathGeoData,
            relativeAmount: amountDeath,
            color: '#ff2e36',
            invertRelativeAmount: false,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'cases/population',
            data: lastAmountTotalGeoDataPopulation,
            relativeAmount: amountTotalPerPopulation,
            color: '#c79a1b',
            invertRelativeAmount: false,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'infected/population',
            data: lastAmountInfectedGeoDataPopulation,
            relativeAmount: amountInfectedPerPopulation,
            color: '#1011c7',
            invertRelativeAmount: false,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'healed/population',
            data: lastAmountHealedGeoDataPopulation,
            relativeAmount: amountHealedPerPopulation,
            color: '#1d441f',
            invertRelativeAmount: false,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'death/population',
            data: lastAmountDeathGeoDataPopulation,
            relativeAmount: amountDeathPerPopulation,
            color: '#631219',
            invertRelativeAmount: false,
            selected: false
        });
    }

    getGeoChartOptions(): any {

        this.buildGeoSeriesData();
        let series = [];
        let legendData = [];
        let legendSelected = {};

        for (let geoSeriesModel of this._seriesGeoModelList)
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
                top: '5%',
                data: legendData,
                inactiveColor: '#565656',
                selectedMode: 'single',
                selected: this._selectedGeoChartLegend
            },
            name: 'geoBubbleChart',
            tooltip : {
                trigger: 'item',
                formatter: (params) =>
                {
                    let stats = params.data.stat;
                    let result = params.data.name + '(population: ' + stats.country.population + ')';

                    if (typeof stats !== 'undefined')
                    {
                        result += '<br>'
                            + 'total cases: <strong>' + stats.amountTotal + '</strong>' + '<br>'
                            + 'infected: <strong>' + (stats.amountTotal - stats.amountHealed - stats.amountDeath) + '</strong>' + '<br>'
                            + 'new cases: <strong>' + (stats.amountTotal - stats.amountTotalTheDayBefore) + '</strong>' + '<br>'
                            + 'healed: <strong>' + stats.amountHealed + '</strong>' + '<br>'
                            + 'doubling infection rate: <strong>' + parseFloat(stats.doublingInfectionRate).toFixed(1) + '</strong>' + '<br>'
                            + 'death: <strong>' + stats.amountDeath + '</strong>' + '<br>';
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
                    areaColor: '#ccc'
                },
                left: this._geoMapLeft,
                top: this._geoMapTop,
                bottom: this._geoMapBottom,
                right: this._geoMapRight,
                zoom: this._geoMapZoom,
                mapStyle: { //TODO check
                    styleJson: [
                        {
                            "featureType": "water",
                            "elementType": "all",
                            "stylers": {
                                "color": "#044161"
                            }
                        },
                        {
                            "featureType": "land",
                            "elementType": "all",
                            "stylers": {
                                "color": "#004981"
                            }
                        },
                        {
                            "featureType": "boundary",
                            "elementType": "geometry",
                            "stylers": {
                                "color": "#064f85"
                            }
                        },
                        {
                            "featureType": "railway",
                            "elementType": "all",
                            "stylers": {
                                "visibility": "off"
                            }
                        },
                        {
                            "featureType": "highway",
                            "elementType": "geometry",
                            "stylers": {
                                "color": "#004981"
                            }
                        },
                        {
                            "featureType": "highway",
                            "elementType": "geometry.fill",
                            "stylers": {
                                "color": "#005b96",
                                "lightness": 1
                            }
                        },
                        {
                            "featureType": "highway",
                            "elementType": "labels",
                            "stylers": {
                                "visibility": "off"
                            }
                        },
                        {
                            "featureType": "arterial",
                            "elementType": "geometry",
                            "stylers": {
                                "color": "#004981"
                            }
                        },
                        {
                            "featureType": "arterial",
                            "elementType": "geometry.fill",
                            "stylers": {
                                "color": "#00508b"
                            }
                        },
                        {
                            "featureType": "poi",
                            "elementType": "all",
                            "stylers": {
                                "visibility": "off"
                            }
                        },
                        {
                            "featureType": "green",
                            "elementType": "all",
                            "stylers": {
                                "color": "#056197",
                                "visibility": "off"
                            }
                        },
                        {
                            "featureType": "subway",
                            "elementType": "all",
                            "stylers": {
                                "visibility": "off"
                            }
                        },
                        {
                            "featureType": "manmade",
                            "elementType": "all",
                            "stylers": {
                                "visibility": "off"
                            }
                        },
                        {
                            "featureType": "local",
                            "elementType": "all",
                            "stylers": {
                                "visibility": "off"
                            }
                        },
                        {
                            "featureType": "arterial",
                            "elementType": "labels",
                            "stylers": {
                                "visibility": "off"
                            }
                        },
                        {
                            "featureType": "boundary",
                            "elementType": "geometry.fill",
                            "stylers": {
                                "color": "#029fd4"
                            }
                        },
                        {
                            "featureType": "building",
                            "elementType": "all",
                            "stylers": {
                                "color": "#1a5787"
                            }
                        },
                        {
                            "featureType": "label",
                            "elementType": "all",
                            "stylers": {
                                "visibility": "off"
                            }
                        }
                    ]
                }
            },
            calculable : true,
            series: series
        }
    }

    //getGeoSeries(name: string, data: any[], relativeAmount: number, color: string) {
    getGeoSeries(geoSeriesModel: SeriesGeoInterface) {
        return {
            name: geoSeriesModel.name,
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: this.convertGeoData(geoSeriesModel.data),
            hoverAnimation: true,
            symbolSize: (val, params) => {
                let result;
                if (geoSeriesModel.invertRelativeAmount)
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
            zlevel: 1
        };
    }

    getChartPerCountryOptions(): any {
        let series = [];

        let chartNameList = [];
        let legendData = [];
        let legendSelectedObject = [];
        let buildLegend = true;
        this._seriesChartModelList = [];
        this._regressionDateList = $.extend(true, {}, this._chartDateList);

        for (let countryId of this._selectedCountryIdList)
        {
            let doublingInfectionRate = [];
            let amountActive = [];
            let amountInfected = [];
            let amountHealed = [];
            let amountDied = [];
            let amountInfectedNew = [];
            let amountHealedNew = [];
            let amountDiedNew = [];
            let country: CountryInterface = this._countryById[countryId];
            chartNameList.push(country.name);

            $.each(this._seriesDataByCountryId[countryId], (key, stat:CoronaStatInterface) => {
                doublingInfectionRate.push(stat.doublingInfectionRate);
                amountActive.push(stat.amountTotal - stat.amountHealed - stat.amountDeath);
                amountInfected.push(stat.amountTotal);
                amountHealed.push(stat.amountHealed);
                amountDied.push(stat.amountDeath);
                amountInfectedNew.push(stat.amountTotal - stat.amountTotalTheDayBefore);
                amountHealedNew.push(stat.amountHealed - stat.amountHealedTheDayBefore);
                amountDiedNew.push(stat.amountDeath - stat.amountDeathTheDayBefore);
            });

            let newInfectedSeriesModel = {color: '#3243e2', selected: false, countryName: country.name, data: amountInfectedNew, name: 'New infections', buildRegression: true, regressionType: 'polynomial'};
            this.getRegression(newInfectedSeriesModel);
            let amountInfectedByNewInfections = [];
            let temValueAmountInfected = 0;
            $.each(newInfectedSeriesModel.data, (key, value) => {
                if (typeof amountInfected[key] === 'undefined')
                {
                    amountInfectedByNewInfections[key] = value + temValueAmountInfected;
                }
                else
                {
                    amountInfectedByNewInfections[key] = amountInfected[key];
                }

                temValueAmountInfected = amountInfectedByNewInfections[key];
            });
            newInfectedSeriesModel.buildRegression = false;
            this._seriesChartModelList.push({color: '#c7ba5f', selected: true, countryName: country.name, data: amountInfectedByNewInfections, name: 'Cases2', buildRegression: false, regressionType: ''});
            this._seriesChartModelList.push({color: '#7832b2', selected: false, countryName: country.name, data: doublingInfectionRate, name: 'Doubling infection rate', buildRegression: true, regressionType: 'linear'});
            this._seriesChartModelList.push({color: '#303f8d', selected: false, countryName: country.name, data: amountActive, name: 'Infected', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push(newInfectedSeriesModel);
            this._seriesChartModelList.push({color: '#9c711a', selected: false, countryName: country.name, data: amountInfected, name: 'Cases', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#225825', selected: false, countryName: country.name, data: amountHealed, name: 'Healed', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#2b9c2e', selected: false, countryName: country.name, data: amountHealedNew, name: 'New healed', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#70020a', selected: false, countryName: country.name, data: amountDied, name: 'Died', buildRegression: true, regressionType: 'polynomial'});
            this._seriesChartModelList.push({color: '#9c020a', selected: false, countryName: country.name, data: amountDiedNew, name: 'New died', buildRegression: true, regressionType: 'polynomial'});

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

        $.each(this._regressionDateList, (key, date) => {
            xAxisData.push(date);
        });

        return {
            title: {
                text: 'COVID-19 for ' + chartNameList.join(' & '),
                left: '5%',
            },
            legend: {
                top: '5%',
                inactiveColor: '#565656',
                selectedMode: 'single',
                data: legendData,
                selected: this._selectedChartLegend
            },
            tooltip: this.getTooltip(),
            grid: this.getGrid(),
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
            this.getRegression(chartModel);
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
                    formatter: (typeof this._regressionFormulaByName[chartModel.name] !== 'undefined' ? this._regressionFormulaByName[chartModel.name] : '') + ' ' + chartModel.countryName,
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
                            xAxis: this._xAxisAssignment[this._lastDate]
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

    getRegression(chartModel: SeriesChartInterface)
    {
        if (chartModel.buildRegression == false)
        {
            return chartModel;
        }
        let mappedSeries = chartModel.data
            .map((value, key) => {
                return [key, value || 0];
            });

        let regression;

        switch (chartModel.regressionType)
        {
            case 'linear':
                regression = ecStat.regression(
                    'linear',
                    mappedSeries
                );
                break;
            case 'exponential':
                regression = ecStat.regression(
                    'exponential',
                    mappedSeries
                );
                break;
            case 'polynomial':
            default:
                regression = ecStat.regression(
                    'polynomial',
                    mappedSeries,
                    this._regressionFactor
                );
                break;
        }

        this._regressionFormulaByName[chartModel.name] = regression.expression;

        let formula = regression.expression
            .replace('y = ', '')
            .replace('x ', '*(x) ')
            .replace('x^2', '*(x*x)')
            .replace('x^3', '*(x*x*x)')
            .replace('x^4', '*(x*x*x*x)')
            .replace('x^5', '*(x*x*x*x*x)')
            .replace('x^6', '*(x*x*x*x*x*x)')
            .replace('x^7', '*(x*x*x*x*x*x*x)')
            .replace('x^8', '*(x*x*x*x*x*x*x*x)')
            .replace('x^9', '*(x*x*x*x*x*x*x*x*x)')
            .replace('x^10', '*(x*x*x*x*x*x*x*x*x*x)')
        ;
        let lastDate = this._lastDate;

        for (let i = this._xAxisAssignment[this._lastDate] + 1; i < (this._xAxisAssignment[this._lastDate] + this._forecastInDays); i++) {
            let tmpDate = new Date(lastDate);
            tmpDate.setDate(tmpDate.getDate() + 1);
            lastDate = this.formatDate(tmpDate);
            let subFormula = formula.replace(/x/g, i.toString());
            let formulaResult = eval(subFormula);

            this._xAxisAssignment[lastDate] = i;
            this._regressionDateList[i] = lastDate;

            chartModel.data.push(Math.floor(formulaResult));
        }
    }

    formatDate(date: Date)
    {
        let year = date.getFullYear();
        let month: string|number = date.getMonth() + 1;
        let day: string|number = date.getDate();

        if (month < 10)
        {
            month = '0' + month.toString();
        }

        if (day < 10)
        {
            day = '0' + day.toString();
        }

        return year + '-' + month + '-' + day;
    }

    getGrid() {
        return {
            left: '5%',
            right: '10%',
            bottom: '10%',
            top: '10%',
            containLabel: true
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

    showModalDialog(id)
    {
        // @ts-ignore
        $(id).modal('show');
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

    destroy(): void {}



}

