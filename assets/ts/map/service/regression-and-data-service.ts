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

export class RegressionAndDataService {
    private _dataResponseInterface: CoronaChartResponseInterface;
    private _forecastInDays: number;
    private _regressionDateList: {};
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

    get forecastInDays(): number {
        return this._forecastInDays;
    }

    set forecastInDays(value: number) {
        this._forecastInDays = value;
    }

    get regressionDateList(): {} {
        return this._regressionDateList;
    }

    set regressionDateList(value: {}) {
        this._regressionDateList = value;
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

    get dateList(): {} {
        return this._dateList;
    }

    get chartDateList(): {} {
        return this._chartDateList;
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

    constructor(dataResponseInterface: CoronaChartResponseInterface) {
        this._dataResponseInterface = dataResponseInterface;
        this._xAxisAssignment = {};
        this._regressionFactor = 5;
        this._dataRowCount = 0;
        this._regressionFormulaByName = {};
        this._regressionDateList = {};
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
        this.buildGeoSeriesData();
        //this.calculateRegressions();
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

        for (let country of this._dataResponseInterface.countryList) {
            if (this._dataResponseInterface.data[country.id] && this._dataResponseInterface.data[country.id][this.selectedDate] && country.name !== 'World') {
                lastAmountTotalGeoStatPerCountry[country.id] = this._dataResponseInterface.data[country.id][this.selectedDate];
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
    }

    calculateRegressions() {

        let regressionModelList = {};
        $.each(this.seriesDataByCountryId, (countryId, countryData) => {
            // @ts-ignore
            regressionModelList[countryId] = {};
            let regressionData = {
                amountTotal: [],
                amountInfected: [],
                amountHealed: [],
                amountDeath: [],

                amountTotalTheDayBefore: [],
                amountInfectedTheDayBefore: [],
                amountHealedTheDayBefore: [],
                amountDeathTheDayBefore: [],

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
            let exampleStat:CoronaStatInterface;
            $.each(countryData, (key, stat: CoronaStatInterface) => {
                regressionData.amountTotal.push(stat.amountTotal);
                regressionData.amountInfected.push(stat.amountInfected);
                regressionData.amountHealed.push(stat.amountHealed);
                regressionData.amountDeath.push(stat.amountDeath);
                regressionData.amountTotalTheDayBefore.push(stat.amountTotalTheDayBefore);
                regressionData.amountInfectedTheDayBefore.push(stat.amountInfectedTheDayBefore);
                regressionData.amountHealedTheDayBefore.push(stat.amountHealedTheDayBefore);
                regressionData.amountDeathTheDayBefore.push(stat.amountDeathTheDayBefore);
                regressionData.doublingTotalRate.push(stat.doublingTotalRate);
                regressionData.doublingInfectionRate.push(stat.doublingInfectionRate);
                regressionData.doublingHealedRate.push(stat.doublingHealedRate);
                regressionData.doublingDeathRate.push(stat.doublingDeathRate);
                exampleStat = stat;
            });
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
                let mappedSeries = data.map((value, key) => { return [key, value || 0]; });
                let regression;
                if (typeof linearRegression[name] !== 'undefined') {
                    regression = ecStat.regression('linear', mappedSeries);
                } else {
                    regression = ecStat.regression('polynomial', mappedSeries, this._regressionFactor);
                }
                this._regressionFormulaByName[name] = regression.expression;
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
                    lastDate = this._dateService.formatDate(tmpDate);
                    let subFormula = formula.replace(/x/g, i.toString());
                    let formulaResult = eval(subFormula);

                    this._xAxisAssignment[lastDate] = i;
                    this._regressionDateList[i] = lastDate;

                    //regressionData[name].push(Math.floor(formulaResult));
                    if (typeof regressionModelList[countryId][i] === 'undefined')
                    {
                        // @ts-ignore
                        regressionModelList[countryId][i] = $.extend(true, {}, exampleStat);
                    }
                    // @ts-ignore
                    regressionModelList[countryId][i].date = lastDate;
                    if (typeof linearRegression[name] !== 'undefined') {
                        // @ts-ignore
                        regressionModelList[countryId][i][name] = formulaResult;
                    } else {
                        // @ts-ignore
                        regressionModelList[countryId][i][name] = Math.floor(formulaResult);
                    }
                }
            });
        });
        console.log(regressionModelList);
    }

    getRegression(chartModel: SeriesChartInterface) {
        if (chartModel.buildRegression == false) {
            return chartModel;
        }
        let mappedSeries = chartModel.data
            .map((value, key) => {
                return [key, value || 0];
            });

        let regression;

        switch (chartModel.regressionType) {
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
        let lastFormulaResult = 0;

        for (let i = this._xAxisAssignment[this._lastDate] + 1; i < (this._xAxisAssignment[this._lastDate] + this._forecastInDays); i++) {
            let tmpDate = new Date(lastDate);
            tmpDate.setDate(tmpDate.getDate() + 1);
            lastDate = this._dateService.formatDate(tmpDate);
            let subFormula = formula.replace(/x/g, i.toString());
            let formulaResult = eval(subFormula);

            this._xAxisAssignment[lastDate] = i;
            this._regressionDateList[i] = lastDate;

            lastFormulaResult = formulaResult;
            if (chartModel.regressionType == 'linear') {
                chartModel.data.push(formulaResult);
            } else {
                chartModel.data.push(Math.floor(formulaResult));
            }
        }
    }
}
