// var SERVER = "http://119.18.147.183:3000/";
//var SERVER = "http://192.168.0.17:3000/";

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
var $TABLE = null;

var CUR_APPLICANT = {};
var POSTS = [];
var POST_APPCANT_COUNT = [];

var PERMISSIONS = {1: "upload-picture", 2: "print-admit-card"};

var USER_PERMISSION_BLOCK = {
                                // 1: [1, 2],
                                // 3: [1, 2], // Chairman
                                // 4: [1, 2], // Secretary
                            };

/* Get loggedin stafff info from cache */
var CUR_USR = localStorage.getItem(CACHE_NAME) == null || localStorage.getItem(CACHE_NAME) == "null" ? null : JSON.parse(localStorage.getItem(CACHE_NAME));
var TOKEN = CUR_USR == null ? null : CUR_USR.token;

/*----------------------*/
var photo_file_picker = document.getElementById("input-pic-upload");
var camera_button = document.querySelector("#start-camera");
var video = document.querySelector("#video");
var click_button = document.querySelector("#click-photo");
var crop_button = document.querySelector("#btnCrop");
var canvas = document.querySelector("#canvas");
var canvas1 = $("#canvas");
var $result = $('#result');
var dataurl = document.querySelector("#dataurl");
var dataurl_container = document.querySelector("#dataurl-container");
var curX = 0, curY = 0, prevX = 0, prevY = 0;
var crop_coords = [];
var cc_count = 0;

let AvroPost = [3,4,5,6,8,9,10,11,12,13,14,15,16,17,18,19,21, 22];

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
        // Enhanced error logging for camera access
        console.error('=== Camera Access Error ===');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Full Error Object:', error);
        if (error.stack) {
            console.error('Error Stack:', error.stack);
        }
        // Log specific error types
        if (error.name === 'NotAllowedError') {
            console.error('Camera permission denied by user');
        } else if (error.name === 'NotFoundError') {
            console.error('No camera device found');
        } else if (error.name === 'NotReadableError') {
            console.error('Camera is already in use by another application');
        } else if (error.name === 'OverconstrainedError') {
            console.error('Camera constraints cannot be satisfied');
        } else if (error.name === 'SecurityError') {
            console.error('Camera access blocked due to security restrictions (HTTPS required)');
        } else if (error.name === 'TypeError') {
            console.error('getUserMedia is not supported in this browser');
        }
        console.error('=== End Camera Error ===');
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
    dataurl.value = image_data_url;
    /*--------------------*/            
    crop_coords = [];
    cc_count = 0;
    curX = 0, curY = 0, prevX = 0, prevY = 0;

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

photo_file_picker.addEventListener("change", function() {
    var reader = new FileReader();

    reader.addEventListener("loadend", function(arg) {
        var src_image = new Image();
        src_image.onload = function() {
            // canvas.height = src_image.height;
            // canvas.width = src_image.width;
            // canvas.getContext('2d').drawImage(src_image, 0, 0);
            $("#canvas-editor").show();
            $("#canvas_container").empty();
            $("#canvas_container").html(`<canvas id="canvas" class="img-container" width="200" height="200"></canvas>`);
            let canvas = document.querySelector("#canvas");

            var aspect = src_image.height / src_image.width;
            var wantedWidth = 300;   // or use height
            var height = Math.round(wantedWidth * aspect);
            canvas.width = wantedWidth;
            canvas.height = height;

            canvas.getContext('2d').drawImage(src_image, 0, 0, canvas.width, canvas.height);

              /*--------------------*/            
              let image_data_url = canvas.toDataURL();
              dataurl.value = image_data_url;
              /*--------------------*/            
              crop_coords = [];
              cc_count = 0;
              curX = 0, curY = 0, prevX = 0, prevY = 0;
          
              canvas.addEventListener('mousedown', function(e) {
                  getCursorPosition(canvas, e);
              });
              /*--------------------*/
          
              $("#camera-preview-container").hide();
              $("#start-camera").show();
              $("#canvas-editor").show();
              $("#btnCrop").show();
              $("#btnUpload").show();
        }

        src_image.src = this.result;
    });

    reader.readAsDataURL(this.files[0]);
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
        Notify("<i class='fa fa-check'></i>", "Picture Upload Successful", "info");
        $("#cur-applicant-details #cur-applicant-img").attr("src", img_data);
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
        let empty_count = POST_APPCANT_COUNT[post.id] === undefined ? 0 : POST_APPCANT_COUNT[post.id][0].emptyImgCount;
        let h = `<div class="col-xl-3 col-md-6 col-sm-6 col-12 mb-4">
                    <div class="card border-left-primary shadow h-100 py-2">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        <a class="dash_a" data-post-id=${post.id} href="javascript:void(0)">${post.name}</a>
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800" id="lifetime-completed-trips"> ${a_count} </div>
                                    <small class="text-danger">${empty_count} Pending Image Upload</small> 
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-user fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        $ELEM_DASH.find(".dash-data").append(h);
    });
    setTimeout(function() {
        
    }, 2000);
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
    // console.log(cur_app)
    let name, father_name, mother_name, dis, quota, remarks, dob, eq, exp, perm_addr, temp_addr, porder_details = "";
    if(AvroPost.indexOf(cur_app.post_id) !== -1) {  
        name = cur_app.name;
        father_name = cur_app.father_name;
        mother_name = cur_app.mother_name;
        dis = cur_app.dis;
        quota = cur_app.quota;
        remarks = cur_app.remarks;
        
        dob = cur_app.dob;
        exp = cur_app.exp;
        eq = cur_app.eq;
        perm_addr = cur_app.perm_addr;
        temp_addr = cur_app.present_addr;
        porder_details = cur_app.porder_details;

    } else {

        // name = ConvertToUnicode('bijoy', cur_app.name);
        // father_name = ConvertToUnicode('bijoy', cur_app.father_name);
        // mother_name = ConvertToUnicode('bijoy', cur_app.mother_name);
        // dis = ConvertToUnicode('bijoy', cur_app.dis);
        // quota = ConvertToUnicode('bijoy', cur_app.quota);
        // remarks = ConvertToUnicode('bijoy', cur_app.remarks);

        // dob = ConvertToUnicode('bijoy', cur_app.dob);
        // exp = ConvertToUnicode('bijoy', cur_app.exp);
        // eq = ConvertToUnicode('bijoy', cur_app.eq);
        // perm_addr = ConvertToUnicode('bijoy', cur_app.perm_addr);
        // temp_addr = ConvertToUnicode('bijoy', cur_app.present_addr);
        // porder_details = ConvertToUnicode('bijoy', cur_app.porder_details);

        name = cur_app.name;
        father_name = cur_app.father_name;
        mother_name = cur_app.mother_name;
        dis = cur_app.dis;
        quota = cur_app.quota;
        remarks = cur_app.remarks;

        dob = cur_app.dob;
        exp = cur_app.exp;
        eq =  cur_app.eq;
        perm_addr = cur_app.perm_addr;
        temp_addr = cur_app.present_addr;
        porder_details = cur_app.porder_details;
        

        // dob = cur_app.dob;
        // exp = cur_app.exp;
        // perm_addr = cur_app.perm_addr;
        // temp_addr = cur_app.present_addr;
        // porder_details = cur_app.porder_details;
    }

    $("#picUploadModal").find("#cur-applicant-details .cur_post_name").text('');
    $("#picUploadModal").find("#cur-applicant-details .cur_app_name").text(name);
    $("#picUploadModal").find("#cur-applicant-details .cur_app_f_name").text(father_name);
    let img = cur_app.img == null || cur_app.img == 'null' ? `/img/no-image.jpg` : "/img/applicants/" + cur_app.img;
    $("#picUploadModal").find("#cur-applicant-details #cur-applicant-img").attr("src", img);

    $("#EditApplicantContainer .input-name").val(name);
    // $("#EditApplicantContainer .input-name").val(cur_app.name);
    $("#EditApplicantContainer .input-fname").val(father_name);
    $("#EditApplicantContainer .input-mname").val(mother_name);
    $("#EditApplicantContainer .input-dis").val(dis);
    $("#EditApplicantContainer .input-quota").val(quota);
    $("#EditApplicantContainer .input-remarks").val(remarks);

    $("#EditApplicantContainer .input-exp").val(exp);
    $("#EditApplicantContainer .input-eq").val(eq);
    $("#EditApplicantContainer .input-dob").val(dob);
    $("#EditApplicantContainer .input-perm-addr").val(perm_addr);
    $("#EditApplicantContainer .input-temp-addr").val(temp_addr);
    $("#EditApplicantContainer .input-porder_details").val(porder_details);
    
    if(AvroPost.indexOf(cur_app.post_id) !== -1) {
        $("#EditApplicantContainer #btn-save-app-info").removeAttr("disabled");
        $("#EditApplicantContainer #btn-save-app-info").closest(".form-group").find(".text-danger").remove();
    } else {
        $("#EditApplicantContainer #btn-save-app-info").attr("disabled", true);
        $("#EditApplicantContainer #btn-save-app-info").closest(".form-group").find(".text-danger").remove();
        $("#EditApplicantContainer #btn-save-app-info").closest(".form-group").append(
            `<div class="text-danger col-md-12 d-flex justify-content-center">ANSI Data!! Do not overwrite</div>`
        );
    }
}

function updateAdmitCardDetails(cur_app) {
    let name, father_name, mother_name, dis, quota, remarks = "";
    if(AvroPost.indexOf(cur_app.post_id) !== -1) {  
        name = cur_app.name;
        father_name = cur_app.father_name;
        mother_name = cur_app.mother_name;
        dis = cur_app.dis;
        quota = cur_app.quota;
        remarks = cur_app.remarks;
    } else {
        name = ConvertToUnicode('bijoy', cur_app.name);
        father_name = ConvertToUnicode('bijoy', cur_app.father_name);
        mother_name = ConvertToUnicode('bijoy', cur_app.mother_name);
        dis = ConvertToUnicode('bijoy', cur_app.dis);
        quota = ConvertToUnicode('bijoy', cur_app.quota);
        remarks = ConvertToUnicode('bijoy', cur_app.remarks);
    }

    // console.log(cur_app.name, cur_app.father_name);

    $("#AdmitCardModal").find(".appli_post").text(cur_app.post_name);
    $("#AdmitCardModal").find(".appli_rollno").text(cur_app.roll_no);
    $("#AdmitCardModal").find(".appli_name").text(name);
    $("#AdmitCardModal").find(".appli_fa_name").text(father_name );
    $("#AdmitCardModal").find(".appli_dist").text(dis);
    $("#AdmitCardModal").find(".exam_dt_tm").text(cur_app.exam_center);
    $("#AdmitCardModal").find(".exam_cntr").text(cur_app.exam_date);
    let img = cur_app.img == null || cur_app.img == 'null' ? `/img/no-image.jpg` : "/img/applicants/" + cur_app.img;
    $("#AdmitCardModal").find(".applicant-img").attr("src", img);
    $("#admit-popup-app-name").text(name);
}

$(document).on("click", ".dash_a", async function() {
    $ELEM_DASH.addClass('d-none');
    $ELEM_EDIT_APPLICANTS.removeClass('d-none').show();
    $(".nav-item").removeClass("active");
    $ELEM_EDIT_APPLICANTS.closest(".nav-item").addClass("active");
    await getPosts();
    genPostDD(POSTS);
    let post_id = $(this).attr("data-post-id");
    // $(`#post-list[value=valueToSelect]`, newOption).attr('selected', 'selected');
    // $("#post-list").val($(this).attr("data-post-id")).attr("selected","selected");;
    $('#post-list').find(`option[value="${post_id}"]`).attr("selected","selected");
    $("#post-list").change(); 
});

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
                let district_count = res.data.district_count;

                if(district_count.length >=1) {
                    let dh = ``;
                    _.each(district_count, function(dc) {
                        dh += `${dc.dis}  : ${dc.count}, &nbsp`;
                    });
                    $("#districtwise-count").html(dh);
                }

                if(applicants.length >= 1 ) {
                    let i = 1;
                    _.each(applicants, function(c, counter_name) {
                        let img = c.img !== null ? `/img/applicants/${c.img}` : `/img/no-image.jpg`;
                        let roll_no = c.roll_no == null ? "" : c.roll_no;

                        let remarks = c.remarks !== null ? c.remarks : "";
                        let exp = c.exp == null ? "" : c.exp ;
                        let quota = c.quota == null ? "" :c.quota ;
                        let dis = c.dis == null ? "" : c.dis;
                        let eq = c.eq == null ? "" : c.eq;

                        let name, father_name, mother_name = "";
                        
                        if(AvroPost.indexOf(c.post_id) !== -1) {  
                            name = c.name;
                            father_name = c.father_name;
                            mother_name = c.mother_name;
                            dis = dis;
                            quota = quota;
                            remarks = remarks;
                            exp = exp;

                            eq = c.eq;
                            dob = c.dob;
                            exp = c.exp;
                            perm_addr = c.perm_addr;
                            temp_addr = c.present_addr;
                            porder_details = c.porder_details;

                        } else {
                            name = ConvertToUnicode('bijoy', c.name);
                            father_name = ConvertToUnicode('bijoy', c.father_name);
                            mother_name = ConvertToUnicode('bijoy', c.mother_name);
                            dis = ConvertToUnicode('bijoy', dis);
                            quota = ConvertToUnicode('bijoy', quota);
                            remarks = ConvertToUnicode('bijoy', remarks);
                            exp = ConvertToUnicode('bijoy', exp);

                            eq = ConvertToUnicode('bijoy', c.eq);
                            dob = ConvertToUnicode('bijoy', c.dob);
                            exp = ConvertToUnicode('bijoy', c.exp);
                            perm_addr = ConvertToUnicode('bijoy', c.perm_addr);
                            temp_addr = ConvertToUnicode('bijoy', c.present_addr);
                            porder_details = ConvertToUnicode('bijoy', c.porder_details);
                            
                        }

                        tr += `<tr>
                                    <td> 
                                        <button type='button' class='btn btn-outline-primary btn-upload-picture' data-json='${JSON.stringify(c)}' data-applicant-id="${c.id}">
                                            <i class="fa fa-id-badge" aria-hidden="true"></i>
                                            Details
                                        </button>
                                        <button type='button' class='btn btn-outline-primary btn-admit-modal mt-1' data-json='${JSON.stringify(c)}' data-applicant-id="${c.id}">
                                            <i class="fa fa-id-badge" aria-hidden="true"></i>
                                            Admit Card
                                        </button> 
                                    </td>
                                    <td style="width: 50px;">${i}</td>
                                    <td style="width: 50px;"><img src="${img}" loading="lazy" width="50px" height="50px"/ ></td>
                                    <!-- <td>${name}</td> -->
                                    <td>${name}</td>
                                    <td>${roll_no}</td> 
                                    <td>${father_name} </td>
                                    <td>${mother_name}</td>
                                    <td>${perm_addr}</td>
                                    <td>${temp_addr}</td>
                                    <td>${eq}</td>
                                    <td>${dob}</td>
                                    <td>${porder_details}</td>
                                    <td>${exp}</td>
                                    <td>${quota}</td>
                                    <td>${dis}</td>
                                    <td>${remarks}</td>
                                </tr>`;
                        i++;
                    });
                    $("#page-print-button").show().attr("href", `/applicants/print/getApplicantsByPostID?format=print&post_id=${post_id}`);
                    $("#page-excel-button").show().attr("href", `/applicants/print/getApplicantsByPostID?format=excel&post_id=${post_id}`);
                } else {
                    $("#page-print-button").hide();
                    tr = `<td colspan=6> No Applicant Found</td>`;
                }
            } else {
                tr = `<td colspan=6> No Applicant Found</td>`;
            }
            let table = `${tr}`;
            
            if ( ! $.fn.DataTable.isDataTable( '#table-datatable' ) ) {
                $("#table-datatable").dataTable().fnDestroy();
            } else {
                $("#table-datatable").dataTable().fnDestroy();
            }

            $("#table-datatable tbody").html(table);
            $TABLE = $('#table-datatable').DataTable({
                responsive: true
            });


            // $("#table-datatable tbody").html(table);

            // if ($.fn.dataTable.isDataTable('#table-datatable')) {
            //     // $('#table-datatable').DataTable().clear().destroy();               
            // }
    
            // $('#table-datatable').DataTable({
            //     paging:false,
            //     searching:false
            // });
        });

       

    } catch(err) {
        console.log(err)
        // Notify("<i class='fa fa-check'></i>", "Someting went wrong", "danger");
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

$(document).on("click", ".btn-admit-modal", function() {
    // let applicant_id = $(this).attr("applicant-id");
    let datajson = $(this).attr("data-json");
    CUR_APPLICANT = JSON.parse(datajson);
    updateAdmitCardDetails(CUR_APPLICANT);
    $("#AdmitCardModal").modal('show');
    // resetPicUploadModal();
    // start_camera();
});

$(document).on("click", "#btn-admit-edit", function() {
    // let applicant_id = $(this).attr("applicant-id");
    updateCurAppDetails(CUR_APPLICANT);
    $("#picUploadModal").modal('show');
    $("#AdmitCardModal").modal('hide');
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
            updateAdmitCardDetails(CUR_APPLICANT);
        } else {
            $(this).attr("disabled", true);
        }
    });
});

$(document).on("click", "#btn-next-applicant", async function() {
    // console.log(CUR_APPLICANT);
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
            updateAdmitCardDetails(CUR_APPLICANT);
        } else {
            $(this).attr("disabled", true);
        }
    });
});

$(document).on("click", "#btn-save-app-info", async function() {
    let dis = $("#EditApplicantContainer").find(".input-dis").val();
    let quota = $("#EditApplicantContainer").find(".input-quota").val();
    let remarks = $("#EditApplicantContainer").find(".input-remarks").val();
    let name = $("#EditApplicantContainer").find(".input-name").val();
    let fname = $("#EditApplicantContainer").find(".input-fname").val();
    let mname = $("#EditApplicantContainer").find(".input-mname").val();
    let dob = $("#EditApplicantContainer").find(".input-dob").val();
    let exp = $("#EditApplicantContainer").find(".input-exp").val();
    let eq = $("#EditApplicantContainer").find(".input-eq").val();
    let perm_addr = $("#EditApplicantContainer").find(".input-perm-addr").val();
    let temp_addr = $("#EditApplicantContainer").find(".input-temp-addr").val();
    let porder_details = $("#EditApplicantContainer").find(".input-porder_details").val();


    let res = await axios.post(SERVER + '/applicants/saveApplicantInfo', {
        token : TOKEN,
        user_id : CUR_USR.id,
        app_id : CUR_APPLICANT.id,
        name: name,
        fname: fname,
        mname: mname,
        dis : dis,
        quota : quota,
        remarks: remarks,
        dob: dob,
        exp: exp,
        eq: eq,
        perm_addr: perm_addr,
        temp_addr: temp_addr,
        porder_details: porder_details
    });

    if(res.data.status == true) {
        let showAdmitModal = $("#picUploadModal").attr("data-show-admit-modal");
        if(showAdmitModal == 1) {
            $("#AdmitCardModal").modal('show');
            updateAdmitCardDetails(CUR_APPLICANT);
        }
        Notify("<i class='fa fa-check'></i>", "Data Saved Successfully", "info");
    } else {
        Notify("<i class='fa fa-check'></i>", "Picture Upload Failed! Try Again", "danger");
    }
});

$(document).on('click', '.nav-item', async function (e) {
    $(".navbar-nav").addClass("toggled");
});

$(document).on("click", "#btn-print-admit-card", async function() {
    printDiv('Admit-card-container');
    // printDiv('table-datatable');

    // printJS({
    //     printable: 'table-datatable',
    //     type: 'html',
    //     targetStyles: ['*'],
    //     style: '@page { size: Letter landscape; }'
    // });

    // let element = document.getElementById('cur-applicant-details');
    // html2pdf(element);
});

$(document).ready(async function() {
    // Stick to current origin to avoid failing over to external IPs on mobile
    SERVER = window.location.origin;
    SECONDARY_SERVER = window.location.origin;
    if(CUR_USR !== null && CUR_USR !== 'null') {
        checkBlockedPermissions();
        $NAV_DASH.click();
    }
    // For Bijoy To Unicode
    // ChangeConvertOptionStatus();
});

function checkBlockedPermissions() {
    // console.log(USER_PERMISSION_BLOCK[CUR_USR.id])
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
        // if(isWebview()) {
        //     $("#start-camera").hide();
        // }
        $("#input-pic-upload").closest("label").show();

    }

    $("#input-pic-upload").closest("label").show();

    // if(isWebView()) {
    //     $("#input-pic-upload").closest("label").show();
    // }

    photo_file_picker.value = "";
    $("#canvas-editor").hide();
    $("#camera-preview-container").hide();
}

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

/*
var canvasOffset = $("#canvas").offset();
var offsetX = canvasOffset.left;
var offsetY = canvasOffset.top;
var mouseIsDown = false;
var lastX = 0;
var lastY = 0;

$("#canvas").mousedown(function (e) {
    handleMouseDown(e);
});
$("#canvas").mousemove(function (e) {
    handleMouseMove(e);
});
$("#canvas").mouseup(function (e) {
    handleMouseUp(e);
});

function handleMouseDown(e) {
    mouseX = parseInt(e.clientX - offsetX);
    mouseY = parseInt(e.clientY - offsetY);

    // mousedown stuff here
    lastX = mouseX;
    lastY = mouseY;
    mouseIsDown = true;
}

function handleMouseUp(e) {
    mouseX = parseInt(e.clientX - offsetX);
    mouseY = parseInt(e.clientY - offsetY);

    // mouseup stuff here
    mouseIsDown = false;
}

function handleMouseMove(e) {
    if (!mouseIsDown) {
        return;
    }

    mouseX = parseInt(e.clientX - offsetX);
    mouseY = parseInt(e.clientY - offsetY);

    // mousemove stuff here
    for (var i = 0; i < ships.length; i++) {
        var ship = ships[i];
        drawShip(ship);
        if (ctx.isPointInPath(lastX, lastY)) {
            ship.x += (mouseX - lastX);
            ship.y += (mouseY - lastY);
            ship.right = ship.x + ship.width;
            ship.bottom = ship.y + ship.height;
        }
    }
    lastX = mouseX;
    lastY = mouseY;
    drawAllShips();
}
*/