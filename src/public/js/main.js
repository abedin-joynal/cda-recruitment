// Prefer the current origin so the app works on LAN/phone without hardcoded IPs
var SERVER = window.location.origin;
var SECONDARY_SERVER = window.location.origin;

var CONFIRMATION_INS = null;

$(document).ready(async function() {
    $(".hideTillLoaded").fadeIn();
    /* Define User Agent */
    let ua = navigator.userAgent.toLowerCase();
    ISANDROID = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
    console.log("Is Android: ", ISANDROID);

    /* Connection Indicator */
    window.addEventListener('online',  connectionIndicator);
    window.addEventListener('offline', connectionIndicator);

    window.addEventListener("beforeunload", function (e) {
        // return undefined;
    });

    $('[data-toggle="tooltip"]').tooltip({
        boundary: 'window' 
    });

});

$(function () {
    $(document).on("keyup", "#input-search", function(e) {
        if(e.keyCode == 13) {
            $("#form_filter").submit();
        }
    });

   
    $('.dropdown-menu a').click(function() {
        $('#selected').text($(this).text());
    });

    $(document).on("click", ".popup-close", function() {
        $(this).closest("#POPUP").hide();
    });
    
    $(document).on("click", "#popup-no", function() {
        $(this).closest("#POPUP").hide();
    });

    $(document).on("click", "#popup-yes", function() {
        CONFIRMATION_INS.click();
    });
});

function Notify(icon, msg, type = "info") {

    // mobiscroll.snackbar({message: msg, display: 'top', color: type});
    // return;
    
    $('.notifyjs-corner').empty();
    $.notify.defaults( { position:"top right",  autoHideDelay: 5000,   arrowShow: true,   style: 'bootstrap'} )
    $.notify.addStyle('toast', {
        html: `<div>${icon} <span data-notify-html/></div>`,
        classes: {
            info: {
                "color": "white",
                "font-weight" : "bold",
                "background-color": "#00c1eb",
                "padding": "15px"
            },
            warning: {
                "color": "white",
                "font-weight" : "bold",
                "background-color": "orange",
                "padding": "15px"
            },
            danger: {
                "color": "white",
                "font-weight" : "bold",
                "background-color": "red",
                "padding": "15px"
            }
        }
    });

    $.notify(msg, {
        style: 'toast',
        className: type
    });
}

function isAndroid() {
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
    return isAndroid;
}

function isWebView() {
    var standalone = window.navigator.standalone,
    userAgent = window.navigator.userAgent.toLowerCase(),
    safari = "/safari/.test(userAgent)",
    ios = "/iphone|ipod|ipad/.test(userAgent)";
    let webview= false;
    if (ios) {
        if (!standalone && safari) {
            // Safari
        } else if (!standalone && !safari) {
            // iOS webview
            webview = true;
        };
    } else {
        if (userAgent.includes('wv')) {
            // Android webview
            webview = true;
        } else {
            // Chrome
        }
    };
    alert(webview)
    return webview;
}

// function isWebview() {
//     if (typeof window === undefined) { return false };

//     let navigator = window.navigator;

//     const standalone = navigator.standalone;
//     const userAgent = navigator.userAgent.toLowerCase();
//     const safari = /safari/.test(userAgent);
//     const ios = /iphone|ipod|ipad/macintosh.test(userAgent);
//     const ios_ipad_webview = ios && !safari;

//     return ios ? ( (!standalone && !safari) || ios_ipad_webview ) : userAgent.includes('wv');
// }

function printDiv(divID) {
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
    // console.log(isAndroid);
    if (isAndroid && false) {
      // https://developers.google.com/cloud-print/docs/gadget
      var gadget = new cloudprint.Gadget();
      gadget.setPrintDocument("url", $('title').html(), window.location.href, "utf-8");
      gadget.openPrintDialog();
    } else {
        printJS({
            printable: divID,
            type: 'html',
            targetStyles: ['*']
        });
    }
}

function getCurrentDate() {
    return moment().format('DD-MM-YYYY');
}

function humanReadableDate(date) {
    return moment(date, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YYYY');
}

function twelveHourFormat (time) {
    return moment(time, ["HH:mm:ss"]).format("h:mm A");
}

function connectionIndicator() {
    if(navigator.onLine) { // true|false
        Notify("<i class='fa fa-check'></i>", "Connection established..", "info");
        // RENEW_SESSION = true;
        setMobiscrollDate($('.date-only'), new Date());
    } else {
        Notify("<i class='fa fa-exclamation'></i>", "Disconnected from server", "danger");
        // RENEW_SESSION = false;
    }
}

function isblockedUINavigation() { /* used in both admin & customer panel */
    if(BLOCKALLNAVIGATION.status == true) {
        Notify("<i class='fa fa-exclamation'></i>", BLOCKALLNAVIGATION.msg, "danger");
        return true;
    }
    return false;
}