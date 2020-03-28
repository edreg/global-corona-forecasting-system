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
           // columns: this.dataMatrixColumns,
            // rowCallback: rowCallback,
            //dom: '<"datatable-control header row"<"datatable-control-left col-md-6"lip><"datatable-control-right col-md-6"f>>rt<"datatable-control footer"<"datatable-control-left"lip><"datatable-control-right"f>><"clear">',
           // data: this.dataMatrix,
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
            initComplete: function ()
            {
               // $(this).show();
            },
            drawCallback: function ()
            {
            },
        };
        // @ts-ignore
        $('#' + tableId).DataTable(tableOptions);
    }
}
