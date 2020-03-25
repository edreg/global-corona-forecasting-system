
/**
 * Ajax service calls ajax requests
 */
export class AjaxService
{
    /**
     * Do an ajax request
     * @param url
     * @param data
     * @param method
     * @param responseDataType
     * @return {JQueryXHR}
     */
    public static ajaxRequest(url: string, data: any, method: string = 'post', responseDataType: string = 'json')
    {
        return $.ajax({
            async: true,
            type: method,
            data: data,
            dataType: responseDataType,
            url: url
        });
    }

    /**
     * Submit a form via ajax
     * @param form
     * @param responseDataType
     * @returns {JQueryXHR}
     */
    public static submitAjaxForm(form: JQuery, responseDataType: string = 'json')
    {
        let url = form.attr('action'),
            method = form.attr('method'),
            data = form.serialize();

        return $.ajax({
            async: true,
            type: method,
            data: data,
            dataType: responseDataType,
            url: url,
        });
    }
}
