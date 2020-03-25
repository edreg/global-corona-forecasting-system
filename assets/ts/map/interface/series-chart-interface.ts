export interface SeriesChartInterface {
    color: string;
    selected: boolean;
    countryName: string;
    data: Array<any>;
    name: string;
    buildRegression: boolean;
    regressionType: string; //'polynomial'
}