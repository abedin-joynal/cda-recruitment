// const { isLoggedIn } = require("../../../lib/auth");

let FROM_ADDR_ARR = TO_ADDR_ARR = [];
let ACTIVE_FROM_ADDR = null;
let ACTIVE_TO_ADDR = null;
let ROUTEFOUND = false;
let ROUTE = null;
let DISTANCE = null;
let ETA = null;
let SOURCE_MARKER = DEST_MARKER = null;
let ACTIVE_REQUEST_UNIQUE_ID = null;
let $POPUP = $("#GENERAL_POPUP");
const RS_OT_STATUS = {"0": {0:"Pending"}, "1": {1: "Request Accepted"}, "2":{2: "Ride Started"}, "3": {3: "Ride Ended"},
                      "4": {4: "Driver Rating Provided"}, "5": {5:"Passenger Rating Provided"}, 
                      "6": {6: "Cancelled By Passenger"}, "7": {7: "Cancelled By Driver"}};
const RS_OT_CHARGES = {
                        "BD":  
                        {"CURRENCY": "TK",
                        "MODE": {"BIKE": {"MIN_DIS": 1, "FIRSTKM": 30, "MIN_FARE": 50, "PERKM": 10, "CHARGEREETIME": 10, "PERMIN": 2}, 
                        "CAR": {"MIN_DIS": 2, "FIRSTKM": 50, "MIN_FARE": 100, "PERKM": 25, "CHARGEREETIME": 10, "PERMIN": 7}}
                    }}; // Times are in minutes, Distance are in KM, 
let OTMAKEREQMAP = null;

/* Daily Request */
async function collectRSUserInfo() {
    if(isLoggedIn()) {
        if(CUR_USER_INFO.rs_customer_type == null) {
            let $mrg = $("#markup-rs-dr_get-user-n-vehicle-type").clone();
            $mrg.removeClass("d-none").removeAttr("id");
            // console.log($mrg);
            $("#rs-container #elem-rs, #rs-container #elem-rs-ot").html($mrg);
            populateDistricts();
            $mrg.find(".mrgvt-personal").hide();
            $mrg.attr("data-personal", false);
            if(CUR_USER_INFO.rs_customer_type == null) {
                $mrg.find(".mrgvt-rs").show();
                $mrg.attr("data-rs", true);
            }
            return true;
        } else {
            return false;
        }
    } else {
        showLoginPopup();
    }
}

async function RSDRDailyEntry() {
    RSDRexploreRequestFilters();
}

async function RSDRmakeRequestUI() {
    if(isLoggedIn()) {
        $(".rs-dr-tab").removeClass("active");
        $("#rs-dr-tab-make-request").addClass("active");

        let collect = await collectRSUserInfo();
        // console.log(collect)
        if(collect == true) { 
            return false; 
        }

        let $mrg = $("#markup-rs-dr-make-request-ui").clone();
        $mrg.removeClass("d-none");
        $("#rs-container #elem-rs").html($mrg);

        $('.time-12h').mobiscroll().datepicker({
            controls: ['time'],
            timeFormat: 'hh:mm A'
        });

        $('#single-select').mobiscroll().select({
            inputElement: document.getElementById('my-input'),
            touchUi: false
        });
        
    } else {
        showLoginPopup();
    }
}

async function RSDRgetMyRequests() {
    if(isLoggedIn()) {
        $(".rs-dr-tab").removeClass("active");
        $("#rs-dr-tab-your-requests").addClass("active");
        let collect = await collectRSUserInfo();
        if(collect == true) { 
            return false; 
        }

        let res = await axios.get(HOSTURL + '/rs-daily/get-my-requests', {timeout: 10000, params: {
            c_id: CUR_USER_INFO.unique_customer_id
        }}).then(function(res) {
            $("#rs-container #elem-rs").empty();
            let r = `   <div class="card p-1 p-md-5">
                            <div class="col-md-12 ">
                                <h5 class="mt-3"><i class="fa fa-rocket text-site"></i> Requests Placed By You</h5>
                                <h6>Request for daily Commute to your office or home on a fixed time</h6>
                                <hr />
                            </div>
    
                            <div class="col-md-12" id="elem-rs-data">
                            
                            </div>
                        </div>`;

            $("#rs-container #elem-rs").html(r);

            if(res.data.status) {
                let requests = res.data.data.list;
               
                if(requests.length >=1) {
                    
                    _.each(requests, function(req, i) {
                        let req_status = req.request_status == 0 ? "Pending": req.request_status == 1 ? "Accepted" : "Cancelled";
                        let date_created_ago = moment(req.date_created, "YYYY-MM-DD HH:mm:ss").fromNow();
                        let date_created = moment(req.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YYYY hh:mm A');
                        let accepted_details_btn = req.request_status == 1 ? `<button type="button" class="btn btn-info btn-responder-details">Responder Details</button>`: ``;
                        let o_name = req.o_name !== null ? req.o_name : "Unknown";
                        let o_mobile = req.o_mobile !== null ? req.o_mobile : "Unknown";
                        let o_email = req.o_name !== null ? req.o_email : "Unknown";
                        let o_age = req.o_name !== null ? req.o_age : "Unknown";
                        let o_gender = req.o_name !== null ? req.o_gender : "Unknown";
                        let o_profile_pic = req.o_profile_pic !== null ? `/img/customers/${req.o_profile_pic}` : "/img/profile_pic.jpg";

                        r = `<div class="card rs-req my-1" data-attr-req-id="${req.request_unique_id}">
                                <div class="card-body">
                                    <h5 class="card-title">#${req.request_unique_id}</h5>
                                    <div class="row">
                                        <div class="col-md-10">
                                            <p class="card-text"><b>From:</b> <span class=""> ${req.src_addr}</span></p>
                                            <p class="card-text"><b>To:</b> <span class=""> ${req.dest_addr}</span></p>
                                            <p class="card-text"><b>Pickup Time:</b> <span class=""> ${moment(req.pickup_time, ["HH:mm:ss"]).format('HH:mm A')}</span></p>
                                            <p class="card-text"><b>Week Days: </b><span class=""> ${req.week_days}</span></p>
                                            <p class="card-text"><b>Price:</b> <span class="">${req.price} Tk</span></p>
                                            <p class="card-text"><b>Request Status:</b> <span class="text-site">${req_status}</span></p>
                                            <p class="card-text"><b>Date Created:</b> <span class="">${date_created} (${date_created_ago}) </span></p>
                                            ${accepted_details_btn}
                                            <div class="o_details p-3 my-2 display-none" style="border: 1px dashed;">
                                                <span> Responder Details </span><hr />
                                                <div class="row">
                                                    <div class="co-md-6 mb-3">
                                                        <img class="profile-thumb-image" src="${o_profile_pic}"/>
                                                    </div>
                                                    <div class="co-md-6 pl-md-3">
                                                        <p class="card-text"><b>Name:</b> <span class="">${o_name} </span></p>
                                                        <p class="card-text"><b>Mobile:</b> <span class=""><a href="tel:${o_mobile}">${o_mobile} </a></span></p>
                                                        <p class="card-text"><b>Email:</b> <span class="">${o_email} </span></p>
                                                        <p class="card-text"><b>Age:</b> <span class="">${o_age} </span></p>
                                                        <p class="card-text"><b>Gender:</b> <span class="">${o_gender} </span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-2 display-none">
                                            <a href="#" class="btn btn-primary">Edit</a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        $("#rs-container #elem-rs #elem-rs-data").append(r);
                    });
                } else {
                    $("#rs-container #elem-rs #elem-rs-data").append(` <div class="row"><div class="col-md-12"><div class="alert alert-site">No Request Found</div></div></div>`);
                }
            } else {
                mobiscroll.snackbar({message: 'There went something wrong',display: 'top',color: 'danger'});
            }
        });
    } else {
        showLoginPopup();
    }
}

async function RSDRexploreRequestFilters() {
    $(".rs-dr-tab").removeClass("active");
    $("#rs-dr-tab-explore-requests").addClass("active");
    let responder = CUR_USER_INFO.rs_customer_type == 1 ? 'Passengers' : 'Riders'
    let r = `<div class="card p-2 p-md-5 my-2">   
                <div class="col-md-12">
                    <div class="row">
                        <div class="col-md-12">
                            <h5 class="mt-3"><i class="fa fa-compass text-site"></i> Explore Requests From Near By ${responder}</h5>
                            <hr />
                        </div>    
                    </div>
                    <div class="row">
                        <div class="col-md-12 my-3">
                            <div class="custom-combo">
                                <div>
                                    <span class="">District</span>
                                    <select id="rs-district-id" class="dd-districts">
                    
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12 my-3">
                            <div class="custom-combo">
                                <div>
                                    <span class="">Thana</span>
                                    <select id="rs-thana-id" class="dd-thanas">
                    
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-12">
                            <button type="button" id="btn-explore-filter-submit" class="btn btn-outline-site">Search</button>
                        </div>
                    </div>
                    
                    <div class="row my-2">
                        <div class="col-md-12 p-0" id="explore-request-results">
                            
                        </div>
                    </div>
                </div>
            </div>`;
    $("#rs-container #elem-rs").empty();
    $("#rs-container #elem-rs").html(r);
    populateDistricts();
    await getThanas($("#rs-district-id option:eq(1)").val());
    $("#rs-district-id").val($("#rs-district-id option:eq(1)").val());
    $("#rs-thana-id").val($("#rs-thana-id option:eq(1)").val());
}

async function RSDRexploreRequests(district_id, thana_id) {
    let res = await axios.get(HOSTURL + '/rs-daily/explore-requests', {timeout: 10000, params: {
        c_id: CUR_USER_INFO.unique_customer_id, 
        district_id : district_id, 
        thana_id: thana_id
    }}).then(async function(res) {
        if(res.data.status) {
            let requests = res.data.data;
            $("#rs-container #elem-rs #explore-request-results").empty();
            if(requests.length >=1) {
               
                _.each(requests, function(req, i) {
                            let r = `
                            <div class="card rs-req my-1" data-attr-req-id="${req.request_unique_id}">
                                <div class="card-body">
                                    <h5 class="card-title">#${req.request_unique_id}</h5>
                                    <div class="row">
                                        <div class="col-md-10">
                                            <p class="card-text">From: <span class="src_addr"> ${req.src_addr}</span></p>
                                            <p class="card-text">To: <span class="dest_addr"> ${req.dest_addr}</span></p>
                                            <p class="card-text">Pickup Time: <span class="pickup_time"> ${moment(req.pickup_time, ["HH:mm:ss"]).format('HH:mm A')}</span></p>
                                            <p class="card-text">Week Days: <span class="week_days"> ${req.week_days}</span></p>
                                            <p class="card-text">Price: <span class="price">${req.price} Tk</span></p>
                                        </div>
                                        <div class="col-md-2">
                                        <a href="#" class="btn btn-sm btn-outline-site btn-accept-request">Accept</a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                    $("#rs-container #elem-rs #explore-request-results").append(r);
                });
            } else {
                $("#rs-container #elem-rs #explore-request-results").html(`<div class="alert alert-site">No Request Found</div>`);
            }
        } else {
            mobiscroll.snackbar({message: 'Something Went Wrong!!',display: 'top',color: 'danger'});
        }
    });
}

async function RSDRacceptedRequests() {
    if(isLoggedIn()) {
        $(".rs-dr-tab").removeClass("active");
        $("#rs-dr-tab-accepted-requests").addClass("active");
        let collect = await collectRSUserInfo();
        if(collect == true) { 
            return false; 
        }

        let res = await axios.get(HOSTURL + '/rs-daily/accepted-requests', {timeout: 10000, params: {
            c_id: CUR_USER_INFO.unique_customer_id
        }}).then(function(res) {
            $("#rs-container #elem-rs").empty();
            let r = `   <div class="card p-1 p-md-5">
                            <div class="col-md-12 ">
                                <h5 class="mt-3"><i class="fa fa-paper-plane text-site"></i> Requests Accepted By You</h5>
                                <h6></h6>
                                <hr />
                            </div>
    
                            <div class="col-md-12" id="elem-rs-data">
                            
                            </div>
                        </div>`;

            $("#rs-container #elem-rs").html(r);

            if(res.data.status) {
                let requests = res.data.data.list;
                
                if(requests.length >= 1) {
                    
                    _.each(requests, function(req, i) {
                        let req_status = req.request_status == 0 ? "Pending": req.request_status == 1 ? "Accepted" : "Cancelled";
                        let date_created_ago = moment(req.date_created, "YYYY-MM-DD HH:mm:ss").fromNow();
                        let date_created = moment(req.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YYYY hh:mm A');
                        let accepted_details_btn = req.request_status == 1 ? `<button type="button" class="btn btn-info btn-responder-details">Requester Details</button>`: ``;
                        let o_name = req.o_name !== null ? req.o_name : "Unknown";
                        let o_mobile = req.o_mobile !== null ? req.o_mobile : "Unknown";
                        let o_email = req.o_name !== null ? req.o_email : "Unknown";
                        let o_age = req.o_name !== null ? req.o_age : "Unknown";
                        let o_gender = req.o_name !== null ? req.o_gender == "M" ? "Male" : "Female" : "Unknown";
                        let o_profile_pic = req.o_profile_pic !== null ? `/img/customers/${req.o_profile_pic}` : "/img/profile_pic.jpg";
                        r = `<div class="card rs-req my-1" data-attr-req-id="${req.request_unique_id}">
                                <div class="card-body">
                                    <h5 class="card-title">#${req.request_unique_id}</h5>
                                    <div class="row">
                                        <div class="col-md-10">
                                            <p class="card-text"><b>From:</b> <span class=""> ${req.src_addr}</span></p>
                                            <p class="card-text"><b>To:</b> <span class=""> ${req.dest_addr}</span></p>
                                            <p class="card-text"><b>Pickup Time:</b> <span class=""> ${moment(req.pickup_time, ["HH:mm:ss"]).format('HH:mm A')}</span></p>
                                            <p class="card-text"><b>Week Days: </b><span class=""> ${req.week_days}</span></p>
                                            <p class="card-text"><b>Price:</b> <span class="">${req.price} Tk</span></p>
                                            <p class="card-text"><b>Request Status:</b> <span class="text-site">${req_status}</span></p>
                                            <p class="card-text"><b>Date Created:</b> <span class="">${date_created} (${date_created_ago}) </span></p>
                                            ${accepted_details_btn}
                                            <div class="o_details p-3 my-2 display-none" style="border: 1px dashed;">
                                                <span> Requester Details </span><hr />
                                                <div class="row">
                                                    <div class="co-md-6 mb-3">
                                                        <img class="profile-thumb-image" src="${o_profile_pic}"/>
                                                    </div>
                                                    <div class="co-md-6 pl-md-3">
                                                        <p class="card-text"><b>Name:</b> <span class="">${o_name} </span></p>
                                                        <p class="card-text"><b>Mobile:</b> <span class=""><a href="tel:${o_mobile}">${o_mobile} </a></span></p>
                                                        <p class="card-text"><b>Email:</b> <span class="">${o_email} </span></p>
                                                        <p class="card-text"><b>Age:</b> <span class="">${o_age} </span></p>
                                                        <p class="card-text"><b>Gender:</b> <span class="">${o_gender} </span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-2 display-none">
                                            <a href="#" class="btn btn-primary">Edit</a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        $("#rs-container #elem-rs #elem-rs-data").append(r);
                    });
                } else {
                    $("#rs-container #elem-rs #elem-rs-data").append(` <div class="row"><div class="col-md-12"><div class="alert alert-site">No Request Found</div></div></div>`);
                }
            } else {
                mobiscroll.snackbar({message: 'There went something wrong',display: 'top',color: 'danger'});
            }
        });
    } else {
        showLoginPopup();
    }
}

async function RSDRacceptRequest() {

    let request_unique_id = CONFIRMATION_INS.closest(".rs-req").attr("data-attr-req-id");
    let c_id = CUR_USER_INFO.unique_customer_id;

    if(CUR_USER_INFO !== null) {
        $.ajax({
            method: "post",
            url: "/rs-daily/rs-accept-request",
            dataType: "JSON",
            data: { 'request_unique_id': request_unique_id, 'c_id': c_id },
            success:function(res) {
                if(res.status == true) {
                    mobiscroll.snackbar({message: 'You have accepted the requested',display: 'top',color: 'success'});
                    RSDRacceptedRequests();
                } else {
                    mobiscroll.snackbar({message: 'There went something wrong',display: 'top',color: 'danger'});
                }
            },
            error:function() {
                mobiscroll.snackbar({message: 'Something Went Wrong!!',display: 'top',color: 'danger'});
            }
        });
    } else {
        mobiscroll.snackbar({message: 'Please Login First',display: 'top',color: 'danger'});
    }
}

function getRsUserInfo() {

}

function populateDistricts() {
    $(".dd-districts").empty();
    $(".dd-districts").append(`<option value="">Select Your District</option>`);

    _.each(DISTRICTS, function(district, i) {
        let r = `<option value='${district.id}'>${district.name}</option>`;
        $(".dd-districts").append(r);
    });
}

$(document).ready(async function() {
    $(document).on("click", "#btn-rs-nav-ot", function () {
        $(this).addClass("active");
        $("#btn-rs-nav-daily").removeClass("active");
        $("#elem-rs-ot-request-container").show();
        $("#elem-rs-daily-request-container").hide();

        if(isLoggedIn()) {
            console.log(CUR_USER_INFO)
            if(CUR_USER_INFO.rs_customer_type == 1) {
                $("#rs-ot-tab-make-request, #rs-ot-tab-your-requests").closest("div").remove();
                $("#rs-ot-tab-explore-requests").click();
            } else if (CUR_USER_INFO.rs_customer_type == 2) {
                $("#rs-ot-tab-explore-requests, #rs-ot-tab-accepted-requests").closest("div").remove();
                $("#rs-ot-tab-make-request").click();
            } else {
                // let collect = await collectRSUserInfo();
                $("#rs-ot-tab-your-requests, #rs-ot-tab-accepted-requests").closest("div").remove();
                
            }
            // let collect = await collectRSUserInfo();
            // console.log(collect);
        } else {
            // setTimeout(function () {
            //     $("#loginModal").modal('show');
            // }, 500);
            $("#rs-ot-tab-your-requests, #rs-ot-tab-accepted-requests").closest("div").remove();
        }
        $("#rs-ot-tab-explore-requests").click();
    });

    $(document).on("click", "#btn-rs-nav-daily", function () {
        $(this).addClass("active");
        $("#btn-rs-nav-ot").removeClass("active");
        $("#elem-rs-daily-request-container").show();
        $("#elem-rs-ot-request-container").hide();
        RSDRDailyEntry();
    });

    $(document).on("change", "#rs-user-type", function () {
        var user_type = $(this).val();
        if(parseInt(user_type) == 1) {
            $("#rs-vehicle-info").removeClass("d-none").show();
        } else {
            $("#rs-vehicle-info").hide();
        }
    });

    $(document).on("click", "#btn-rs-submit-request", function () {
        let r_from = $("#r-from").val();
        let r_to = $("#r-to").val();
        let r_time = $("#r-time").val();
        let r_price = $("#r-price").val();
        var r_days = [];
        $(".r-day:checkbox").each(function(i) {
            if($(this).is(":checked")) {
                // console.log($(this).val())
                if($.trim($(this).val()) !== "") {
                    r_days[i] = $(this).val();
                }
            }
        });
        let c_id = CUR_USER_INFO.unique_customer_id;

        if(CUR_USER_INFO !== null) {
            $.ajax({
                method: "post",
                url: "/rs-daily/save-rs-request",
                dataType: "JSON",
                data: { 'r_from': r_from, 'r_to': r_to, 'r_time': r_time, 'r_days': r_days, 'r_price': r_price, 'c_id': c_id},
                success:function(res) {
                    if(res.status == true) {
                        mobiscroll.snackbar({message: 'Your Request is live. You will get offer shortly',display: 'top',color: 'success'});
                        RSDRgetMyRequests();
                    } else {
                        mobiscroll.snackbar({message: res.msg ,display: 'top',color: 'danger'});
                    }
                },
                error:function() {
                    mobiscroll.snackbar({message: 'Something Went Wrong!!',display: 'top',color: 'danger'});
                }
            });
        } else {
            mobiscroll.snackbar({message: 'Please Login First', display: 'top',color: 'danger'});
        }
    });

    $(document).on("click", ".btn-accept-request", function () {
        if(isLoggedIn()) {

            CONFIRMATION_INS = $(this);
            $("#POPUP").show();
            $("#POPUP #popup-body").html(`Want to accept the request?`);
            $("#POPUP #popup-yes").attr("data-method", "RSDRacceptRequest");
            return;
        } else {
            setTimeout(function () {
                $("#loginModal").modal('show');
            }, 500);
        }
    });

    $(document).on("click", "#rs-dr-tab-make-request", function () {
        RSDRmakeRequestUI();
    });

    $(document).on("click", "#rs-dr-tab-your-requests", function () {
        RSDRgetMyRequests();
    });

    $(document).on("click", "#rs-dr-tab-explore-requests", function () {
        RSDRexploreRequestFilters();
    });

    $(document).on("click", "#btn-explore-filter-submit", function () {
        let district_id = $("#rs-district-id").val();
        let thana_id = $("#rs-thana-id").val();
        $("#rs-container #elem-rs #explore-request-results").empty();
        if(district_id == "") {
            mobiscroll.snackbar({message: 'Please Select A District',display: 'top',color: 'danger'});
        } else {
            RSDRexploreRequests(district_id, thana_id);
        }
    });

    $(document).on("click", "#rs-dr-tab-accepted-requests", function () {
        RSDRacceptedRequests() ;
    });

    $(document).on("click", ".btn-responder-details", function () {
        $(this).closest(".card").find(".o_details").toggle();
    });

    $(document).on("click", "#rs-btn-how-works", function () {
        $(".rs-dr-tab").removeClass("active");
        let $mrg = $("#markup-rs-dr-how-works").clone();
        $mrg.removeClass("d-none").removeAttr("id");
        $("#rs-container #elem-rs").html($mrg);
        $('html, body').animate({
            scrollTop: $(`.coach-element[data-expanded="1"]`).offset().top-20
        }, 500);
    });
});

$(document).on("change", "#rs-district-id", function () {
    getThanas($(this).val());
});

/* Daily Request */

/* One Time Request */
async function RSOTmakeRequestUI() { 
    // console.log(CUR_USER_INFO)
    // collectRSUserInfo();

    if(isLoggedIn()) {
        $(".rs-ot-tab").removeClass("active");
        $("#rs-ot-tab-make-request").addClass("active");

        // let collect = await collectRSUserInfo();
        // if(collect == true) { return false; }

        let loc = await setUserLocation();
        if(USER_LOCATION.lat == null || USER_LOCATION.lng == null) {
            Notify("<i class='fa fa-exclamation'></i>", "Please share your location", "danger");
            return;
        }
        /* Check for Pending Request By User */
        let pending_request = await isAnyPendingRequest();
        if(pending_request.status) {
            RSOTshowOngoingRequestUI(pending_request.data);
            Notify("<i class='fa fa-exclamation'></i>", `You have one pending request` , "info");
            return;
        }
        /* Check for Pending Request By User */
        
        // $("#rs-container #elem-rs-ot").empty();
        $("#map-markup .col-md-12").html($("#osm-map"));
        let $mrg = $("#markup-rs-ot-make-request-ui").clone();
        $mrg.removeClass("d-none");
        $mrg.removeAttr("id");
        if(CUR_USER_INFO.rs_customer_type == 1) {
            $mrg.find(".rs-ot-vehicle-type-container").remove();
        }
        $("#rs-container #elem-rs-ot").html($mrg);
        $("#rs-container #elem-rs-ot .location-picker-map .location-picker-map-data").html(`<div id="rs-ot-make-req-osm-map" class="mt-2" style="height: 500px;"></div>`);

        let initial_coords = [USER_LOCATION.lat, USER_LOCATION.lng];
        initial_coords = typeof initial_coords[0] == "undefined" ? [23.7104, 90.40744] : initial_coords;

        MapHelper.init('rs-ot-make-req-osm-map', {
			osm: false,
			bing: true,
			zoom: 10,
			center: L.latLng(51.509865, -0.118092),
		});

        MapHelper.addRoutingControl([
            L.latLng(initial_coords[0], initial_coords[1]),
            L.latLng(initial_coords[0], initial_coords[1])
        ]);

        ACTIVE_FROM_ADDR = {"lat": USER_LOCATION.lat, "lon": USER_LOCATION.lng};
        ACTIVE_TO_ADDR = {"lat": USER_LOCATION.lat, "lon": USER_LOCATION.lng};
        return;

        OTMAKEREQMAP = L.map("rs-ot-make-req-osm-map").setView(initial_coords, 10);
        LAYERGROUP = L.layerGroup();
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(OTMAKEREQMAP);

        window.LRM = {
            tileLayerUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            osmServiceUrl: 'https://routing.openstreetmap.de/routed-car/route/v1',
            orsServiceUrl: 'https://api.openrouteservice.org/geocode/',
            apiToken: '5b3ce3597851110001cf6248ff41dc332def43858dff1ecccdd19bbc'
        };

        waypoints = [
            L.latLng(initial_coords[0], initial_coords[1]),
            L.latLng(initial_coords[0], initial_coords[1])
        ];

        RSOTMakeOsmMap(OTMAKEREQMAP, waypoints);
        return;

        try {
            let position = await getCoordinates();
            USER_LOCATION.lat = position.coords.latitude;
            USER_LOCATION.lng = position.coords.longitude;
            // console.log(USER_LOCATION);
            await reverseGeoCode(position.coords.latitude, position.coords.longitude);
        } catch(err) {
            console.log(err);
        }

        $(".autocomplete").show();
    } else {
        showLoginPopup();
    }

    // MAP.on('click', function(e) {
    //     console.log("map clicked")
    //     var container = L.DomUtil.create('div'),
    //         startBtn = createButton('Start from this location', container),
    //         destBtn = createButton('Go to this location', container);
    
    //     L.popup()
    //         .setContent(container)
    //         .setLatLng(e.latlng)
    //         .openOn(MAP);
    // });

    // L.DomEvent.on(startBtn, 'click', function() {
    //     control.spliceWaypoints(0, 1, e.latlng);
    //     map1.closePopup();
    // });

    // L.DomEvent.on(destBtn, 'click', function() {
    //     control.spliceWaypoints(control.getWaypoints().length - 1, 1, e.latlng);
    //     map1.closePopup();
    // });
}

async function __RSOTMakeOsmMap(__map, waypoints) {
    // OTMAKEREQMAP.eachLayer((layer) => {
    //     console.log(layer)
    //     if (layer._waypoints && layer._waypoints.length || layer._route && layer._route.length) {
    //         OTMAKEREQMAP.removeLayer(layer);
    //      }
    // });

    // if(OT_CONTROL !== null) {
    //     OTMAKEREQMAP.removeLayer(OT_CONTROL);
    // }

    // OTMAKEREQMAP.clearLayers();
    
    // L.removeControl(route);
    // L.getPlan().setWaypoints([]);

//     OT_CONTROL = L.Routing.control({
//         router: L.routing.osrmv1({
//             serviceUrl: LRM.osmServiceUrl
//         }),
//         plan: L.Routing.plan(waypoints, {
//             createMarker: function(i, wp) {
//                 // console.log("marker" + i);
//                 // console.log("marker" + String.fromCharCode(65 + i));
//                 let mlabel = i == 0 ? `Start`: `End`;
//                 var myIcon = L.icon({
//                     // iconUrl: 'my-icon.png',
//                     // iconRetinaUrl: 'my-icon@2x.png',
//                     iconSize: [38, 95],
//                     // iconAnchor: [22, 94],
//                     // popupAnchor: [-3, -76],
//                     // shadowUrl: 'my-icon-shadow.png',
//                     // shadowRetinaUrl: 'my-icon-shadow@2x.png',
//                     // shadowSize: [68, 95],
//                     // shadowAnchor: [22, 94],
//                     glyph: mlabel
//                 });

//                 return L.marker(wp.latLng, {
//                     draggable: true,
//                     iconSize: L.point(400, 500),
//                     // icon: L.icon.glyph({ glyph: String.fromCharCode(65 + i) })
//                     icon: L.icon.glyph({ glyph: mlabel} )
//                     // icon: myIcon
//                 });
//             },
//             geocoder: L.Control.Geocoder.nominatim(),
//             routeWhileDragging: true
//         }),
//         routeWhileDragging: false,
//         routeDragTimeout: 250,
//         showAlternatives: true,
//         waypointMode: 'snap',
//         addWaypoints: true,
//         altLineOptions: {
//             styles: [
//                 {color: 'black', opacity: 0.15, weight: 9},
//                 {color: 'white', opacity: 0.8, weight: 6},
//                 {color: 'blue', opacity: 0.5, weight: 2}
//             ]
//         }
//     })
//     .addTo(__map)
//     .on('routingerror', function(e) {
//         // console.log(`Routing Error`);
//         return;
//         try {
//             MAP.getCenter();
//         } catch (e) {
//             MAP.fitBounds(L.latLngBounds(waypoints));
//         }
//     })
//     .on('routesfound', function(e) {
//         ROUTEFOUND = true;
//         ROUTE = e.routes;
//     })
//     .on('waypointschanged', function(e) {
//         let w = e.waypoints;
//         ACTIVE_FROM_ADDR = typeof w[0].latLng == "undefined" ? null : w[0];
//         ACTIVE_TO_ADDR = typeof w[1].latLng == "undefined" ? null : w[1];
//         ROUTEFOUND = false;
//         ROUTE = null;
//         // MAP.fitBounds(L.latLngBounds(e.waypoints));
//     });

//     // L.Routing.errorControl(OT_CONTROL).addTo(__map);

//     $(".leaflet-routing-container").css("width", "88%");
//     setTimeout(function() {
//         // $(".leaflet-routing-container .leaflet-routing-geocoders:eq(0)").eq(0).prepend('Start');
//         // $(".leaflet-routing-container .leaflet-routing-geocoders:eq(0)").eq(1).html('End');
//     }, 2000);

//     $(".leaflet-routing-alternatives-container").hide();
}

async function RSOTMyRequests() {
    if(isLoggedIn()) {
        $(".rs-dr-tab").removeClass("active");
        $("#rs-dr-tab-your-requests").addClass("active");
        let collect = await collectRSUserInfo();
        if(collect == true) { 
            return false; 
        }

        let res = await axios.get(HOSTURL + '/rs-ot/get-my-requests', {timeout: 10000, params: {
            c_id: CUR_USER_INFO.unique_customer_id
        }}).then(function(res) {
            $("#rs-container #elem-rs-ot").empty();
            let r = `   <div class="p-1 ">
                            <div class="row">
                                <div class="col-12">
                                    <h5 class="mt-3"><i class="fa fa-rocket text-site"></i> Requests Placed By You</h5>
                                    <h6></h6>
                                    <hr />
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-12" id="elem-rs-ot-data">
                                
                                </div>
                            </div>
                        </div>`;

            $("#rs-container #elem-rs-ot").html(r);

            if(res.data.status) {
                let requests = res.data.data.list;
               
                if(requests.length >= 1) {
                    _.each(requests, function(req, i) {
                        // let req_status = req.request_status == 0 ? "Pending": req.request_status == 1 ? "Accepted" : "Cancelled";
                        let req_status = req.request_status;
                        let date_created_ago = moment(req_status.date_created, "YYYY-MM-DD HH:mm:ss").fromNow();
                        let date_created = moment(req.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YYYY hh:mm A');
                        let accepted_details_btn = [0,1,2,3].indexOf(req_status) >= 0 ? `<button type="button" class="btn btn-info btn-responder-details">Responder Details</button>`: ``;
                        let o_name = req.o_name !== null ? req.o_name : "Unknown";
                        let o_mobile = req.o_mobile !== null ? req.o_mobile : "Unknown";
                        let o_email = req.o_email !== null ? req.o_email : "Unknown";
                        let o_age = req.o_age !== null ? req.o_age : "Unknown";
                        let o_gender = req.o_gender !== null ? req.o_gender : "Unknown";
                        let o_profile_pic = req.o_profile_pic !== null ? `/img/customers/${req.o_profile_pic}` : "/img/profile_pic.jpg";

                        r = `<div class="card rs-req my-1" data-attr-req-id="${req.request_unique_id}">
                                <div class="card-body">
                                    <h5 class="card-title">#${req.request_unique_id}</h5>
                                    <div class="row">
                                        <div class="col-md-10">
                                            <p class="card-text"><b>From:</b> <span class=""> ${req.src_addr}</span></p>
                                            <p class="card-text"><b>To:</b> <span class=""> ${req.dest_addr}</span></p>
                                            <p class="card-text"><b>Price:</b> <span class="">${req.price} Tk</span></p>
                                            <p class="card-text"><b>Request Status:</b> <span class="text-site">${RS_OT_STATUS[req_status][req_status]}</span></p>
                                            <p class="card-text"><b>Date Created:</b> <span class="">${date_created} (${date_created_ago}) </span></p>
                                            ${accepted_details_btn}
                                            <div class="o_details p-3 my-2 display-none" style="border: 1px dashed;">
                                                <span> Acceptor Details </span><hr />
                                                <div class="row">
                                                    <div class="co-md-6 mb-3">
                                                        <img class="profile-thumb-image" src="${o_profile_pic}"/>
                                                    </div>
                                                    <div class="co-md-6 pl-md-3">
                                                        <p class="card-text"><b>Name:</b> <span class="">${o_name} </span></p>
                                                        <p class="card-text"><b>Mobile:</b> <span class=""><a href="tel:${o_mobile}">${o_mobile} </a></span></p>
                                                        <p class="card-text"><b>Email:</b> <span class="">${o_email} </span></p>
                                                        <p class="card-text"><b>Age:</b> <span class="">${o_age} </span></p>
                                                        <p class="card-text"><b>Gender:</b> <span class="">${o_gender} </span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-2 display-none">
                                            <a href="#" class="btn btn-primary">Edit</a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                            console.log(RS_OT_STATUS);
                            console.log(req_status);
                        $("#rs-container #elem-rs-ot #elem-rs-ot-data").append(r);
                    });
                } else {
                    $("#rs-container #elem-rs-ot #elem-rs-ot-data").append(`<div class="row"><div class="col-md-12"><div class="alert alert-site">No Request Found</div></div></div>`);
                }
            } else {
                mobiscroll.snackbar({message: 'There went something wrong', display: 'top', color: 'danger'});
            }
        });
    } else {
        showLoginPopup();
    }
}

async function RSOTMyAcceptedRequests() {
    if(isLoggedIn()) {
        $(".rs-ot-tab").removeClass("active");
        $("#rs-ot-tab-accepted-requests").addClass("active");
        let collect = await collectRSUserInfo();
        if(collect == true) { 
            return false; 
        }

        let res = await axios.get(HOSTURL + '/rs-ot/get-my-accepted-requests', {timeout: 10000, params: {
            c_id: CUR_USER_INFO.unique_customer_id
        }}).then(function(res) {
            $("#rs-container #elem-rs-ot").empty();
            let r = `   <div class="p-1 ">
                            <div class="row">
                                <div class="col-12">
                                    <h5 class="mt-3"><i class="fa fa-rocket text-site"></i> Requests Placed By You</h5>
                                    <h6></h6>
                                    <hr />
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-12" id="elem-rs-ot-data">
                                
                                </div>
                            </div>
                        </div>`;

            $("#rs-container #elem-rs-ot").html(r);

            if(res.data.status) {
                let requests = res.data.data.list;
               
                if(requests.length >= 1) {
                    _.each(requests, function(req, i) {
                        // let req_status = req.request_status == 0 ? "Pending": req.request_status == 1 ? "Accepted" : "Cancelled";
                        let req_status = req.request_status;
                        let date_created_ago = moment(req_status.date_created, "YYYY-MM-DD HH:mm:ss").fromNow();
                        let date_created = moment(req.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YYYY hh:mm A');
                        let accepted_details_btn = [0,1,2,3].indexOf(req_status) >= 0 ? `<button type="button" class="btn btn-info btn-responder-details">Responder Details</button>`: ``;
                        let o_name = req.o_name !== null ? req.o_name : "Unknown";
                        let o_mobile = req.o_mobile !== null ? req.o_mobile : "Unknown";
                        let o_email = req.o_email !== null ? req.o_email : "Unknown";
                        let o_age = req.o_age !== null ? req.o_age : "Unknown";
                        let o_gender = req.o_gender !== null ? req.o_gender : "Unknown";
                        let o_profile_pic = req.o_profile_pic !== null ? `/img/customers/${req.o_profile_pic}` : "/img/profile_pic.jpg";

                        r = `<div class="card rs-req my-1" data-attr-req-id="${req.request_unique_id}">
                                <div class="card-body">
                                    <h5 class="card-title">#${req.request_unique_id}</h5>
                                    <div class="row">
                                        <div class="col-md-10">
                                            <p class="card-text"><b>From:</b> <span class=""> ${req.src_addr}</span></p>
                                            <p class="card-text"><b>To:</b> <span class=""> ${req.dest_addr}</span></p>
                                            <p class="card-text"><b>Price:</b> <span class="">${req.price} Tk</span></p>
                                            <p class="card-text"><b>Request Status:</b> <span class="text-site">${RS_OT_STATUS[req_status][req_status]}</span></p>
                                            <p class="card-text"><b>Date Created:</b> <span class="">${date_created} (${date_created_ago}) </span></p>
                                            ${accepted_details_btn}
                                            <div class="o_details p-3 my-2 display-none" style="border: 1px dashed;">
                                                <span> Acceptor Details </span><hr />
                                                <div class="row">
                                                    <div class="co-md-6 mb-3">
                                                        <img class="profile-thumb-image" src="${o_profile_pic}"/>
                                                    </div>
                                                    <div class="co-md-6 pl-md-3">
                                                        <p class="card-text"><b>Name:</b> <span class="">${o_name} </span></p>
                                                        <p class="card-text"><b>Mobile:</b> <span class=""><a href="tel:${o_mobile}">${o_mobile} </a></span></p>
                                                        <p class="card-text"><b>Email:</b> <span class="">${o_email} </span></p>
                                                        <p class="card-text"><b>Age:</b> <span class="">${o_age} </span></p>
                                                        <p class="card-text"><b>Gender:</b> <span class="">${o_gender} </span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-2 display-none">
                                            <a href="#" class="btn btn-primary">Edit</a>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                            console.log(RS_OT_STATUS);
                            console.log(req_status);
                        $("#rs-container #elem-rs-ot #elem-rs-ot-data").append(r);
                    });
                } else {
                    $("#rs-container #elem-rs-ot #elem-rs-ot-data").append(`<div class="row"><div class="col-md-12"><div class="alert alert-site">No Request Found</div></div></div>`);
                }
            } else {
                mobiscroll.snackbar({message: 'There went something wrong', display: 'top', color: 'danger'});
            }
        });
    } else {
        showLoginPopup();
    }
}

async function RSOTExploreRequestUI() {
    try{
        let isloggedIn = isLoggedIn();
        if(isloggedIn || true) {
            $(".rs-ot-tab").removeClass("active");
            $("#rs-ot-tab-explore-requests").addClass("active");
            let loc = await setUserLocation();
            if(USER_LOCATION.lat == null || USER_LOCATION.lng == null) {
                Notify("<i class='fa fa-exclamation'></i>", "Please share your location", "danger");
                return;
            }

            $("#map-markup .col-md-12").html($("#osm-map"))
            let $mrg = $("#markup-rs-ot-explore-request-ui").clone();
            $mrg.removeClass("d-none");
            $mrg.removeAttr("id");

            $("#rs-container #elem-rs-ot").html($mrg);

            let res = await axios.get(HOSTURL + '/rs-ot/explore-requests', {timeout: 10000, params: {
                c_id: CUR_USER_INFO.unique_customer_id, 
                c_loc: USER_LOCATION
                // district_id : district_id, 
                // thana_id: thana_id
            }}).then(async function(res) {
                if(res.data.status) {
                    let requests = res.data.data;
                    if(res.data.ongoing_req == false) {
                        $("#rs-container #elem-rs-ot .rs-ot-explored-requests").empty();
                        if(requests.length >= 1 ) {
                            // console.log(requests)
                            _.each(requests, function(r_data, i) {
                                let src_loc = [r_data.src_lat, r_data.src_lng];
                                let dest_loc = [r_data.dest_lat, r_data.dest_lng];

                                let r = `
                                <div class="card rs-ot-req my-1" data-attr-req-id="${r_data.request_unique_id}">
                                    <div class="card-body">
                                        <h5 class="card-title">#${r_data.request_unique_id}</h5>
                                        <div class="row">
                                            <div class="col-md-10">
                                                <p class="card-text">From: <span class="src_addr"> ${r_data.src_addr}</span></p>
                                                <p class="card-text">To: <span class="dest_addr"> ${r_data.dest_addr}</span></p>
                                                <!--<p class="card-text">Pickup Time: <span class="pickup_time"> ${moment(r_data.pickup_time, ["HH:mm:ss"]).format('HH:mm A')}</span></p>-->
                                                <!-- <p class="card-text">Week Days: <span class="week_days"> ${r_data.week_days}</span></p> -->
                                                <p class="card-text">Price: <span class="price">${r_data.price} Tk</span></p>
                                            </div>
                                            <div class="col-md-2">
                                                <a href="javascript:void(0)" data-src-loc="[${src_loc}]" data-dest-loc="[${dest_loc}]" class="btn btn-sm btn-outline-site btn-rs-ot-view-details my-2">Details</a>
                                                <a href="javascript:void(0)" data-request-unique-id="${r_data.request_unique_id}" class="btn btn-sm btn-outline-site btn-rs-ot-accept-req">Accept</a>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12 rs-ot-details-view">

                                            </div>
                                        </div>
                                    </div>
                                </div>`;
                                $("#rs-container #elem-rs-ot .rs-ot-explored-requests").append(r);
                            });
                        } else {
                            $("#rs-container #elem-rs-ot .rs-ot-explored-requests").html(`<div class="alert alert-site">No Request Found</div>`);
                        }
                    } else {
                        ACTIVE_REQUEST_UNIQUE_ID = res.data.data.request_unique_id;
                        RSOTshowOngoingRequestUI(res.data.data);
                    }    
                } else {
                    mobiscroll.snackbar({message: 'Something Went Wrong!!',display: 'top',color: 'danger'});
                }
            });
        } else {
            setTimeout(function () {
                $("#loginModal").modal('show');
            }, 500);
        }
    } catch(err) {
        console.log(err);
    }
}

async function RSOTacceptRequest() {
    let collect = await collectRSUserInfo();
    if(collect == true) { return false; }
    Notify("<i class='fa fa-exclamation'></i>", "Accepting Request..", "info");
    let request_unique_id = CONFIRMATION_INS.closest(".rs-ot-req").attr("data-attr-req-id");
    if(CUR_USER_INFO !== null) {
        // let request_id = $(this).attr("data-request-unique-id");
        let res = await axios.post(HOSTURL + '/rs-ot/rs-ot-accept-request', {
            c_id: CUR_USER_INFO.unique_customer_id, 
            c_loc: USER_LOCATION, 
            request_unique_id: request_unique_id
        });
        if(res.data.status) {
            RSOTshowOngoingRequestUI(res.data.data);
            // $(`.rs-ot-req:not(.rs-ot-req[data-attr-req-id='${request_unique_id}'])`).remove();
            // CONFIRMATION_INS.closest(".rs-ot-req").find(".btn-rs-ot-view-details").click();
            // CONFIRMATION_INS.closest(".rs-ot-req").find("a").remove();
            Notify("<i class='fa fa-exclamation'></i>", "Request Accepted", "success");
        } else {
            let errcode = res.data.code;
            if(errcode == '000') {
                $(`.rs-ot-req[data-attr-req-id=${request_unique_id}]`).remove();
            }
            Notify("<i class='fa fa-exclamation'></i>", `${res.data.msg}`, "danger");
        }
    } else {
        Notify("<i class='fa fa-exclamation'></i>", "Please Login First", "danger");
    }
}

async function RSOTCancelRequest() {
    Notify("<i class='fa fa-exclamation'></i>", "Cancelling Request..", "info");
    if(CUR_USER_INFO !== null) {
        let res = await axios.get(HOSTURL + '/rs-ot/cancel-request', {timeout: 10000, params: {
            c_id: CUR_USER_INFO.unique_customer_id,
            request_unique_id: CONFIRMATION_INS.closest(".rs-ot-req").attr("data-attr-req-id"),
            rs_customer_type: CUR_USER_INFO.rs_customer_type
        }}).then(function(res) {
            clearInterval(GLOBALINTERVAL);
            if(res.data.status) {
                Notify("", "Ride Cancelled", "success");
                $("#btn-rs-nav-ot").click();
            } else {
                Notify("<i class='fa fa-exclamation'></i>", "There went something wrong", "danger");
            }
        });
    } else {
        Notify("<i class='fa fa-exclamation'></i>", "Please Login First", "danger");
    }
}

async function isActiveRequestAccepted() {
    let res = await axios.get(HOSTURL + '/rs-ot/request-status-by-id', {timeout: 10000, params: {
        request_unique_id: ACTIVE_REQUEST_UNIQUE_ID,
        c_id: CUR_USER_INFO.unique_customer_id
    }}).then(async function(res) {
        console.log(res.data);
        if(res.data.status) {
            if(res.data.accepted == true) {
                RSOTshowOngoingRequestUI(res.data.data);
            }
        } else {
            console.error("Something Went Wrong while checking status");
            // Notify("<i class='fa fa-exclamation'></i>", `Something Went Wrong` , "danger");
        }
    });
}

async function isAnyPendingRequest() {
    return new Promise(async function(resolve, reject) {
        let r = {};
        let res = await axios.get(HOSTURL + '/rs-ot/pending-request-check', {timeout: 10000, params: {
            c_id: CUR_USER_INFO.unique_customer_id
        }}).then(async function(res) {
            // console.log(res.data);
            if(res.data.status) {
                if(res.data.pending == true) {
                    r.status = true;
                    r.data = res.data.data;
                    ACTIVE_REQUEST_UNIQUE_ID = res.data.data.request_unique_id;
                }
            } else {
                r.status = false;
                console.error("Something Went Wrong while checking status");
                // Notify("<i class='fa fa-exclamation'></i>", `Something Went Wrong` , "danger");
            }
        });
        resolve(r);
    });
}

function RSOTshowOngoingRequestUI(o_data) {
    $("#map-markup .col-md-12").html($("#osm-map"));
    $mrg = $("#markup-rs-ot-ongoing-request .mroor").clone();
    $mrg.removeClass("d-none");
    $mrg.find(".rs-ot-req").attr("data-attr-req-id", o_data.request_unique_id);
    $mrg.find(".src_addr").html(o_data.src_addr);
    $mrg.find(".dest_addr").html(o_data.dest_addr);
    $mrg.find(".price").html(o_data.price);
    $mrg.find(".date_created").html(moment(o_data.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('HH:mm A'));

    $osm_map = $("#osm-map");
    $mrg.find(".rs-ot-details-view").html($osm_map);
    MAP.invalidateSize();
    removeAllMarkers();
    let src_loc = [o_data.src_lat, o_data.src_lng];
    let dest_loc = [o_data.dest_lat, o_data.dest_lng];
    addMarker(src_loc, `Start`);
    addMarker(dest_loc, `End`);
    MAP.setView(src_loc, 15);
    // addMarker(new_coords, `Destination`);
    clearInterval(GLOBALINTERVAL);
    
    GLOBALINTERVAL = setInterval(isActiveRequestAccepted, 15000);

    let r_status = o_data.request_status;
    if(CUR_USER_INFO.rs_customer_type == 2) { // Passenger Instruction
        $mrg.find(".driver_instruction").addClass("d-none");
        $mrg.find(".driver_instruction").remove();    

        let step = r_status;
        step = r_status == 1 ? 2 : step;
        step = r_status == 2 ? 3 : step;
        step = r_status == 3 ? 5 : step;

        let $ins = $mrg.find(".passenger_instruction");
        $ins.show();
        // Show Current Status
        $ins.find(".rsotdi-current-status").html(RS_OT_STATUS[r_status][r_status]);

        // Ride complete container
        if(r_status == 3 && (o_data.passenger_rating == null || o_data.passenger_rating == 'NULL')) {
            step = 5;
        } else if (r_status == 3 && (o_data.passenger_rating !== null && o_data.passenger_rating !== 'NULL')) {
            $ins.find(".rsotdi-step-final").removeClass("display-none");
            $ins.find(".rsotdi-ride-complete-icon").removeClass("display-none");
            step = 6;
            clearInterval(GLOBALINTERVAL);
        }

        // Step Highlight
        for(let i = 1; i < step; i++) {
            let $step = $ins.find(`.rsotdi-step-${i}`);
            $step.find(`.progress-icon`).html(`<i class="fa fa-check"></i>`);
            $step.find(`.actions`).hide();
        }
        $ins.find(`.rsotdi-step-${step} .progress-icon`).html(`<i class="fa fa-arrow-right"></i>`);
        $ins.find(`.rsotdi-step-${step} .actions`).removeClass("display-none");

        // Show / Hide Searching
        if(r_status == 0) {
            $ins.find(`.rsotdi-step-0`).removeClass("display-none");
            $ins.find(".rsotdi-current-status").hide();
        }

        // Show / Hide OTP
        if(r_status == 1 || r_status == 2) {
            $ins.find(`.rs-ot-otp-1`).removeClass("display-none");
            $ins.find(`.rs-ot-otp-1 span`).html(o_data.otp);
        } else {
            $ins.find(`.rs-ot-otp-1`).remove();
        }

        console.log(r_status)
        // Show / Hide cancel ride button
        if(r_status !== 0 && r_status !== 1) {
            $ins.find(".btn-rs-ot-cancel-ride").remove();
        }

    } else { // Driver Instruction
        $mrg.find(".passenger_instruction").hide();
        $mrg.find(".driver_instruction").show();
        let step = r_status;
        step = r_status == 1 ? 2 : step;
        step = r_status == 2 ? 4 : step;
        step = r_status == 3 ? 5 : step;

        let $ins = $mrg.find(".driver_instruction");
        $ins.show();

        // Show Current Status
        $ins.find(".rsotdi-current-status").html(RS_OT_STATUS[r_status][r_status]);

        // Ride complete container
        if(r_status == 3 && (o_data.driver_rating == null || o_data.driver_rating == 'NULL')) {
            step = 5;
            $ins.find(".rsotdi-ride-final-fare").removeClass("display-none").html(o_data.final_price + " TK.");
        } else if (r_status == 3 && (o_data.driver_rating !== null && o_data.driver_rating !== 'NULL')) {
            $ins.find(".rsotdi-step-final").removeClass("display-none");
            $ins.find(".rsotdi-ride-complete-icon").removeClass("display-none");
            step = 6;
            clearInterval(GLOBALINTERVAL);
        }

        // Step Highlight
        for(let i = 1; i < step; i++) {
            let $step = $ins.find(`.rsotdi-step-${i}`);
            $step.find(`.progress-icon`).html(`<i class="fa fa-check"></i>`);
            $step.find(`.actions`).addClass("display-none").hide();
        }

        // Show / Hide cancel ride button
        if(r_status !== 0 || r_status !== 1) {
            $ins.find(".btn-rs-ot-cancel-ride").remove();
        }
        
        $ins.find(`.rsotdi-step-${step} .progress-icon`).html(`<i class="fa fa-arrow-right"></i>`);
        $ins.find(`.rsotdi-step-${step} .actions`).removeClass("display-none");
    }

    $("#rs-container #elem-rs-ot").html($mrg);
    MAP.invalidateSize();
}

function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}

function calculateOTApproxFare() {
    let vehicle_type = $("input[name='rs-ot-vehicle-type']:checked").val();
    let fare = 0;    
    let charges = vehicle_type == 1 ? RS_OT_CHARGES["BD"]["MODE"]["BIKE"] : vehicle_type == 2 ? RS_OT_CHARGES["BD"]["MODE"]["CAR"] : false;
    if(charges) {   
        // console.log(DISTANCE, charges.MIN_DIS)
        // "BIKE": {"MIN_DIS": 1, "FIRSTKM": 30, "MIN_FARE": 30, "PERKM": 10, "CHARGEREETIME": 10, "PERMIN": 2}, 
        // "CAR": {"MIN_DIS": 2, "FIRSTKM": 50, "MIN_FARE": 100, "PERKM": 25, "CHARGEREETIME": 10, "PERMIN": 7}, 
        if(DISTANCE >= charges.MIN_DIS) {
            fare = parseFloat(charges.FIRSTKM) + (parseFloat(DISTANCE-1) * charges.PERKM);
            fare = fare < charges.MIN_FARE ? charges.MIN_FARE: fare;
        } else {
            fare = null;
            Notify(``, `Min distance for a ride is ${charges.MIN_DIS} KM`)
        }            
    }

    if(fare !== null) {
        $("#elem-rs-ot .step_2_ui .rs_ot_approx_fare").html(fare + RS_OT_CHARGES["BD"]["CURRENCY"]);
    }

    return fare;
}

$(document).on("click", "#btn-rs-ot-step-1", async function (e) {
    let msg = ``;
    msg = ACTIVE_FROM_ADDR == null && ACTIVE_TO_ADDR == null ? `Select Source & Destination Address.`: ``;
    msg = ACTIVE_FROM_ADDR == null ? `Select Source Address.`: ``;
    msg = ACTIVE_TO_ADDR == null ? `Select Destination Address.`: ``;
    if(ACTIVE_FROM_ADDR !== null && ACTIVE_TO_ADDR !== null && ROUTEFOUND !== false) {
        if(ROUTE !== null) {
            DISTANCE = parseInt(ROUTE[0].summary.totalDistance / 1000);
            ETA = (parseInt(ROUTE[0].summary.totalTime) / 60).toFixed(2);
            console.log(DISTANCE, ETA);
            if(DISTANCE >= 2) {
                $("#elem-rs-ot .step_1_ui").hide();
                $("#elem-rs-ot .step_2_ui").show();
                $("#elem-rs-ot .step_2_ui .rs_ot_pickup").html(ACTIVE_FROM_ADDR.name);
                $("#elem-rs-ot .step_2_ui .rs_ot_dropoff").html(ACTIVE_TO_ADDR.name);
                $("#elem-rs-ot .step_2_ui .rs_ot_distance").html(DISTANCE + "km");
                $("#elem-rs-ot .step_2_ui .rs_ot_eta").html(ETA + "minutes");
                calculateOTApproxFare();
            } else {
                Notify("<i class='fa fa-exclamation'></i>", `Ride must be more than 2 KM` , "danger");
            }
        }
    } else {
        msg = ``;
        if(ACTIVE_FROM_ADDR == null) {
            msg = `Select Source Address`;
        } else if (ACTIVE_TO_ADDR == null) {
            msg = `Select Destination Address`;
        } else if(ACTIVE_FROM_ADDR == null && ACTIVE_TO_ADDR == null) {
            msg = `Select Source & Destination Address`;
        }
        if(ROUTEFOUND == false) {
            msg = `No Route Found.`;
        }
        Notify("<i class='fa fa-exclamation'></i>", msg , "danger");
    }
});

$(document).on("click", "#btn-rs-ot-step-2", async function (e) {
    if(isLoggedIn()) {
        let collect = await collectRSUserInfo();
        if(collect == true) { return false; }
        let vehicle_type = CUR_USER_INFO.rs_customer_type == 1 ? CUR_USER_INFO.rs_vehicle_type : $("input[name='rs-ot-vehicle-type']:checked").val();
        let user_type = CUR_USER_INFO.rs_customer_type;
        let price = $("#rs-ot-price").val();
        if(vehicle_type !== "" && user_type !== "") {
            let c_id = CUR_USER_INFO.unique_customer_id;
            $.ajax({
                method: "post",
                url: "/rs-ot/make-request",
                dataType: "JSON",
                data: { 'c_id': c_id, 'vehicle_type': vehicle_type, 'user_type': user_type, 
                    'price': calculateOTApproxFare(), 'distance': DISTANCE, 'eta': ETA,
                    'source': {"lat": ACTIVE_FROM_ADDR.lat, "lon": ACTIVE_FROM_ADDR.lon}, 'dest': {"lat":ACTIVE_TO_ADDR.lat, "lon": ACTIVE_TO_ADDR.lon},
                    'source_name': ACTIVE_FROM_ADDR.name, 'dest_name': ACTIVE_TO_ADDR.name
                },
                success:function(res) {
                    if(res.status == true) {
                        ACTIVE_REQUEST_UNIQUE_ID = res.request_unique_id;
                        RSOTshowOngoingRequestUI(res.data);                  
                    } else {
                        Notify("<i class='fa fa-exclamation'></i>", res.msg , "danger");
                    }
                },
                error: function() {
                    Notify("<i class='fa fa-exclamation'></i>", "Could not connect to server" , "danger");
                }
            });
        } else {
            Notify("<i class='fa fa-exclamation'></i>", "Invalid Inputs" , "danger");
        } 
    } else {
        showLoginPopup();
    }
});

$(document).on("change", "input[name='rs-ot-vehicle-type']", async function (e) {
    calculateOTApproxFare();
});

$(document).on("click", "#btn-go-back-step-1", async function (e) {
    $("#elem-rs-ot .step_1_ui").show();
    $("#elem-rs-ot .step_2_ui").hide();
});

$(document).on("click", "#btn-rs-ot-step-3-cancel", async function (e) {
    $("#elem-rs-ot .step_3_ui").hide();
    $("#elem-rs-ot .step_2_ui").hide();
    $("#elem-rs-ot .step_1_ui").show();
});

$(document).ready(function() {
    // autocomplete("rs-ot-from-addr", [], 'callbackFromAddrAutocomplete');

    $(document).on("click", "#rs-ot-tab-make-request", function () {
        RSOTmakeRequestUI();
    });

    $(document).on("click", "#rs-ot-tab-explore-requests", function () {
        RSOTExploreRequestUI();
    });

    $(document).on("click", "#rs-ot-tab-your-requests", function () {
        RSOTMyRequests();
    });

    $(document).on("click", "#rs-ot-tab-accepted-requests", function () {
        RSOTMyAcceptedRequests();
    });

    $(document).on("click", ".btn-rs-ot-view-details", async function () {
        if(isLoggedIn()) {
            let collect = await collectRSUserInfo();
            if(collect == true) { return false; }
            $osm_map = $("#osm-map");
            $(this).closest(".rs-ot-req").find(".rs-ot-details-view").html($osm_map);
            // $("#map-markup .col-md-12").html($osm_map)
            MAP.invalidateSize();
            removeAllMarkers();
            let src_loc = JSON.parse($(this).attr("data-src-loc"));
            let dest_loc = JSON.parse($(this).attr("data-dest-loc"));
            addMarker(src_loc, `Start`);
            addMarker(dest_loc, `End`);
            MAP.setView(src_loc, 15);
            // addMarker(new_coords, `Destination`);

            return;
        } else {
            setTimeout(function () {
                $("#loginModal").modal('show');
            }, 500);
        }
    });

    $(document).on("click", ".btn-rs-ot-accept-req", async function () {
        if(isLoggedIn()) {
            $('html, body').animate({
                scrollTop: $("#content-wrapper").offset().top-20
            }, 500);
            CONFIRMATION_INS = $(this);
            $("#POPUP").show();
            $("#POPUP #popup-body").html(`Want to accept the request?`);
            $("#POPUP #popup-yes").attr("data-method", "RSOTacceptRequest");
            return;

        } else {
            setTimeout(function () {
                $("#loginModal").modal('show');
            }, 500);
        }
    });

    $(document).on("click", ".btn-rs-ot-ongoing-request-otp", async function () {
        if(isLoggedIn()) {
            let otp = $(this).closest("div").find(".input-rs-ot-ongoing-request-otp").val();
            $.ajax({
                method: "post",
                url: "/rs-ot/rs-ot-start-ride",
                dataType: "JSON",
                data: { 'otp': otp, 'acceptor_id': CUR_USER_INFO.unique_customer_id, 'request_unique_id': $(this).closest(".rs-ot-req").attr("data-attr-req-id"), 'c_id': CUR_USER_INFO.unique_customer_id },
                success:function(res) {
                    if(res.status == true) {
                        Notify("<i class='fa fa-check'></i>", "Ride Started", "success");
                        RSOTshowOngoingRequestUI(res.data);
                    } else {
                        Notify("<i class='fa fa-check'></i>", res.msg , "danger");
                    }
                },
                error:function() {
                    Notify("<i class='fa fa-check'></i>",'Something Went Wrong!!' , "danger");
                }
            });
        } else {
            setTimeout(function () {
                $("#loginModal").modal('show');
            }, 500);
        }
    });

    $(document).on("click", ".btn-rs-ot-ongoing-end-trip", async function () {
        if(isLoggedIn()) {
            $.ajax({
                method: "post",
                url: "/rs-ot/rs-ot-end-ride",
                dataType: "JSON",
                data: {'request_unique_id': $(this).closest(".rs-ot-req").attr("data-attr-req-id"), 'c_id': CUR_USER_INFO.unique_customer_id },
                success:function(res) {
                    if(res.status == true) {
                        Notify("<i class='fa fa-check'></i>", "Ride Ended Successfully", "success");
                        RSOTshowOngoingRequestUI(res.data);
                    } else {
                        Notify("<i class='fa fa-check'></i>", res.msg , "danger");
                    }
                },
                error:function() {
                    Notify("<i class='fa fa-check'></i>",'Something Went Wrong!!' , "danger");
                }
            });
        } else {
            setTimeout(function () {
                $("#loginModal").modal('show');
            }, 500);
        }
    });

    $(document).on("click", ".btn-rs-ot-completed-review", async function () {
        let rating = $(this).closest(".actions").find(".input-customer-review").val();
        if(isLoggedIn()) {
            $.ajax({
                method: "post",
                url: "/rs-ot/rs-ot-save-review",
                dataType: "JSON",
                data: {'request_unique_id': ACTIVE_REQUEST_UNIQUE_ID, 'c_id': CUR_USER_INFO.unique_customer_id, 'rating': rating },
                success:function(res) {
                    if(res.status == true) {
                        Notify("<i class='fa fa-check'></i>", "Thanks for your feedback", "success");
                        RSOTshowOngoingRequestUI(res.data);
                    } else {
                        Notify("<i class='fa fa-check'></i>", res.msg , "danger");
                    }
                },
                error:function() {
                    Notify("<i class='fa fa-check'></i>",'Something Went Wrong!!' , "danger");
                }
            });
        } else {
            setTimeout(function () {
                $("#loginModal").modal('show');
            }, 500);
        }
    });       

    $(document).on("click", ".btn-rs-ot-cancel-ride", async function () {
        // let menu = CUR_USER_INFO.rs_customer_type == "1" ? "rs-ot-tab-explore-requests" : "rs-ot-tab-make-request";
        // $(`#${menu}`).click();
        if(isLoggedIn()) {
            $('html, body').animate({
                scrollTop: $("#content-wrapper").offset().top-20
            }, 500);
            CONFIRMATION_INS = $(this);
            $("#POPUP").show();
            $("#POPUP #popup-body").html(`Want to accept the request?`);
            $("#POPUP #popup-yes").attr("data-method", "RSOTCancelRequest");
            return;
        } else {
            showLoginPopup();
        }
    });                                 

    $(document).on("keyup", "#rs-ot-from-addr", async function (e) {
        let from_str = $(this).val();
        FROM_ADDR_ARR = await reverseGeoCode(e, from_str);
        // console.log(FROM_ADDR_ARR)
        autocomplete("rs-ot-from-addr", FROM_ADDR_ARR, 'callbackFromAddrAutocomplete'); 
    });

    $(document).on("keyup", "#rs-ot-to-addr", async function (e) {
        let from_str = $(this).val();
        TO_ADDR_ARR = await reverseGeoCode(e, from_str);
        autocomplete("rs-ot-to-addr", TO_ADDR_ARR, 'callbackToAddrAutocomplete'); 
    });
});

async function reverseGeoCode(e, from_str) {
    return new Promise(async function(resolve, reject) {
        if (e.keyCode !== 40 && e.keyCode !== 38) {
            if(from_str.length >=1) {
                // let nominatim = `https://nominatim.openstreetmap.org/?addressdetails=1&q=${from_str}&format=json&limit=5`;
                let nominatim = ` https://nominatim.openstreetmap.org/search?&q=${from_str}&format=json&&countrycodes=bd&limit=5`;
                await axios.get(nominatim).then(resp => {
                    resolve(resp.data);
                });
            }
        }
    });
}

async function geoCode(lat, lon) {
    return new Promise(async function(resolve, reject) {
        let nominatim = `http://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=27&addressdetails=1`;
        await axios.get(nominatim).then(resp => {
            resolve(resp.data);
        });
    });
}

async function drawRoutesOnMap() {
    try {
        if(ACTIVE_FROM_ADDR == null || typeof ACTIVE_FROM_ADDR == "undefined") {
            Notify(``, `Please Enter Pickup Location`, `danger`);
            return;
        }

        if(ACTIVE_TO_ADDR == null || typeof ACTIVE_TO_ADDR == "undefined") {
            Notify(``, `Please Enter Dropoff Location`, `danger`);
            return;
        }

        if(ACTIVE_FROM_ADDR !== null && ACTIVE_TO_ADDR !== null) {
            // OTMAKEREQMAP.removeControl(OT_CONTROL);
            waypoints = [
                L.latLng(ACTIVE_FROM_ADDR.lat, ACTIVE_FROM_ADDR.lon),
                L.latLng(ACTIVE_TO_ADDR.lat, ACTIVE_TO_ADDR.lon)
            ];
            MapHelper.removeRoutingControl();
            MapHelper.addRoutingControl(waypoints);
        }
    } catch (err) {
        Notify(``, `Could not find route! Please try again.`, `danger`);
    }
}

// https://www.npmjs.com/package/osrm-client-js 

function callbackFromAddrAutocomplete(index) {
    try {
        ACTIVE_FROM_ADDR = {"lat": FROM_ADDR_ARR[index].lat, "lon": FROM_ADDR_ARR[index].lon};
        // MapHelper.panMap(ACTIVE_FROM_ADDR.lat, ACTIVE_FROM_ADDR.lon);
        drawRoutesOnMap();
    } catch (err) {
        Notify(``, `Could not find route! Please try again.`, `danger`);
    }
}

function callbackToAddrAutocomplete(index) {
    try {
        ACTIVE_TO_ADDR = {"lat": TO_ADDR_ARR[index].lat, "lon": TO_ADDR_ARR[index].lon};
        drawRoutesOnMap();
    } catch (err) {
        Notify(``, `Could not find route! Please try again.`, `danger`);
    }
}

function isRSInfoComplete() {
    if(isLoggedIn()) {
        return CUR_USER_INFO.rs_customer_type !== null ? true : false; 
    } else {
        showLoginPopup();
        return false;
    }
}

$(document).on("click", "#btn-rs-recharge-options", async function () {
    $(this).closest(".row").find(".rs-recharge-payment-options").toggle();
});

$(document).on("click", ".btn-payment-rs-recharge", async function () {
    let pg = $(this).attr("data-pg");
    let amount = $(this).closest(".rs-recharge-payment-options").find(".input-rs-recharge-amount").val();
    if(parseInt(amount) >= 20) {
        $(".btn-payment-rs-recharge").attr("disabled", true);
        $(this).closest(".rs-recharge-payment-options").find(".payment-msg").html(`<i class="fas fa-spinner fa-spin"></i> &nbsp Redirecting to payment gateway..`);
        BLOCKALLNAVIGATION.status = true;
        BLOCKALLNAVIGATION.msg = `Payment in Progress. Please do not reload browser.`;

        let res = await axios.post(HOSTURL + '/customers/rs-recharge', {
            pg: pg,
            amount: amount, 
            customer_id: CUR_USER_INFO.unique_customer_id,
        });

        BLOCKALLNAVIGATION.status = false;
        if (res.data.status == true) {
            let pgr = res.data.pg_response;
            if(pgr.statusCode == "0000") {
                location.href = pgr.bkashURL;
            } else {
                Notify("", "Could not redirect to payment gateway", "danger");
            }
        } else {
            Notify("", `Something went wrong`, "danger");
        }
    } else {
        Notify("", `Recharge amount must be greater than 20`, "danger");
    }
});


// $(document).on("change", ".dd-thanas", function () {
//     getThanas($(this).val());
// });


MapHelper = (function ($) {
    'use strict';

    var settings = {
        center: [0, 0],
        zoom: null,
    };

    window.LRM = {
        tileLayerUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        osmServiceUrl: 'https://routing.openstreetmap.de/routed-car/route/v1',
        orsServiceUrl: 'https://api.openrouteservice.org/geocode/',
        apiToken: '5b3ce3597851110001cf6248ff41dc332def43858dff1ecccdd19bbc'
    };

    var mapId = '';
    var map = null;
    var baseMaps = {};
    var overlayMaps = {};
    var routingControl = null;


    var init = function (mapLayerId, options) {
        settings = $.extend(settings, options);
        mapId = mapLayerId;
        initMap();
    };

    var getMap = function () {
        return map;
    };

    var addRoutingControl = function (waypoints) { 
        if (routingControl != null)
            removeRoutingControl();

            routingControl = L.Routing.control({
                // router: L.routing.osrmv1({
                //     serviceUrl: LRM.osmServiceUrl
                // }),
                plan: L.Routing.plan(waypoints, {
                    createMarker: function(i, wp) {
                        // console.log("marker" + i);
                        // console.log("marker" + String.fromCharCode(65 + i));
                        let mlabel = i == 0 ? `Start`: `End`;
                        var myIcon = L.icon({
                            glyph: mlabel
                        });
        
                        return L.marker(wp.latLng, {
                            draggable: true,
                            iconSize: L.point(400, 500),
                            icon: L.icon.glyph({ glyph: mlabel})
                        });
                    },
                    geocoder: L.Control.Geocoder.nominatim(),
                    routeWhileDragging: true
                }),
                routeWhileDragging: false,
                routeDragTimeout: 250,
                showAlternatives: true,
                waypointMode: 'snap',
                addWaypoints: false,
                altLineOptions: {
                    styles: [
                        {color: 'black', opacity: 0.15, weight: 9},
                        {color: 'white', opacity: 0.8, weight: 6},
                        {color: 'blue', opacity: 0.5, weight: 2}
                    ]
                }
            }).addTo(map);

        // routingControl = L.Routing.control({
        //     waypoints: waypoints
        // }).addTo(map);

        routingControl.on('routingerror', function(e) {
            // console.log(`Routing Error`);
            return;
            try {
                MAP.getCenter();
            } catch (e) {
                MAP.fitBounds(L.latLngBounds(waypoints));
            }
        })
        .on('routesfound', async function(e) {
            ROUTEFOUND = true;
            ROUTE = e.routes;
            
            let $rc = $(`#rs-ot-make-req-osm-map .leaflet-control-container .leaflet-routing-container`);
            $rc.remove();
    
            let w = e.waypoints;
            setActiveVariables(w);
        })
        .on('waypointschanged', async function(e) {
            ROUTEFOUND = false;
            ROUTE = null;
            DISTANCE = null;
            ETA = null;
            let w = e.waypoints;
            setActiveVariables(w);
        });
    };

    var setActiveVariables = async function (w) {
        ACTIVE_FROM_ADDR = typeof w[0].latLng == "undefined" ? null : {"lat": w[0].latLng.lat, "lon": w[0].latLng.lng, "name": w[0].name};
        ACTIVE_TO_ADDR = typeof w[1].latLng == "undefined" ? null : {"lat": w[1].latLng.lat, "lon": w[1].latLng.lng, "name": w[1].name};

        if(ACTIVE_FROM_ADDR.name == "") {
            let x = await geoCode(ACTIVE_FROM_ADDR.lat, ACTIVE_FROM_ADDR.lon);
            // ACTIVE_FROM_ADDR.name = x.display_name;
            ACTIVE_FROM_ADDR.name = _.has(x, 'display_name') ? x.display_name : "";

        }
        
        console.log(ACTIVE_TO_ADDR)
        if(ACTIVE_TO_ADDR.name == "") {
            let x = await geoCode(ACTIVE_TO_ADDR.lat, ACTIVE_TO_ADDR.lon).display_name;
            // console.log(x)
            ACTIVE_TO_ADDR.name = _.has(x, 'display_name') ? x.display_name : "";
        } 

        $("#rs-ot-from-addr").val(ACTIVE_FROM_ADDR.name);
        $("#rs-ot-to-addr").val(ACTIVE_TO_ADDR.name);
        // map.fitBounds(L.latLngBounds(w));
    };

    var removeRoutingControl = function () {
        if (routingControl != null) {
            map.removeControl(routingControl);
            routingControl = null;
        }
    };

    var panMap = function (lat, lng) {
        map.panTo(new L.LatLng(lat, lng));
    }

    var centerMap = function (e) {
        panMap(e.latlng.lat, e.latlng.lng);
    }

    var zoomIn = function (e) {
        map.zoomIn();
    }

    var zoomOut = function (e) {
        map.zoomOut();
    }

    var initMap = function () {
        var $this = this;

        map = L.map(mapId, {
            center: settings.center,
            zoom: settings.zoom,
            crs: L.CRS.EPSG3857,
            attributionControl: true,
            contextmenu: true,
            contextmenuWidth: 140
        });

        baseMaps["OSM"] = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        }).addTo(map);
    };

    var invalidateMapSize = function () {
        map.invalidateSize();
    }

    return {
        init: init, addRoutingControl: addRoutingControl, removeRoutingControl: removeRoutingControl, 
        panMap: panMap, invalidateMapSize: invalidateMapSize, getMap: getMap
    }
}(jQuery));