import * as $ from 'jquery';
import 'datatables.net-bs4/js/dataTables.bootstrap4';
import 'datatables.net-bs4/css/dataTables.bootstrap4.css';
import 'datatables.net-colreorder-bs4/js/colReorder.bootstrap4';
import 'datatables.net-colreorder-bs4/css/colReorder.bootstrap4.css';
import 'datatables.net-fixedheader-bs4/js/fixedHeader.bootstrap4';
import 'datatables.net-fixedheader-bs4/css/fixedHeader.bootstrap4.css';
import 'datatables.net-responsive-bs4/js/responsive.bootstrap4';
import 'datatables.net-responsive-bs4/css/responsive.bootstrap4.css';
import {CoronaStatInterface} from "../map/interface/corona-stat-interface";

type DataTableItem = {
    country: string,
    amountTotal: number,
    amountTotalNew: number,
    mortality: number,
    doublingTotalRate: number,
    amountHealed: number,
    amountHealedNew: number,
    amountDeath: number,
    amountDeathNew: number,
    casesPerMillion: number,
};

export class DataTableService {
    private _tableId: string;
    private _regressionModelList: {};
    private _selectedDateDataIndex: any;
    private _tableOptions: any;

    set tableId(value: string) {
        this._tableId = value;
    }

    set selectedDateDataIndex(value: any) {
        this._selectedDateDataIndex = value;
    }

    set regressionModelList(value: {}) {
        this._regressionModelList = value;
    }

    initTable() {
        this._tableOptions = {
            pageLength: 25,
            paging: true,
            pagingType: 'simple_numbers',
            ordering: true,
            order: [[1, 'desc'], [0, 'asc']],
            searching: true,
            orderCellsTop: true,
            fixedHeader: true,
            responsive: true,
            colReorder: true,
        };
        this.buildColumns();
        this.buildTable();
    }

    buildTable() {

        let data: Array<DataTableItem> = [];
        let dataItem: DataTableItem = {
            country: '',
            amountTotal: 0,
            amountTotalNew: 0,
            mortality: 0,
            doublingTotalRate: 0,
            amountHealed: 0,
            amountHealedNew: 0,
            amountDeath: 0,
            amountDeathNew: 0,
            casesPerMillion: 0,
        };

        $.each(this._regressionModelList, (countryId, countryData) => {
            let stat: CoronaStatInterface = countryData[this._selectedDateDataIndex];

            let item = $.extend(true, {}, dataItem);

            item.country = stat.country.name;
            item.amountTotal = stat.amountTotal;
            item.amountTotalNew = stat.amountTotal - stat.amountTotalTheDayBefore;
            if (stat.amountTotal > 0) {
                item.mortality = 100 * (stat.amountDeath / stat.amountTotal);
            }
            item.doublingTotalRate = stat.doublingTotalRate;
            item.amountHealed = stat.amountHealed;
            item.amountHealedNew = stat.amountHealed - stat.amountHealedTheDayBefore;
            item.amountDeath = stat.amountDeath;
            item.amountDeathNew = stat.amountDeath - stat.amountDeathTheDayBefore;
            item.casesPerMillion = stat.amountTotalTheDayBefore / ((stat.country.population + 1) / 1000000);
            data.push(item);
        });

        // @ts-ignore
        this._tableOptions['data'] = data;

        let table = $('#' + this._tableId);
        // @ts-ignore
        table.DataTable().destroy();
        table.empty();
        // @ts-ignore
        table.DataTable(this._tableOptions);
    }

    private buildColumns() {
        let columns = [];
        let columnCallbackFixedNumber = (data: number) => {
            return data.toFixed(2);
        };
        let cellCallbackMortality = (td: any, data: number) => {
            let className = 'dark-green';
            if (data > 1.5) {
                className = 'dark-yellow';
            }
            if (data > 5) {
                className = 'dark-orange';
            }
            if (data > 8) {
                className = 'dark-red';
            }
            $(td).addClass(className);
        };
        let cellCallbackDoublingTotal = (td: any, data: number) => {

            let className = 'dark-green';
            if (data < 50) {
                className = 'dark-yellow';
            }
            if (data < 15) {
                className = 'dark-orange';
            }
            if (data < 8) {
                className = 'dark-red';
            }
            if (data < 4) {
                className = 'red';
            }
            $(td).addClass(className);
        };

        columns.push({title: 'Country', data: 'country', className: 'column'});
        columns.push({title: 'Cases', data: 'amountTotal', className: 'column'});
        columns.push({title: 'New cases', data: 'amountTotalNew', className: 'column-new-cases'});
        columns.push({title: 'Mortality', data: 'mortality', className: 'column', render: columnCallbackFixedNumber, createdCell: cellCallbackMortality});
        columns.push({
            title: 'Doubling rate of cases in days',
            data: 'doublingTotalRate',
            className: 'column',
            render: columnCallbackFixedNumber,
            createdCell: cellCallbackDoublingTotal
        });
        columns.push({title: 'Healed', data: 'amountHealed', className: 'column-healed'});
        columns.push({title: 'New healed', data: 'amountHealedNew', className: 'column-new-healed'});
        columns.push({title: 'Death', data: 'amountDeath', className: 'column-death'});
        columns.push({title: 'New deaths', data: 'amountDeathNew', className: 'column-new-death'});
        columns.push({title: 'Cases by 1 mio inhabitants', data: 'casesPerMillion', className: 'column', render: columnCallbackFixedNumber});
        // @ts-ignore
        this._tableOptions['columns'] = columns;
    }
}
