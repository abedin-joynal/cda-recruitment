// var SERVER = "http://119.18.147.183:3000/";
//var SERVER = "http://192.168.0.17:3000/";
var SERVER = "https://localhost:4000";
var SECONDARY_SERVER = "https://192.168.0.107:4001";
var $AVATAR_PANEL = $("#nav-item-avatar-panel");
var $SIDEBAR_TOGGLE = $("#sidebarToggleTop");
var $SIDEBAR_NAV = $("#sidebar-navigation-panel");
var $LOGGEDINUSERNAME = $("#loggedin-user-name");
var $ELEM_SIGNIN = $("#elem-signin");
var $ELEM_DASH = $("#elem-dash");
var $ELEM_EDIT_APPLICANTS = $("#elem-edit-applicants");
var SPINNER = '<div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div>';
var $ALERT_SIGNIN = $("#alert-signin");
var $NAV_DASH = $("#nav-dash");
var $NAV_EDIT_APPLICANTS = $("#nav-edit-applicants");
var CACHE_NAME = "curOperator";

var CUR_APPLICANT = {};
var POSTS = [];
var POST_APPCANT_COUNT = [];

var PERMISSIONS = {1: "upload-picture", 2: "print-admit-card"};

var USER_PERMISSION_BLOCK = {
                                // 1: [1, 2],
                                3: [1, 2], // Chairman
                                4: [1, 2], // Secretary
                            };

/* Get loggedin stafff info from cache */
var CUR_USR = localStorage.getItem(CACHE_NAME) == null || localStorage.getItem(CACHE_NAME) == "null" ? null : JSON.parse(localStorage.getItem(CACHE_NAME));
var TOKEN = CUR_USR == null ? null : CUR_USR.token;

/*----------------------*/
var camera_button = document.querySelector("#start-camera");
var video = document.querySelector("#video");
var click_button = document.querySelector("#click-photo");
var crop_button = document.querySelector("#btnCrop");
var canvas = document.querySelector("#canvas");
var canvas1 = $("#canvas");
var $result = $('#result');
var dataurl = document.querySelector("#dataurl");
var dataurl_container = document.querySelector("#dataurl-container");
var crop_coords = [];
var cc_count = 0;

$.fn.dataTable.ext.errMode = 'none'; // Supress Datatable errors

async function start_camera() {
    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode: 'environment'}, audio: false });
        video.srcObject = stream;
        video.style.display = 'block';
        // camera_button.style.display = 'none';
        click_button.style.display = 'block';
        $("#start-camera").hide();
    } catch(error) {
        Notify("<i class='fa fa-warning'></i>", "No camera Found! You may use a mobile phone instead", "danger");
        video.style.display = 'none';
        // camera_button.style.display = 'none';
        click_button.style.display = 'none';
        $("#start-camera").show();
        return;
    }
};

click_button.addEventListener('click', function() {
    /*-------- Reset Canvas ---------*/
    $("#canvas_container").empty();
    $("#canvas_container").html(`<canvas id="canvas" class="img-container" width="200" height="200"></canvas>`);
    canvas = document.querySelector("#canvas");
    canvas1 = $("#canvas");
    $result.empty();

    /*--- Reset Canvas ---------*/
    var aspect = video.videoHeight / video.videoWidth;
    var wantedWidth = 300;   // or use height
    var height = Math.round(wantedWidth * aspect);
    canvas.width = wantedWidth;
    canvas.height = height;

    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    let image_data_url = canvas.toDataURL();
    // alert(image_data_url)
    dataurl.value = image_data_url;
    // dataurl_container.style.display = 'block';
    
    // init();
    // return;
    /*--------------------*/            
    crop_coords = [];
    cc_count = 0;
    let curX = 0, curY = 0, prevX = 0, prevY = 0;

    function getCursorPosition(canvas, event) {
        if(cc_count>3) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        let ctx = canvas.getContext("2d");
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ffffff";
        
        curX = x; curY = y;
        if(cc_count == 0) {
            ctx.beginPath();
            ctx.moveTo(curX, curY);
        } else {
            ctx.lineTo(curX, curY); // Draw a line to (150, 100)
            ctx.stroke(); // Render the path
            ctx.moveTo(curX, curY);
            if(cc_count == 3) {
                ctx.lineTo(crop_coords[0].x, crop_coords[0].y); // Draw a line to (150, 100)
                ctx.stroke(); // Render the path
            }
        }
        prevX = curX; prevY = curY;
        ctx.fillRect(curX, curY, 2, 2);
        // console.log("x: " + x + " y: " + y);
        crop_coords.push({"x" : curX, "y" : curY});
        cc_count++;
    }

    canvas.addEventListener('mousedown', function(e) {
        getCursorPosition(canvas, e);
    });
    /*--------------------*/

    $("#camera-preview-container").hide();
    $("#start-camera").show();
    $("#canvas-editor").show();
    $("#btnCrop").show();
    $("#btnUpload").show();
});

crop_button.addEventListener('click', function() {
// $(document).on("#btnCrop", "click", function() {
    var canvasfx = fx.canvas();
    var image = document.getElementById('canvas');
    let texture = canvasfx.texture(image);
    canvasfx.draw(texture).
    // ink(0.25).
    perspective([crop_coords[0].x, crop_coords[0].y, crop_coords[1].x, crop_coords[1].y, 
                crop_coords[3].x, crop_coords[3].y, crop_coords[2].x, crop_coords[2].y], 
                 [0,0, canvas.width,0, 
                  0,canvas.height, canvas.width,canvas.height]).
    update();
   

    image.parentNode.insertBefore(canvasfx, image);
    image.parentNode.removeChild(image);
    
    // let cnvs = document.querySelectorAll("#canvas_container > canvas")
    let cnvs = document.getElementsByTagName("canvas")[0];
    let image_data_url = cnvs.toDataURL();
    dataurl.value = image_data_url;
    
    // $("#cur-applicant-details img").attr("src", image_data_url);

    $("#btnUpload").show();
    $("#btnCrop").hide();
});

$(document).on("click", "#btnUpload", async function() {
    let img_data = dataurl.value;
    $("#wizard-spinner").html(SPINNER);
    let res = await axios.post(SERVER+'/applicants/uploadImg', {
        token : TOKEN,
        user_id : CUR_USR.id,
        img_data : img_data,
        applicant_id: CUR_APPLICANT.id
    });
    if(res.data.status == true) {
        Notify("<i class='fa fa-check'></i>", "Picture Upload Successful", "success");
        $("#cur-applicant-details img").attr("src", img_data);
        $("#canvas-editor").hide();
        $("#wizard-spinner").html(``);
    } else {
        Notify("<i class='fa fa-check'></i>", "Picture Upload Failed! Try Again", "danger");
    }
});
/*---------------------*/

if(CUR_USR == null || CUR_USR == 'null') {
    showLoggedoutUI();
} else {
    showLoggedinUI();
}

$(document).on('click', '#btn-signin', async function (e) {
    let mobile = $("#form-signin .mobile").val();
    let pwd = $("#form-signin .password").val();

    let res = await axios.post(SERVER + '/login', {
        mobile: mobile,
        pwd: pwd
    });

    if(res.data.status == true) {
        localStorage.setItem(CACHE_NAME, JSON.stringify(res.data));
        CUR_USR = res.data;
        console.log(res.data);
        TOKEN = res.data.token;
        showLoggedinUI();
        $ALERT_SIGNIN.addClass("d-none");
    } else {
       $ALERT_SIGNIN.removeClass("d-none");
    }
    $("#form-signin .password").val("");
});

$(document).on('click', '#btn-logout', function (e) {
    localStorage.setItem(CACHE_NAME, null);
    $("#logoutModal").modal('hide');
    showLoggedoutUI();
    Notify("<i class='fa fa-check'></i>", "You have been logged out", "info");
});

$NAV_DASH.click(async function() {
    // $ELEM_TRIPS.addClass('d-none');
    // $ELEM_PAYMENT.addClass('d-none');
    // $ELEM_DASH.find(".row").append(SPINNER);
    $(".nav-item").removeClass("active");
    $(this).closest(".nav-item").addClass("active");
    await getPosts();
    $ELEM_EDIT_APPLICANTS.hide();
    $ELEM_DASH.find(".dash-data").empty();
    $ELEM_DASH.removeClass('d-none');
    _.each(POSTS, function(post) {
        let a_count = POST_APPCANT_COUNT[post.id] === undefined ? 0 : POST_APPCANT_COUNT[post.id][0].applicant_count;
        let h = `<div class="col-xl-3 col-md-6 mb-4">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">${post.name}</div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="lifetime-completed-trips"> ${a_count} </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        $ELEM_DASH.find(".dash-data").append(h);
    });
});

$NAV_EDIT_APPLICANTS.click(async function() {
    $ELEM_DASH.addClass('d-none');
    $ELEM_EDIT_APPLICANTS.removeClass('d-none').show();
    $(".nav-item").removeClass("active");
    $(this).closest(".nav-item").addClass("active");
    await getPosts();
    genPostDD(POSTS);
    
});

function showLoggedinUI() {
    $ELEM_SIGNIN.addClass('d-none');
    $SIDEBAR_TOGGLE.removeClass('d-none');
    $AVATAR_PANEL.removeClass('d-none');
    $SIDEBAR_NAV.removeClass('d-none');
    $ELEM_DASH.removeClass('d-none');
    $LOGGEDINUSERNAME.html(CUR_USR.name);
    $NAV_DASH.click();
}

function showLoggedoutUI() {
    $ELEM_SIGNIN.removeClass('d-none');
    $SIDEBAR_TOGGLE.addClass('d-none');
    $AVATAR_PANEL.addClass('d-none');
    $SIDEBAR_NAV.addClass('d-none');
    $ELEM_DASH.addClass('d-none');
    $ELEM_EDIT_APPLICANTS.addClass('d-none');
    // $ELEM_TRIPS.addClass('d-none');
}

async function getPosts() {
    try {
        let res = await axios.get(SERVER + '/posts/getPosts', {timeout: 100000, params: {
            user_id : CUR_USR.id,
            token: TOKEN
        }}).then(function(res) {
            if(res.data.status) {
                $("#post-list").html(`<option value="">Select Option</option>`);
                POSTS = res.data.data;
                POST_APPCANT_COUNT = _.groupBy(res.data.post_details, 'post_id');
            } else {
                HandleFailedTokenAuthentication(res.data.statusCode);
                // $C_MARKUP.find(".ct-table").append(`<tr><td colspan="10"><div class="alert alert-site">No Data Found</div></td></tr>`);
            }
        });
    } catch (err) {
        Notify("<i class='fa fa-check'></i>", err, "danger");
    }
}

function genPostDD(POSTS) {
    $("#post-list").html(`<option value="">--একটি পদ নির্বাচন করুন--</option>`);
    _.each(POSTS, function(item, counter_name) {
        $("#post-list").append(`<option value="${item.id}">${item.name}</option>`);
    });
}

function updateCurAppDetails(cur_app) {
    $("#picUploadModal").find("#cur-applicant-details .cur_post_name").text('');
    $("#picUploadModal").find("#cur-applicant-details .cur_app_name").text(cur_app.name);
    $("#picUploadModal").find("#cur-applicant-details .cur_app_f_name").text(cur_app.father_name);
    let img = cur_app.img == null || cur_app.img == 'null' ? `/img/no-image.jpg` : "/img/applicants/" + cur_app.img;
    $("#picUploadModal").find("#cur-applicant-details #cur-applicant-img").attr("src", img);
}

$(document).on("change", "#post-list", async function() {
    let post_id = $(this).val();
    if(post_id == "") {
        $("#table-applicant-data").hide();
        return;
    }
    try {
        $("#table-applicant-data").show();

        let res = await axios.get(SERVER + '/applicants/getApplicantsByPostID', {timeout: 10000, params: {
            post_id : post_id,
            user_id : CUR_USR.id,
            token: TOKEN
        }}).then(function(res) {
            let tr = ``;
            if(res.data.status) {
                let applicants = res.data.data;
                if(applicants.length >= 1 ) {
                    let i = 1;
                    _.each(applicants, function(c, counter_name) {
                        tr += `<tr>
                                    <td style="width: 50px;">${i}</td>
                                    <td>${c.name}</td>
                                    <td>${c.father_name}</td>
                                    <td>${c.mother_name}</td>
                                    <td>${c.present_addr}</td>
                                    <td>${c.perm_addr}</td>
                                    <td>${c.eq}</td>
                                    <td>${c.dob}</td>
                                    <td>${c.porder_details}</td>
                                    <td>${c.remarks}</td>
                                    <td> 
                                        <button type='button' class='btn btn-outline-primary btn-upload-picture' data-json='${JSON.stringify(c)}' data-applicant-id="${c.id}">
                                            <i class="fa fa-id-badge" aria-hidden="true"></i>
                                            Details
                                        </button>
                                    </td>
                                </tr>`;
                        i++;
                    });
                } else {
                    tr = `<td colspan=6> No Applicant Found</td>`;
                }
            } else {
                tr = `<td colspan=6> No Applicant Found</td>`;
                // $C_MARKUP.find(".ct-table").append(`<tr><td colspan="10"><div class="alert alert-site">No Data Found</div></td></tr>`);
            }
            let table = `<table class='table table-bordered'>${tr}</table>`;
            $("#table-applicant-data tbody").html(table);

            $('#table-datatable').DataTable( {
                responsive: true
            });
            // CreatePDFfromHTML("#elem-dash", "abcd");
        });
    } catch(err) {
        Notify("<i class='fa fa-check'></i>", "Could Not Connect To Server", "danger");
    }
});

$(document).on("click", ".btn-upload-picture", function() {
    // let applicant_id = $(this).attr("applicant-id");
    let datajson = $(this).attr("data-json");
    CUR_APPLICANT = JSON.parse(datajson);
    updateCurAppDetails(CUR_APPLICANT);
    $("#picUploadModal").modal('show');
    resetPicUploadModal();
    // start_camera();
});

$(document).on("click", "#start-camera", async function() {
    $("#camera-preview-container").show();
    $("#canvas-editor").hide();
    
    start_camera();
});

$(document).on("click", "#btn-prev-applicant", async function() {
    $("#wizard-spinner").html(SPINNER);
    let res = await axios.get(SERVER + '/applicants/getPrevApplicant', {timeout: 10000, params: {
        applicant_id : CUR_APPLICANT.id,
        post_id: CUR_APPLICANT.post_id
    }}).then(function(res) {
        $("#wizard-spinner").html(``);
        if(res.data.data.length >=1) {
            CUR_APPLICANT = res.data.data[0];
            resetPicUploadModal();
            updateCurAppDetails(CUR_APPLICANT);
        } else {
            $(this).attr("disabled", true);
        }
    });
});

$(document).on("click", "#btn-next-applicant", async function() {
    $("#wizard-spinner").html(SPINNER);
    let res = await axios.get(SERVER + '/applicants/getNextApplicant', {timeout: 10000, params: {
        applicant_id : CUR_APPLICANT.id,
        post_id: CUR_APPLICANT.post_id
    }}).then(function(res) {
        $("#wizard-spinner").html(``);
        if(res.data.data.length >=1) {
            CUR_APPLICANT = res.data.data[0];
            resetPicUploadModal();
            updateCurAppDetails(CUR_APPLICANT);
        } else {
            $(this).attr("disabled", true);
        }
    });
});

$(document).on('click', '.nav-item', async function (e) {
    $(".navbar-nav").addClass("toggled");
});

$(document).on("click", "#btn-print-admit-card", async function() {
    printDiv('cur-applicant-details');
    // let element = document.getElementById('cur-applicant-details');
    // html2pdf(element);
});

$(document).ready(async function() {
    let server_status = await UrlExists(SERVER);
    SERVER = server_status == 200 ? SERVER : SECONDARY_SERVER;
    if(CUR_USR !== null && CUR_USR !== 'null') {
        checkBlockedPermissions();
        $NAV_DASH.click();
    }
});

function checkBlockedPermissions() {
    console.log(USER_PERMISSION_BLOCK[CUR_USR.id])
    if(USER_PERMISSION_BLOCK[CUR_USR.id] === undefined)
        return;
    if(USER_PERMISSION_BLOCK[CUR_USR.id].includes(1)) {
        $("#start-camera").remove();
    }
    if(USER_PERMISSION_BLOCK[CUR_USR.id].includes(2)) {
        $("#btn-print-admit-card").remove();
    }
}

function UrlExists(url) {
    return new Promise(async function(resolve, reject) {
        $.ajax({
            url: url,
            dataType: 'text',
            type: 'GET',
            complete: function (xhr) {
                resolve(xhr.status);
            }
        });
    });
}

function HandleFailedTokenAuthentication(statusCode) {
    Notify("<i class='fa fa-check'></i>", "Invalid Authentication Token", "danger");
    if(statusCode == 101) {
        console.log(statusCode)
        setTimeout(function() {
            $("#btn-logout").click();
        }, 2000);
    }
}

function resetPicUploadModal() {
    if(isAndroid()) {
        // $("#start-camera").hide(); 
        $("#start-camera").show();
    }
    $("#canvas-editor").hide();
    $("#camera-preview-container").hide();
}

function CreatePDFfromHTML(elem, file_name) {
    var HTML_Width = $(elem).width();
    var HTML_Height = $(elem).height();
    var top_left_margin = 15;
    var PDF_Width = HTML_Width + (top_left_margin * 2);
    var PDF_Height = (PDF_Width * 1.5) + (top_left_margin * 2);
    var canvas_image_width = HTML_Width;
    var canvas_image_height = HTML_Height;

    var totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

    html2canvas($(elem)[0]).then(function (canvas) {
        var imgData = canvas.toDataURL("image/jpeg", 1.0);
        var pdf = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);
        pdf.addImage(imgData, 'JPG', top_left_margin, top_left_margin, canvas_image_width, canvas_image_height);
        for (var i = 1; i <= totalPDFPages; i++) { 
            pdf.addPage(PDF_Width, PDF_Height);
            pdf.addImage(imgData, 'JPG', top_left_margin, -(PDF_Height*i)+(top_left_margin*4),canvas_image_width,canvas_image_height);
        }
        pdf.save(`${file_name}.pdf`);
        // $(elem).hide();
    });
}
