export class LoadingLayerHelper
{
    static show()
    {
        $('#loading-indicator').removeClass('hide');
    }

    static hide()
    {
        $('#loading-indicator').addClass('hide');
    }
}
