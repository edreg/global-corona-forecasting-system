enum RegressionFormulaBehavingType {
    nonLowering = 'nonLowering',
    gteZero = 'gteZero',
}

enum RegressionType {
    linear = 'linear',
    exponential = 'exponential',
    polynomial = 'polynomial',
}

export interface SeriesGeoInterface {
    name: string;
    data: Array<any>;
    relativeAmount: number;
    regressionType: string;
    color: string;
    selected: boolean;
}