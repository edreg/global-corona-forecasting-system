import {CountryInterface} from "./country-interface";
import {CoronaStatInterface} from "./corona-stat-interface";

export interface CoronaChartResponseInterface {
    countryList: Array<CountryInterface>;
    data: ArrayLike<Array<CoronaStatInterface>>;
    dateList: Array<string>
}