import * as ecStat from 'echarts-stat/dist/ecStat';
import {CoronaChartResponseInterface} from "../interface/corona-chart-response-interface";
import * as $ from "jquery";
import {SeriesChartInterface} from "../interface/series-chart-interface";
import {DateTimeService} from "../../service/date-time-service";
import {CoronaStatInterface} from "../interface/corona-stat-interface";
import {SeriesGeoInterface} from "../interface/series-geo-interface";

enum RegressionType {
    linear = 'linear',
    exponential = 'exponential',
    polynomial = 'polynomial',
}

enum RegressionFormulaBehavingType
{
    nonLowering = 'nonLowering',
    gteZero = 'gteZero',
}

export class RegressionAndDataService {
    private _dataResponseInterface: CoronaChartResponseInterface;
    private _forecastInDays: number;
    private _regressionFactor: number;
    private _regressionFormulaByName: {};
    private _xAxisAssignment: {};
    private _lastDate;
    private _geoCoordMap: {};
    private _dateService: DateTimeService;
    private _dataRowCount: number;
    private _dateList: {};
    private _chartDateList: {};
    private _selectedDate;
    private _countryById: {};
    private _statsPerCountry: {};
    private _seriesDataByCountryId: {};
    private _countrySelectionList: any[];
    private _seriesGeoModelList: Array<SeriesGeoInterface>;
    private _regressionModelList: {};
    private _triggerRegressionRecalculation: boolean;

    get regressionModelList(): {} {
        return this._regressionModelList;
    }

    get forecastInDays(): number {
        return this._forecastInDays;
    }

    set forecastInDays(value: number) {
        this._forecastInDays = value;
    }

    get regressionFactor(): number {
        return this._regressionFactor;
    }

    set regressionFactor(value: number) {
        this._regressionFactor = value;
    }

    get regressionFormulaByName(): {} {
        return this._regressionFormulaByName;
    }

    get xAxisAssignment(): {} {
        return this._xAxisAssignment;
    }

    get lastDate() {
        return this._lastDate;
    }

    set lastDate(value) {
        this._lastDate = value;
    }

    get geoCoordMap(): {} {
        return this._geoCoordMap;
    }

    get selectedDate() {
        return this._selectedDate;
    }

    set selectedDate(value) {
        this._selectedDate = value;
    }

    get countryById(): {} {
        return this._countryById;
    }

    get seriesDataByCountryId(): {} {
        return this._seriesDataByCountryId;
    }

    get countrySelectionList(): any[] {
        return this._countrySelectionList;
    }

    get seriesGeoModelList(): any[] {
        return this._seriesGeoModelList;
    }

    set triggerRegressionRecalculation(value: boolean) {
        this._triggerRegressionRecalculation = value;
    }

    constructor(dataResponseInterface: CoronaChartResponseInterface) {
        this._dataResponseInterface = dataResponseInterface;
        this._xAxisAssignment = {};
        this._regressionFactor = 5;
        this._dataRowCount = 0;
        this._triggerRegressionRecalculation = true;
        this._regressionFormulaByName = {};
        this._forecastInDays = 7;
        this._geoCoordMap = {};
        this._statsPerCountry = {};
        this._chartDateList = {};
        this._dateList = {};
        this._countryById = {};
        this._seriesDataByCountryId = {};
        this._countrySelectionList = [];
        this._seriesGeoModelList = [];
    }

    init() {
        this._dateService = new DateTimeService();

        this.buildRegression();
    }

    buildRegression() {
        this.processResponseData();
        //this.calculateRegressions();
        this.buildGeoSeriesData();
    }

    processResponseData(): void {
        for (let date of this._dataResponseInterface.dateList) {
            this._xAxisAssignment[date] = this._dataRowCount;
            this._dateList[this._dataRowCount] = date;
            this._chartDateList[this._dataRowCount] = date;
            this._lastDate = date;
            this._dataRowCount++;
        }

        let countrySelectionList = [];

        for (let country of this._dataResponseInterface.countryList) {
            this._countryById[country.id] = country;
            countrySelectionList.push({id: country.id, text: country.name, selected: false});
            let emptySeriesData = [];
            for (let date of this._dataResponseInterface.dateList) {
                emptySeriesData.push({
                    date: date,
                    country: country,
                    amountTotal: 0,
                    amountInfected: 0,
                    amountHealed: 0,
                    amountDeath: 0,
                    amountTotalTheDayBefore: 0,
                    amountInfectedTheDayBefore: 0,
                    amountHealedTheDayBefore: 0,
                    amountDeathTheDayBefore: 0,
                    doublingTotalRate: 0,
                    doublingInfectionRate: 0,
                    doublingHealedRate: 0,
                    doublingDeathRate: 0,
                });
            }
            let countryData = emptySeriesData;

            if (this._dataResponseInterface.data[country.id]) {
                this._statsPerCountry[country.id] = this._dataResponseInterface.data[country.id];
                $.each(this._statsPerCountry[country.id], (key, value) => {
                    countryData[this._xAxisAssignment[value.date]] = value;
                });

                this._seriesDataByCountryId[country.id] = countryData.sort(function (a, b) {
                    return ((a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
                });
            }
        }

        this._countrySelectionList = countrySelectionList.sort(function (a, b) {
            return ((a.name < b.name) ? -1 : ((a.name > b.name) ? 1 : 0));
        });

        for (let country of this._dataResponseInterface.countryList) {
            let lat = parseFloat(country.latitude.toString());
            let lng = parseFloat(country.longitude.toString());
            this._geoCoordMap[country.name] = [lng, lat];//todo geo service
        }
    }

    buildGeoSeriesData() {
        let lastAmountTotalGeoStatPerCountry = {};

        let amountCases = 0;
        let amountInfected = 0;
        let amountHealed = 0;
        let amountDeath = 0;
        let amountCasesNew = 0;
        let amountInfectedNew = 0;
        let amountHealedNew = 0;
        let amountDeathNew = 0;
        let amountCasesPerPopulation = 0;
        let amountHealedPerPopulation = 0;
        let amountDeathPerPopulation = 0;
        let amountInfectedPerPopulation = 0;
        let doublingCasesRate = 0;
        let mortalityCasesRate = 0;
        let lastAmountCasesGeoData = [];
        let lastAmountInfectedGeoData = [];
        let lastAmountHealedGeoData = [];
        let lastAmountDeathGeoData = [];
        let lastAmountCasesNewGeoData = [];
        let lastAmountInfectedNewGeoData = [];
        let lastAmountHealedNewGeoData = [];
        let lastAmountDeathNewGeoData = [];
        let lastAmountCasesGeoDataPopulation = [];
        let lastAmountInfectedGeoDataPopulation = [];
        let lastAmountHealedGeoDataPopulation = [];

        let lastAmountDeathGeoDataPopulation = [];
        let doublingRateSeriesData = [];
        let mortalityRateSeriesData = [];

        this.checkRegressionRecalculation();
        let dateIndex = this._xAxisAssignment[this.selectedDate];
        for (let country of this._dataResponseInterface.countryList) {
            if (this.regressionModelList[country.id] && this.regressionModelList[country.id][dateIndex] && country.name !== 'World') {
                lastAmountTotalGeoStatPerCountry[country.id] = this.regressionModelList[country.id][dateIndex];
            }
        }

        $.each(lastAmountTotalGeoStatPerCountry, (key, stat: CoronaStatInterface) => {

            let perPopulation = (stat.country.population) || 1;

            let totalPerPopulation = stat.amountTotal / perPopulation;
            let healedPerPopulation = stat.amountHealed / perPopulation;
            let deathPerPopulation = stat.amountDeath / perPopulation;
            let infectedPerPopulation = stat.amountInfected / perPopulation;
            let newCases = stat.amountTotal - stat.amountTotalTheDayBefore;
            let newInfected = stat.amountInfected - stat.amountInfectedTheDayBefore;
            let newHealed = stat.amountHealed - stat.amountHealedTheDayBefore;
            let newDeath = stat.amountDeath - stat.amountDeathTheDayBefore;

            if (amountCases < stat.amountTotal) {
                amountCases = stat.amountTotal;
            }
            if (amountInfected < stat.amountInfected) {
                amountInfected = stat.amountInfected;
            }
            if (amountHealed < stat.amountHealed) {
                amountHealed = stat.amountHealed;
            }
            if (amountDeath < stat.amountDeath) {
                amountDeath = stat.amountDeath;
            }
            if (amountCasesNew < newCases) {
                amountCasesNew = newCases;
            }
            if (amountInfectedNew < newInfected) {
                amountInfectedNew = newInfected;
            }
            if (amountHealedNew < newHealed) {
                amountHealedNew = newHealed;
            }
            if (amountDeathNew < newDeath) {
                amountDeathNew = newDeath;
            }

            if (amountCasesPerPopulation < totalPerPopulation) {
                amountCasesPerPopulation = totalPerPopulation;
            }
            if (amountHealedPerPopulation < healedPerPopulation) {
                amountHealedPerPopulation = healedPerPopulation;
            }
            if (amountDeathPerPopulation < deathPerPopulation) {
                amountDeathPerPopulation = deathPerPopulation;
            }
            if (amountInfectedPerPopulation < infectedPerPopulation) {
                amountInfectedPerPopulation = infectedPerPopulation;
            }
            if (stat.doublingInfectionRate > 0 && doublingCasesRate < stat.doublingInfectionRate) {
                doublingCasesRate = stat.doublingInfectionRate;
            }
            let mortality = 100 * (stat.amountTotal > 0 ? (stat.amountDeath / stat.amountTotal) : 0);
            if (mortality > 0 && mortalityCasesRate < mortality) {
                mortalityCasesRate = mortality;
            }

            lastAmountCasesGeoData.push({name: stat.country.name, value: stat.amountTotal, stat: stat});
            lastAmountInfectedGeoData.push({name: stat.country.name, value: stat.amountInfected, stat: stat});
            lastAmountHealedGeoData.push({name: stat.country.name, value: stat.amountHealed, stat: stat});
            lastAmountDeathGeoData.push({name: stat.country.name, value: stat.amountDeath, stat: stat});
            lastAmountCasesNewGeoData.push({name: stat.country.name, value: newCases, stat: stat});
            lastAmountInfectedNewGeoData.push({name: stat.country.name, value: newInfected, stat: stat});
            lastAmountHealedNewGeoData.push({name: stat.country.name, value: newHealed, stat: stat});
            lastAmountDeathNewGeoData.push({name: stat.country.name, value: newDeath, stat: stat});
            if (stat.doublingInfectionRate > 0) {
                doublingRateSeriesData.push({name: stat.country.name, value: stat.doublingInfectionRate, stat: stat});
            }
            if (mortality > 0) {
                //amountMortality.push(100 * (stat.amountTotal > 0 ? (stat.amountDeath / stat.amountTotal) : 0));
                mortalityRateSeriesData.push({name: stat.country.name, value: mortality, stat: stat});
            }
            lastAmountCasesGeoDataPopulation.push({name: stat.country.name, value: (stat.amountTotal / perPopulation), stat: stat});
            lastAmountInfectedGeoDataPopulation.push({name: stat.country.name, value: (stat.amountInfected / perPopulation), stat: stat});
            lastAmountHealedGeoDataPopulation.push({name: stat.country.name, value: (stat.amountHealed / perPopulation), stat: stat});
            lastAmountDeathGeoDataPopulation.push({name: stat.country.name, value: (stat.amountDeath / perPopulation), stat: stat});
        });

        this._seriesGeoModelList = [];

        this._seriesGeoModelList.push({
            name: 'cases',
            data: lastAmountCasesGeoData,
            relativeAmount: amountCases,
            color: '#ffce1b',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'infected',
            data: lastAmountInfectedGeoData,
            relativeAmount: amountCases,
            color: '#112aff',
            regressionType: RegressionType.polynomial,
            selected: true
        });
        this._seriesGeoModelList.push({
            name: 'healed',
            data: lastAmountHealedGeoData,
            relativeAmount: amountHealed,
            color: '#3bb93e',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'death',
            data: lastAmountDeathGeoData,
            relativeAmount: amountDeath,
            color: '#ff2e36',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'new cases',
            data: lastAmountCasesNewGeoData,
            relativeAmount: amountCasesNew,
            color: '#a77d1a',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'new infected',
            data: lastAmountInfectedNewGeoData,
            relativeAmount: amountInfectedNew,
            color: '#111f9c',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'new healed',
            data: lastAmountHealedNewGeoData,
            relativeAmount: amountHealedNew,
            color: '#2a7a2d',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'new died',
            data: lastAmountDeathNewGeoData,
            relativeAmount: amountDeathNew,
            color: '#912026',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'doublingRateInfections',
            data: doublingRateSeriesData,
            relativeAmount: doublingCasesRate,
            color: '#7a4e73',
            regressionType: RegressionType.linear,
            selected: false
        });

        this._seriesGeoModelList.push({
            name: 'cases/population',
            data: lastAmountCasesGeoDataPopulation,
            relativeAmount: amountCasesPerPopulation,
            color: '#c79a1b',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'infected/population',
            data: lastAmountInfectedGeoDataPopulation,
            relativeAmount: amountInfectedPerPopulation,
            color: '#1011c7',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'healed/population',
            data: lastAmountHealedGeoDataPopulation,
            relativeAmount: amountHealedPerPopulation,
            color: '#1d441f',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'death/population',
            data: lastAmountDeathGeoDataPopulation,
            relativeAmount: amountDeathPerPopulation,
            color: '#631219',
            regressionType: RegressionType.polynomial,
            selected: false
        });
        this._seriesGeoModelList.push({
            name: 'mortality',
            data: mortalityRateSeriesData,
            relativeAmount: mortalityCasesRate,
            color: '#631219',
            regressionType: RegressionType.polynomial,
            selected: false
        });
    }

    checkRegressionRecalculation() {
        if (this._triggerRegressionRecalculation) {
            this.calculateRegressions();
            this._triggerRegressionRecalculation = false;
        }
    }

    calculateRegressions() {
        this._regressionModelList = $.extend(true, {}, this.seriesDataByCountryId);
        $.each(this._regressionModelList, (countryId, countryData) => {
            // @ts-ignore
            let regressionData = {
                amountTotal: [],
                amountInfected: [],
                amountHealed: [],
                amountDeath: [],

                doublingTotalRate: [],
                doublingInfectionRate: [],
                doublingHealedRate: [],
                doublingDeathRate: [],
            };
            let linearRegression = {
                doublingTotalRate: [],
                doublingInfectionRate: [],
                doublingHealedRate: [],
                doublingDeathRate: [],
            };
            let aStat: CoronaStatInterface;
            $.each(countryData, (key, stat: CoronaStatInterface) => {
                regressionData.amountTotal.push(stat.amountTotal);
                regressionData.amountInfected.push(stat.amountInfected);
                regressionData.amountHealed.push(stat.amountHealed);
                regressionData.amountDeath.push(stat.amountDeath);
                regressionData.doublingTotalRate.push(stat.doublingTotalRate);
                regressionData.doublingInfectionRate.push(stat.doublingInfectionRate);
                regressionData.doublingHealedRate.push(stat.doublingHealedRate);
                regressionData.doublingDeathRate.push(stat.doublingDeathRate);
                aStat = stat;
            });
            let exampleStat: CoronaStatInterface;
            exampleStat = $.extend(true, {}, aStat);
            exampleStat.amountTotal = 0;
            exampleStat.amountInfected = 0;
            exampleStat.amountHealed = 0;
            exampleStat.amountDeath = 0;
            exampleStat.amountTotalTheDayBefore = 0;
            exampleStat.amountInfectedTheDayBefore = 0;
            exampleStat.amountHealedTheDayBefore = 0;
            exampleStat.amountDeathTheDayBefore = 0;
            exampleStat.doublingTotalRate = 0;
            exampleStat.doublingInfectionRate = 0;
            exampleStat.doublingHealedRate = 0;
            exampleStat.doublingDeathRate = 0;

            $.each(regressionData, (name, data: Array<number>) => {

                let regression;
                let regressionData = [];
                let positiveValueFound = false;
                let lastDate = this._lastDate;

                //start with the first non zero value
                for (let i = 0; i < data.length; i++) {
                    if (positiveValueFound || data[i] > 0)
                    {
                        regressionData.push([i, data[i]]);
                        positiveValueFound = true;
                    }
                }
                if (typeof linearRegression[name] !== 'undefined') {
                    regression = ecStat.regression('linear', regressionData);
                } else {
                    regression = ecStat.regression('polynomial', regressionData, this._regressionFactor);
                }
                this._regressionFormulaByName[name] = regression.expression;
                let formula = this.getRegressionFormula(regression);

                for (let i = this._xAxisAssignment[this._lastDate] + 1; i < (this._xAxisAssignment[this._lastDate] + this.forecastInDays + 1); i++) {
                    let tmpDate = new Date(lastDate);
                    tmpDate.setDate(tmpDate.getDate() + 1);
                    lastDate = this._dateService.formatDate(tmpDate);
                    let subFormula = formula.replace(/x/g, i.toString());
                    let formulaResult = eval(subFormula);

                    this._xAxisAssignment[lastDate] = i;

                    if (typeof this._regressionModelList[countryId][i] === 'undefined')
                    {
                        // @ts-ignore
                        this._regressionModelList[countryId][i] = $.extend(true, {}, exampleStat);
                        if (typeof this._regressionModelList[countryId][i - 1] !== 'undefined')
                        {
                            this._regressionModelList[countryId][i]['amountTotalTheDayBefore'] = this._regressionModelList[countryId][i - 1]['amountTotal'];
                            this._regressionModelList[countryId][i]['amountInfectedTheDayBefore'] = this._regressionModelList[countryId][i - 1]['amountInfected'];
                            this._regressionModelList[countryId][i]['amountHealedTheDayBefore'] = this._regressionModelList[countryId][i - 1]['amountHealed'];
                            this._regressionModelList[countryId][i]['amountDeathTheDayBefore'] = this._regressionModelList[countryId][i - 1]['amountDeath'];
                        }
                    }
                    // @ts-ignore
                    this._regressionModelList[countryId][i].date = lastDate;
                    if (typeof linearRegression[name] !== 'undefined') {
                        // @ts-ignore
                        this._regressionModelList[countryId][i][name] = formulaResult;
                    } else {
                        // @ts-ignore
                        this._regressionModelList[countryId][i][name] = Math.floor(formulaResult);
                    }
                }
            });
        });
        //console.log(this._regressionModelList);
    }

    getLastRealDateDataPosition()
    {
        return this._xAxisAssignment[this._lastDate];
    }

    getDataPositionByDate(date: string)
    {
        return this._xAxisAssignment[date];
    }

    getLastDateWithForecastDataPosition()
    {
        return this.getLastRealDateDataPosition() + this.forecastInDays;
    }

    getRegressionFormula(regression) {
        return regression.expression
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
            .replace('x^10', '*(x*x*x*x*x*x*x*x*x*x)');
    }
}
