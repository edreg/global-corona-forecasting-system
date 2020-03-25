import {CoronaChart} from "./component/corona-chart";
import * as $ from 'jquery';

$(function () {
    let module = new CoronaChart('corona-chart-config');
    module.init();
});
