import {CoronaChartResponseInterface} from "../interface/corona-chart-response-interface";

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
    private _dataResponseInterface: CoronaChartResponseInterface;
}
