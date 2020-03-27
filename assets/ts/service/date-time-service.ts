export class DateTimeService
{
    formatDate(date: Date)
    {
        let year = date.getFullYear();
        let month: string|number = date.getMonth() + 1;
        let day: string|number = date.getDate();

        if (month < 10)
        {
            month = '0' + month.toString();
        }

        if (day < 10)
        {
            day = '0' + day.toString();
        }

        return year + '-' + month + '-' + day;
    }
}
