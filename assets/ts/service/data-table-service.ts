import * as $ from 'jquery';
import 'datatables.net-bs4/js/dataTables.bootstrap4';
import 'datatables.net-bs4/css/dataTables.bootstrap4.css';
import 'datatables.net-colreorder-bs4/js/colReorder.bootstrap4';
import 'datatables.net-colreorder-bs4/css/colReorder.bootstrap4.css';
import 'datatables.net-fixedheader-bs4/js/fixedHeader.bootstrap4';
import 'datatables.net-fixedheader-bs4/css/fixedHeader.bootstrap4.css';
import 'datatables.net-responsive-bs4/js/responsive.bootstrap4';
import 'datatables.net-responsive-bs4/css/responsive.bootstrap4.css';

export class DataTableService
{
    initTable(tableId: string)
    {
        let tableOptions = {
           // columns: this.Columns,
            // rowCallback: rowCallback,
           // data: this.data,
            pageLength: 25,
            paging: true,
            pagingType: 'simple_numbers',
            ordering: true,
            order: [[1, 'desc'], [0, 'asc']],
            searching: true,
            //language: response.language,
            orderCellsTop: true,
            fixedHeader: true,
            responsive: true,
            colReorder: true,
            initComplete: () => { /*$(this).show();*/ },
            drawCallback: () => { },
        };
        // @ts-ignore
        $('#' + tableId).DataTable(tableOptions);
    }
}
