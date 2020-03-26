import {CoronaChartResponseInterface} from "../interface/corona-chart-response-interface";
import * as $ from "jquery";

enum RegressionFormulaBehavingType
{
    nonLowering = 'nonLowering',
    gteZero = 'gteZero',
}

enum RegressionType
{
    linear = 'linear',
    exponential = 'exponential',
    polynomial = 'polynomial',
}

export class RegressionService
{
    get dataResponseInterface(): CoronaChartResponseInterface {
        return this._dataResponseInterface;
    }

    private _dataResponseInterface: CoronaChartResponseInterface;

    constructor(dataResponseInterface: CoronaChartResponseInterface) {
        this._dataResponseInterface = dataResponseInterface;
    }

    init() {

    }
}
