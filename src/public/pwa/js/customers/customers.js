$(document).ready(async function() {
    updateCustomerInfoCache();
    
    setTimeout(function () {
        let url_service_name = $("#url_service_name").val();
        if(url_service_name !== null) {
            $(`#${url_service_name}`).click();
        } else {
            $(`#${ACTIVE_TAB}`).click();
        }
    }, 50);

    setTimeout(function () {
        loadCCBanner();
    }, 1000);

    setTimeout(function () {
        loadRSBanner();
    }, 1000);

    setTimeout(function () {
        loadFooterBanner();
    }, 1000);

    window.addEventListener( "pageshow", function ( event ) {
        var perfEntries = performance.getEntriesByType("navigation");
        console.log("Pageshow:" + perfEntries);
        console.log("Pageshow:" + perfEntries[0]);
        console.log("Pageshow:" + perfEntries[0].type);
        if (perfEntries[0].type === "back_forward" /*|| perfEntries[0].type === "reload"*/) {
            seatStateChanger.releaseAllSelectedSeats();
            location.reload(true);
        }
    });
});

$(document).on('click', '#topnav-menu-login', async function (e) {
    resetLoginModal();
    $("#loginModal").modal("show");
});

$(document).on('click', '#topnav-menu-registration', async function (e) {
    resetRegistrationModal();
    $("#registrationModal").modal("show");
});

$(document).on('click', '#topnav-menu-signInUp', async function (e) {
    //signin
    $("#c_email").val("");
    $("#c_pwd").val("");
    $("#c_login_msg").hide();
    //signup
    let signup_form = $("#c_signup_form")
    signup_form.find("#c_signup_msg").hide();
    signup_form.find(".c_name").val("");
    signup_form.find(".c_email").val("");
    signup_form.find(".c_mobile").val("");
    signup_form.find(".c_age").val("");
    signup_form.find(".c_pwd").val("");
    signup_form.find(".c_con_pwd").val("");
});

$(document).on('click', '#btn_customer_login', async function (e) {
    e.preventDefault();
    console.log(2223)
    let mobile = $("#c_mobile").val().trim();
    let pwd = $("#c_pwd").val().trim();
    let html = "";
    if(mobile.trim() !== "" && pwd.trim() !== "") {
        let res = await axios.post(HOSTURL+'/customers/signin', {
            mobile: mobile,
            pwd: pwd,
        });
        makeSignin(res);
    } else {
        html = "Wrong Username / Password";
        Notify("<i class='fa fa-check'></i>", html, "danger");
    }
});

$(document).on('click', '#btn_customer_signup', async function (e) {
    let form = $("#c_signup_form");
    let signup_msg = form.find("#c_signup_msg");
    let name = form.find(".c_name").val().trim();
    // let email = form.find(".c_email").val().trim();
    let mobile = form.find(".c_mobile").val().trim();
    // let age = form.find(".c_age").val().trim();
    let pwd = form.find(".c_pwd").val().trim();
    let con_pwd = form.find(".c_con_pwd").val().trim();
    // let gender = $('input[name="c_gender"]:checked').val();
    let html = "";
    let error = false;
   
    if(name == "") { 
        error = true; $("#err_msg_c_signup_name").html("Name must be letters (A-Z)").show().removeClass("text-muted").addClass("text-danger");
    } else if (!validateName(name)) {
        $("#err_msg_c_signup_name").html("Name must be letters (A-Z)").show().removeClass("text-muted").addClass("text-danger");
    } else { $("#err_msg_c_signup_name").html("").hide(); }

    if(mobile == "") {
        error = true; $("#err_msg_c_signup_mobile").html("Mobile Numner must be number").show().removeClass("text-muted").addClass("text-danger");
    } else {  $("#err_msg_c_signup_mobile").html("").hide(); } 

    if(pwd == "") { 
        error = true; $("#err_msg_c_signup_pwd").html("Please choose a password").show().removeClass("text-muted").addClass("text-danger");
    } else { $("#err_msg_c_signup_pwd").html("").hide(); }

    if(pwd.trim() !== con_pwd.trim()) { 
        $("#err_msg_c_signup_con_pwd").html("Password mismatch").show().removeClass("text-muted").addClass("text-danger");
    } else {
        $("#err_msg_c_signup_con_pwd").html("").hide();
    }

    if(error) {
        signup_msg.html(`<i class="fa fa-exclamation-circle" aria-hidden="true"></i> There is something wrong with your inputs`).removeClass("alert-info").removeClass("text-info").addClass("alert-danger").removeClass("text-muted").addClass("text-danger").show();
    } else {
        signup_msg.html(`<i class="fa fa-spinner fa-spin"></i> Sending an OTP to your mobile`).removeClass("alert-danger").removeClass("text-danger").addClass("alert-info").show();
        $('#btn_customer_signup').prop('disabled', true);
        $('#registrationModal').animate({ scrollTop: 0 }, 'slow');

        let res = await axios.post(HOSTURL +'/customers/signup', {
            name: name,
            // email: email,
            pwd: pwd,
            // age: age,
            // gender: gender,
            mobile: mobile
        });
        if(res.data.status == true) {
            $("#c_signup_data_form").hide();
            $("#c_signup_otp_form").show();
        } else {
            signup_msg.html(res.data.msg).removeClass("alert-info").addClass("alert-danger").addClass("text-danger").show();
            $('#btn_customer_signup').removeAttr('disabled');
        }
    }
});

$(document).on('click', '#btn_customer_verify_otp_signup', async function (e) {
    let form = $(this).closest(".otp-form");
    let signup_msg = form.find("#c_signup_otp_msg");
    let mobile = $("#c_signup_form").find(".c_mobile").val().trim();
    if(mobile == "") {
        mobile = $("#loginModal").find("#c_mobile").val().trim();
    }
    let otp = form.find(".c_otp").val().trim();
    let html = "";
    let error = false;
    
    if(otp == "") {
        error = true; 
        form.find(".otp-form").html("OTP Mismatch").show().removeClass("text-muted").addClass("text-danger");
    }

    if(error) {
        signup_msg.html("<i class='fa fa-exclamation'></i> OTP Mismatch!!").removeClass("alert-info").addClass("alert-danger").show().removeClass("text-muted").addClass("text-danger");
    } else {
        let res = await axios.post(HOSTURL+'/customers/verify-otp-signup', {
            otp: otp, 
            mobile: mobile
        });
        if(res.data.status == true) {                                                        
            CUR_USER_INFO.unique_customer_id = res.data.customer_id;
            CUR_USER_INFO.fullname = res.data.name;
            CUR_USER_INFO.nid = res.data.nid;
            CUR_USER_INFO.user_type = res.data.user_type;
            CUR_USER_INFO.rs_customer_type = res.data.rs_customer_type;
            CUR_USER_INFO.rs_vehicle_type = res.data.rs_vehicle_type;
            CUR_USER_INFO.district_id = res.data.district_id;
            CUR_USER_INFO.thana_id = res.data.thana_id;
            CUR_USER_INFO.profile_pic = res.data.profile_pic;
            localStorage.setItem('curCustomerInfo', JSON.stringify(CUR_USER_INFO));
            updateCustomerInfoCache();
            $(`#${ACTIVE_TAB}`).click();
            Notify("<i class='fa fa-check'></i>", "Sign Up Successful", "info");
            $("#registrationModal").modal('hide');
            resetRegistrationModal();
            signup_msg.html(res.data.msg).removeClass("alert-info").addClass("alert-info").show();
        } else {
            signup_msg.html(res.data.msg).removeClass("alert-info").addClass("alert-info").show();
        }
    }
});

$(document).on("click", "#btn_reg_resend_otp", function () {
    resendRegOTP();
});

$(document).on("click", "#btn_forgot_pwd", function () {
    $("#c_signin_form").hide();
    $("#c_signin_forgot_pwd").show();
    $("#c_signin_forgot_pwd").find(".c_forgot_pwd_mobile").val("");
    $("#c_signin_forgot_pwd").find(".c_msg").removeClass("alert-danger").addClass("alert-info").html(`<i class="fa fa-paper-plane" aria-hidden="true"></i> Enter your mobile number below. We will send a code`);
    $("#btn_forgot_pwd_send").removeAttr("disabled");
});

$(document).on("click", "#btn_forgot_pwd_send", async function () {
    let form = $(this).closest(".otp-form");
    let msg = form.find(".c_msg");
    let mobile = $("#c_signin_forgot_pwd").find(".c_forgot_pwd_mobile").val().trim();
    if(mobile !== "" && validateMobile(mobile)) {

        msg.html(`<i class="fa fa-spinner fa-spin"></i> Sending an OTP to your mobile`).removeClass("alert-danger").addClass("alert-info").show();
        $('#registrationModal').animate({ scrollTop: 0 }, 'slow');
        $(this).prop("disabled", true);
        let res = await axios.post(HOSTURL + '/customers/recover-pwd-otp-send', {
            mobile: mobile
        });

        if(res.data.status == true) {
            $("#c_signin_forgot_pwd").hide();
            $("#c_signin_otp_form").show();
            $("#c_signin_otp_form").find(".c_otp").val("");
            $("#c_signin_otp_form").find(".c_msg").removeClass("alert-danger").removeClass("alert-info").addClass("alert-success").html(`<i class="fa fa-check-circle" aria-hidden="true"></i> We have sent a code to your phone`);
            $("#c_signin_otp_form").find("#btn_customer_verify_otp_signin").removeAttr("disabled");
        } else {
            $(this).removeAttr("disabled");
            msg.html(res.data.msg).removeClass("alert-info").addClass("alert-danger").show();
        }
    } else {
        msg.html(`<i class="fa fa-exclamation-circle"></i> Invalid Mobile Number`).removeClass("alert-info").addClass("alert-danger").show();
    }
});

$(document).on('click', '.btn_fg_customer_verify_otp', async function (e) {
    let form = $(this).closest(".otp-form ");
    let msg = form.find(".c_msg");
    let mobile = $("#c_signin_forgot_pwd").find(".c_forgot_pwd_mobile").val().trim();
    if(mobile == "") {
        mobile = $("#c_signin_forgot_pwd").find("#c_forgot_pwd_mobile").val().trim();
    }
    let otp = form.find(".c_otp").val().trim();
    let html = "";
    let error = false;
    
    if(otp == "") {
        error = true; 
        msg.html("OTP Mismatch").show().removeClass("text-muted").addClass("text-danger");
    }

    if(error) {
        msg.html("<i class='fa fa-exclamation'></i> OTP Mismatch!!").removeClass("alert-info").addClass("alert-danger").show().removeClass("text-muted").addClass("text-danger");
    } else {
        let res = await axios.post(HOSTURL+'/customers/verify-otp-signin', {
            otp: otp, 
            mobile: mobile
        });
        if(res.data.status == true) {
            if(res.data.customer_status == 1) {

                if($(this).attr("data-fg-action") == 1) {
                    makeSignin(res);
                } else {
                    // Show Password Reset Wizard
                    $("#c_signin_otp_form").hide();
                    $("#c_signin_reset_password").show();
                }
            } else {
                Notify("<i class='fa fa-check'></i>", "Your account has been deactivated", "danger");
            }
        } else {
            msg.html(res.data.msg).removeClass("alert-info").addClass("alert-info").show();
        }
    }
});

$(document).on('click', '#btn_customer_set_new_pwd', async function (e) {
    let form = $(this).closest(".otp-form ");
    let msg = form.find(".c_msg");
    let otp = $("#c_signin_otp_form").find(".c_otp").val().trim();
    let mobile = $("#c_signin_forgot_pwd").find(".c_forgot_pwd_mobile").val().trim();
    if(mobile == "") {
        mobile = $("#c_signin_forgot_pwd").find("#c_forgot_pwd_mobile").val().trim();
    }
    let pwd = form.find(".c_reset_pwd").val().trim();
    let html = "";
    let error = false;
    
    if(otp == "") {
        error = true; 
        msg.html("OTP Mismatch").show().removeClass("text-muted").addClass("text-danger");
    }

    if(error) {
        msg.html("<i class='fa fa-exclamation'></i> OTP Mismatch!!").removeClass("alert-info").addClass("alert-danger").show().removeClass("text-muted").addClass("text-danger");
    } else {
        let res = await axios.post(HOSTURL+'/customers/save-pwd', {
            otp: otp, 
            mobile: mobile,
            pwd: pwd
        });
        if(res.data.status == true) {
            $("loginModal").modal("hide");
            makeSignin(res);
        } else {
            msg.html(res.data.msg).removeClass("alert-info").addClass("alert-danger").show();
        }
    }
});

$(document).on("click", "#btn-save-customer-info", function () {
    let $profile_wizard = $(this).closest(".profile-info-wizard");
    let data_personal = $profile_wizard.attr("data-personal");
    let data_rs = $profile_wizard.attr("data-rs");

    let data = {};
    data.rs_customer_type = CUR_USER_INFO.rs_customer_type;
    data.c_id = CUR_USER_INFO.unique_customer_id;
    data.data_rs = data_rs;
    data.data_personal = data_personal;

    if(data_personal == 'true') {
        data.name = typeof $profile_wizard.find("#c-name").val() !== "undefined" ? $profile_wizard.find("#c-name").val() : null;
        data.age = typeof $profile_wizard.find("#c-age").val() !== "undefined" ? $profile_wizard.find("#c-age").val() : null;
        data.gender = typeof $profile_wizard.find("#c-gender").val() !== "undefined" ? $profile_wizard.find("#c-gender").val() : null;
    }

    if(data_rs == 'true') {
        data.rs_user_district = $profile_wizard.find("#rs-district-id").val();
        data.rs_user_thana = $profile_wizard.find("#rs-thana-id").val();
        data.rs_user_type = $profile_wizard.find("#rs-user-type").val();
        data.rs_vehicle_type = $profile_wizard.find("#rs-vehicle-type").val();
        data.nid_no = $profile_wizard.find("#c-nid-no").val();
        if(data.rs_user_type == 1 && typeof data.rs_vehicle_type === "undefined") {
            mobiscroll.snackbar({message: 'Please Select Vehicle Type', display: 'top', color: 'danger'});
            return;
        }
    }
    
    if(CUR_USER_INFO !== null) {
        $.ajax({
            method: "post",
            url: "/customers/save-customer-info",
            dataType: "JSON",
            data: data,
            success:function(res) {
                console.log(res);
                if(res.status == true) {
                    mobiscroll.snackbar({message: 'Your data is saved successfully',display: 'top',color: 'success'});
                    CUR_USER_INFO.unique_customer_id = res.customer_id;
                    CUR_USER_INFO.fullname = res.name;
                    CUR_USER_INFO.nid = res.nid;
                    CUR_USER_INFO.user_type = res.user_type;
                    CUR_USER_INFO.rs_customer_type = res.rs_customer_type;
                    CUR_USER_INFO.rs_vehicle_type = res.rs_vehicle_type;
                    CUR_USER_INFO.district_id = res.district_id;
                    CUR_USER_INFO.thana_id = res.thana_id;
                    CUR_USER_INFO.profile_pic = res.profile_pic;
                    localStorage.setItem('curCustomerInfo', JSON.stringify(CUR_USER_INFO));
                    updateCustomerInfoCache();
                    RSDRmakeRequestUI();
                } else {
                    mobiscroll.snackbar({message: res.msg ,display: 'top',color: 'danger'});
                }
            },
            error:function() {
                mobiscroll.snackbar({message: 'Something Went Wrong!!',display: 'top',color: 'danger'});
            }
        });
    } else {
        mobiscroll.snackbar({message: 'Please Login First',display: 'top',color: 'danger'});
    }
});

$(document).on('click', '#topnav-menu-logout-confirm-btn', async function (e) {
    // CUR_USER_INFO = null;
    CUR_USER_INFO.unique_customer_id = null;
    CUR_USER_INFO.fullname = null;
    localStorage.setItem('curCustomerInfo', JSON.stringify(CUR_USER_INFO));
    updateCustomerInfoCache();
    $("#customerlogoutModal").modal('hide');
    Notify("<i class='fa fa-check'></i>", "You have been logged out", "info");
    $(`#${ACTIVE_TAB}`).click();
});

$(document).on('click', '#btn_customer_login_link', async function (e) {
    $('#registrationModal').modal('hide');
    $('#loginModal').modal('show');
});

$(document).on('click', '#btn_customer_registration_link', async function (e) {
    $('#loginModal').modal('hide');
    $('#registrationModal').modal('show');
});

$(document).on('change', ".mrgvt-profile-pic", async function (e) {
    var filereader = new FileReader();
  
    let fileTypes = ['jpg', 'jpeg', 'png']; 
    PROFILE_PIC_FILE = $(this).prop('files')[0];
    filereader.readAsDataURL(PROFILE_PIC_FILE);

    var extension = PROFILE_PIC_FILE.name.split('.').pop().toLowerCase(),  //file extension from input file
    isSuccess = fileTypes.indexOf(extension) > -1;  //is extension in acceptable types
    // console.log();
    // console.log(parseInt(PROFILE_PIC_FILE.size));
    if(isSuccess) {
        if(parseInt(PROFILE_PIC_FILE.size) / (1024 * 1024) <=2) {

            filereader.onload = function(event) {
                PROFILE_PIC_FILE_DATA  = event.target.result;
                // console.log('image width ===== ' + PROFILE_PIC_FILE_DATA.width + 'Image height ===== ' + filereader.result.height);
                document.getElementById("mrgvt-profile-pic-preview").src = filereader.result;
            };
        } else {
            Notify("<i class='fa fa-exclamation'></i>", "File size should be less than 2MB", "danger");
        }
    } else {
        Notify("<i class='fa fa-exclamation'></i>", "Only .jpg, .jpeg, .png is allowed", "danger");
    }
});

$(document).on('click', "#mrgvt-btn-upload-profile-pic", async function (e) {
    let btn = $(this);
    btn.attr("disabled", true);
    $.ajax({
        method:"post",
        url: "/customers/upload-profile-pic",
        dataType:"JSON",
        data:{'filename': PROFILE_PIC_FILE.name, 'file': PROFILE_PIC_FILE_DATA, 'c_id': CUR_USER_INFO.unique_customer_id},
        success:function(response) {
            console.log(response)
            if(response.status == true) {
                Notify("<i class='fa fa-exclamation'></i>", response.msg, "success");
                CUR_USER_INFO.profile_pic = response.filename;
                localStorage.setItem('curCustomerInfo', JSON.stringify(CUR_USER_INFO));
                updateCustomerInfoCache();
            } else {
                Notify("<i class='fa fa-exclamation'></i>", response.msg, "danger");
            }
            btn.removeAttr("disabled");
        },
        error:function() {
            btn.removeAttr("disabled");
            mobiscroll.snackbar({message: 'Image upload failed', display: 'top', color: 'danger'});
        }
    });
});

$(document).on("click", "#topnav-menu-bus", function(e) {
    if(isblockedUINavigation()) {return;}
    $(".header-menu").removeClass("active");
    $(this).addClass("active");
    $("#bus-container").removeClass("d-none").slideDown();
    $("#cc-container").hide();
    $("#rs-container").hide();
    $("#common-container").hide();
    $("#general-container").hide();
    window.history.pushState("", "", '/bus');

    localStorage.setItem("cache_active_tab", "topnav-menu-bus");
});

$(document).on("click", "#topnav-menu-cc", async function(e) {
    loadCCBanner();
    if(isblockedUINavigation()) {return;}
    localStorage.setItem("cache_active_tab", "topnav-menu-cc");
    let $ELEM_CENTERS = $("#elem-centers");
    $ELEM_CENTERS.find(".center-data").empty();
    $(".header-menu").removeClass("active");
    $(this).addClass("active");
    $("#bus-container").hide();
    $("#rs-container").hide();
    $("#common-container").hide();
    $("#general-container").hide();
    $("#cc-container").removeClass("d-none").slideDown();

    window.history.pushState("", "", '/cc');

    await generateCenterInfo2(null);

    _.each(HallIDGrouped, function(center_data, center_id) {
        let $mc = $("#markup-center-list").clone();   
        let no_of_halls = _.size(center_data.hall_data);
        let no_of_halls_html = no_of_halls >= 2 ? `(${no_of_halls} Halls)` : ``;
        let center_name = center_data.center_name + no_of_halls_html;
        $mc.find(".center-name").html(center_name);
        $mc.find(".item-center").attr("data-center-id", center_id);
        $ELEM_CENTERS.find(".center-data").append($mc.html());

        _.each(center_data.hall_data, function(hall_data, hall_id) {
            let $mh = $("#markup-item-hall-public").clone();
            $mh.find(".item-hall").attr("data-hall-id", hall_data.hall_id);
            $mh.find(".item-hall").attr("id", `item-hall-${hall_data.hall_id}`);
            $mh.find(".btn-add-shift").attr("data-center-id", center_id);
            $mh.find(".hall-name").html(hall_data.hall_name);
            $mh.find(".parking").html(hall_data.parking);
            $mh.find(".capacity").html(hall_data.capacity);
            $mh.find(".batch").html(hall_data.batch);
            $mh.find(".area").html(hall_data.area);
            if(no_of_halls <= 1) {
                $mh.find(".hall-name").remove();
            }
            $mc.find(".item-halls").append($mh.html());
            $ELEM_CENTERS.find(`.item-center[data-center-id=${center_id}]`).find(".item-halls").append($mh.html());
            
            $(`.item-hall[data-hall-id=${hall_id}]`).find('.item-rates').empty();
            let rates = ``;
            let rate_list = sp_rate = ``;
            _.each(hall_data["shift_data"], function(shift_data, shift_id) {
                let shift_name = shift_data.shift_name;
                rate_list += `<div class="card p-3 my-2">
                                <h6 class="mb-0 text-site">#${shift_name} Shift </h6>`;
                _.each(shift_data["shift_rates"], function(shift_rates, shift_rate_id) {
                    rates += shift_rates.shift_amount >= 1 ? `${shift_data.shift_name}: ${shift_rates.shift_amount}`: ``;
                    rate_list += shift_rates.rate_start_date ==null || shift_rates.rate_end_date == null ? ``:
                                    `<span class="">${moment(shift_rates.rate_start_date, ["YYYY-MM-DD hh:mm:ss"]).format('MMM Do, YYYY')} 
                                    ~ ${moment(shift_rates.rate_end_date, ["YYYY-MM-DD hh:mm:ss"]).format('MMM Do, YYYY')}
                                    : ${shift_rates.shift_amount} TK. </span>`;
                });
                
                if(shift_data["shift_special_rates"].length >=1) {

                    rate_list += `<h6 class="mb-0">Special Rates</h6>`;
                    _.each(shift_data["shift_special_rates"], function(shift_sp_rates, shift_sprate_id) {
                        console.log(shift_sp_rates)
                        rate_list += shift_sp_rates.special_rate_date == null && shift_sp_rates.special_rate_day == null? `` : 
                        `${moment(shift_sp_rates.special_rate_date, ["YYYY-MM-DD hh:mm:ss"]).format('MMM Do, YYYY')}  ${shift_sp_rates.special_rate_day} ${shift_sp_rates.special_rate_amount} `;
                        
                    });
                }
                rate_list += `</div>`;
            });

            $(`.item-hall[data-hall-id=${hall_id}]`).find(".rates").html(rates);
            $(`.item-hall[data-hall-id=${hall_id}]`).find(".tab-rates").append(rate_list);
            // $(`.item-hall[data-hall-id=${hall_id}]`).find(".tab-rates").append(sp_rate);

            _.each(HALL_IMGS, function(img, i) {
                if(typeof img !== "undefined" && img.length > 0) {
                    img = img[0].img == null || img[0].img == 'null'  ? '/img/no-image.jpg' : `${CC_IMG_DIR_URL}/${img[0].img}`;
                } else {
                    img = '/img/no-image.jpg' ;
                }
                // $(`.item-hall[data-hall-id=${i}]`).find(".hall-thumb").html(`<img class="hall-thumb" src="${img}"/>`);
                $(`.item-hall[data-hall-id=${i}]`).find(".hall-thumb").css(`background-image`, `url(${img})`);
                $(`.item-hall[data-hall-id=${i}]`).find(".hall-thumb").css(`background-size`, `cover`);
            });
        });
    });
    loadHallThumbImages();
});

$(document).on("click", "#topnav-menu-rs", async function(e) {
    loadRSBanner();
    if(isblockedUINavigation()) {return;}
    $(".header-menu").removeClass("active");
    $(this).addClass("active");
    $("#bus-container").hide();
    $("#cc-container").hide();
    $("#common-container").hide();
    $("#general-container").hide();
    $("#rs-container").removeClass("d-none").slideDown();
    window.history.pushState("", "", '/rs');
    localStorage.setItem("cache_active_tab", "topnav-menu-rs");
    if(DISTRICTS == null || DISTRICTS == 'null') {
        await cacheDistricts();
    }
    console.log(CUR_USER_INFO);
    
    if(CUR_USER_INFO !== null && CUR_USER_INFO.unique_customer_id !== null) {
        console.log("CURUSER: " + CUR_USER_INFO.unique_customer_id);
        $("#c-rs-balance").text(CUR_USER_INFO.rs_balance).closest(".row").show();
    } else {
        $("#c-rs-balance").closest(".row").hide();
    }
    // RSDRDailyEntry();
    $("#btn-rs-nav-ot").click();
});

$(document).on("click", "#topnav-menu-profile", async function(e) {
    if(isblockedUINavigation()) {return;}
    if(isLoggedIn()) {
        localStorage.setItem("cache_active_tab", "topnav-menu-profile");
        $("#bus-container").hide();
        $("#cc-container").hide();
        $("#rs-container").hide();
        $("#common-container").removeClass("d-none").show();
        
        let $mrg = $("#markup-rs-dr_get-user-n-vehicle-type").clone();
        $mrg.find(".mrgvt-heading").html(`<i class="fa fa-marker"></i> Change your information`);
        $mrg.removeClass("d-none").removeAttr("id");
        $mrg.attr("data-personal", true);
        $mrg.find(".mrgvt-personal").removeClass("display-none");
        
        if(CUR_USER_INFO.rs_customer_type !== null) {
            $mrg.find(".mrgvt-rs").removeClass("display-none");
            $mrg.attr("data-rs", true);
        } else {
            $mrg.attr("data-rs", false);
        }
        
        $("#common-container #elem-common").html($mrg);
        
        populateDistricts();

        let res = await axios.get(HOSTURL + '/customers/get-my-info', {timeout: 10000, params: {
            c_id: CUR_USER_INFO.unique_customer_id
        }}).then(function(res) {
            let user = res.data.data;
            let $cmn_cntainer = $("#common-container #elem-common");
            if(user !== null) {
                $cmn_cntainer.find("#c-name").val(user.name);
                $cmn_cntainer.find("#c-age").val(user.age);
                $cmn_cntainer.find("#c-gender").val(user.gender);
                
                $cmn_cntainer.find("#rs-district-id").val(user.district_id);
                $cmn_cntainer.find("#rs-user-type").val(user.rs_customer_type);
                if(user.rs_customer_type == 1) {
                    $cmn_cntainer.find("#rs-vehicle-info").show();
                    $cmn_cntainer.find("#rs-vehicle-type").val(user.rs_vehicle_type);
                }
                $cmn_cntainer.find("#c-nid-no").val(user.nid);
                getThanas(user.district_id);
                $cmn_cntainer.find("#rs-thana-id").val(user.thana_id);
                if(user.profile_pic == null) {
                    if(ENV == "WEB") {
                        $cmn_cntainer.find("#mrgvt-profile-pic-preview").attr("src", "/img/profile_pic.jpg");
                    } else {
                        $cmn_cntainer.find("#mrgvt-profile-pic-preview").attr("src", "file:///android_asset/profile_pic.jpg");
                    }
                } else {
                    $cmn_cntainer.find("#mrgvt-profile-pic-preview").attr("src", "/img/customers/" + user.profile_pic);
                }
            }
        });
        return true;
        
    } else {
        showLoginPopup();
    }
});

function validateEmail(email) {
    let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateName(name) {
    let regName = /^[a-zA-Z]+$/;
    return regName.test(String(name));
}

function validateMobile(name) {
    let regName = /^\+?(88)?0?1[3456789][0-9]{8}\b$/; 
    return regName.test(String(name));
}

async function resendRegOTP() {
    let form = $(this).closest(".otp-form");
    let msg = form.find(".c_msg");
    let mobile = $("#loginModal").find("#c_mobile").val().trim();
    if(mobile.trim() == "") {
        mobile = $("#c_signup_form").find(".c_mobile").val().trim();
    }
    msg.html(`<i class="fa fa-spinner fa-spin"></i> Sending an OTP to your mobile`).removeClass("alert-danger").addClass("alert-info").show();
    $('#registrationModal').animate({ scrollTop: 0 }, 'slow');
    $("#resend_reg_otp_container").html("OTP is sent to your phone. You can send again in 30s later");
    let res = await axios.post(HOSTURL+'/customers/send-otp', {
        mobile: mobile
    });
    if(res.data.status == true) {
       
        setTimeout(function() {
            $("#resend_reg_otp_container").html(`<a href="javasrcipt:void(0)" id="btn_reg_resend_otp">Resend OTP</a>`);
        }, 30000);
    } else {
        // signup_msg.html(res.data.msg).removeClass("alert-info").addClass("alert-info").show();
    }
}

function resetRegistrationModal() {
    $("#c_signup_otp_form").hide();
    $("#c_signup_data_form").show();
    $("#c_signup_msg").hide();
    $("#c_signup_otp_msg").hide();
    $('#btn_customer_signup').removeAttr('disabled');
}

function resetLoginModal() {
    $("#c_signin_form").show();
    $("#c_signin_forgot_pwd").hide();
    $("#c_login_msg").hide();
    $("#c_signin_otp_form").hide();
    $("#c_signin_reset_password").hide();
    // $("#c_signup_forgot_pwd_msg").hide();
}

function makeSignin(res) {
    if(res.data.status == true) {
        $("#c_mobile").val("");
        $("#c_pwd").val("");
        html = "Login Successful..";
        Notify("<i class='fa fa-check'></i>", "Signin Successful", "info");
        $("#loginModal").modal('hide');
        CUR_USER_INFO.unique_customer_id = res.data.customer_id;
        CUR_USER_INFO.fullname = res.data.name;
        CUR_USER_INFO.nid = res.data.nid;
        CUR_USER_INFO.user_type = res.data.user_type;
        CUR_USER_INFO.rs_customer_type = res.data.rs_customer_type;
        CUR_USER_INFO.rs_vehicle_type = res.data.rs_vehicle_type;
        CUR_USER_INFO.rs_balance = res.data.rs_balance;
        CUR_USER_INFO.district_id = res.data.district_id;
        CUR_USER_INFO.thana_id = res.data.thana_id;
        CUR_USER_INFO.profile_pic = res.data.profile_pic;
        localStorage.setItem('curCustomerInfo', JSON.stringify(CUR_USER_INFO));
        updateCustomerInfoCache();
        $(`#${ACTIVE_TAB}`).click();
    } else {
        html = "Wrong Username / Password";
        Notify("<i class='fa fa-check'></i>", html, "danger");
    }
}

async function cacheDistricts() {
    let res = await axios.get(HOSTURL + '/rs-daily/get-districts-thanas', {timeout: 10000}).then(function(res) {
        if(res.data.status) {
            DISTRICTS = res.data.data.dlist;
            THANAS = _.groupBy(res.data.data.tlist, 'district_id');
        } else {
            // Notify
        }
    });
}

async function getThanas(district_id) {
    let thanas = THANAS[district_id];
    $(".dd-thanas").empty();
    $(".dd-thanas").append(`<option value=''>Select Your Thana</option>`);
    _.each(thanas, function(thana, i){
        let r = `<option value='${thana.id}'>${thana.name}</option>`;
        $(".dd-thanas").append(r);
    });

    return;

    let res = await axios.get(HOSTURL + '/rs/get-thanas', {timeout: 10000, params: {
        district_id : district_id
    }}).then(function(res) {
        if(res.data.status) {
            let thanas = res.data.data;
            $("#rs-container #elem-rs #rs-thana-id").empty();
            $("#rs-container #elem-rs #rs-thana-id").append(`<option value=''>Select Your Thana</option>`);
            _.each(thanas, function(thana, i){
                let r = `<option value='${thana.id}'>${thana.name}</option>`;
                $("#rs-container #elem-rs #rs-thana-id").append(r);
            });
        } else {
            // Notify
        }
    });
}

function loadCCBanner() {
    $cc_banner = $("#cc-banner-section");
    let loaded = $cc_banner.attr("data-loaded");
    if(loaded == 'false') {
        if(ENV == "WEB") {
            $cc_banner.css("background-image", 'url("/img/cc/cc-banner.jpg")');
        } else {
            $cc_banner.css("background-image", 'url("file:///android_asset/cc-banner.jpg")');
        }
        $cc_banner.attr("data-loaded", "true");
    }
}

function loadRSBanner() {
    $rs_banner = $("#rs-banner-section");
    let loaded = $rs_banner.attr("data-loaded");
    if(loaded == 'false') {
        if(ENV == "WEB") {
            $rs_banner.css("background-image", 'url("/img/rs/rs-banner.jpg")');
        } else {
            $rs_banner.css("background-image", 'url("file:///android_asset/rs-banner.jpg")');
        }
        $rs_banner.attr("data-loaded", "true");
    }
}

function loadFooterBanner() {
    $f_banner = $("#footer-banner-section");
    let loaded = $f_banner.attr("data-loaded");
    if(loaded == 'false') {
        if(ENV == "WEB") {
            $f_banner.css("background-image", 'url("/img/city-bg.jpeg")');
        } else {
            $f_banner.css("background-image", 'url("file:///android_asset/city-bg.jpeg")');
        }
        $f_banner.attr("data-loaded", "true");
    }
}

function updateCustomerInfoCache() {
    
    let cache_curUserInfo = localStorage.getItem(CACHE_NAME);

    if(CACHE_NAME == 'curCustomerInfo') {
        if(cache_curUserInfo == null ) {
            localStorage.setItem(CACHE_NAME, JSON.stringify(CUR_USER_INFO));
        } else {
            $("#cur-user-info").val(cache_curUserInfo);
        }
    }

    CUR_USER_INFO = JSON.parse($("#cur-user-info").val())
    console.log(CUR_USER_INFO)

    // console.log("CUR USER: " + CUR_USER_INFO.unique_customer_id);
    // For Public site
    if(isLoggedIn()) {
        let name = CUR_USER_INFO.fullname !== null ? CUR_USER_INFO.fullname.slice(0,11) : "";
        $("#topnav-customer-name").html(CUR_USER_INFO.fullname !== null && CUR_USER_INFO.fullname.length > 11 ? `${name}..` : name);
        $("#topnav-menu-signInUp").hide();
        $("#topnav-menu-registration").hide();
        $("#topnav-menu-login").hide();
        // $("#topnav-avatar").show();
        $("#topnav-menu-modal-signinout").hide();
        $("#topnav-menu-profile, #topnav-menu-settings, #topnav-ticket-purchase-history-btn, #topnav-menu-logout").show();
        if(CUR_USER_INFO.profile_pic == null) {
            console.log(ENV);
            if(ENV == "WEB") {
                $("#profile_pic_thumb img").attr("src", "/img/profile_pic.jpg");
            } else {
                $("#profile_pic_thumb img").attr("src", "file:///android_asset/profile_pic.jpg");
            }
        } else {
            if(ENV == "WEB") {
                $("#profile_pic_thumb img").attr("src", "/img/customers/" + CUR_USER_INFO.profile_pic);
            } else {
                $("#profile_pic_thumb img").attr("src", HOSTURL+ "/img/customers/" + CUR_USER_INFO.profile_pic);
            }
        }
    } else {
        $("#topnav-customer-name").html("Login/Signup");
        $("#topnav-menu-registration").show();
        $("#topnav-menu-login").show();
        // $("#topnav-avatar").hide();
        $("#topnav-menu-modal-signinout").show();
        $("#topnav-menu-profile, #topnav-menu-settings, #topnav-ticket-purchase-history-btn, #topnav-menu-logout").hide();
        console.log(ENV);
        if(ENV == "WEB") {
            $("#profile_pic_thumb img").attr("src", "/img/profile_pic.jpg");
        } else {
            $("#profile_pic_thumb img").attr("src", "file:///android_asset/profile_pic.jpg");
        }
    }
    $("#profile_pic_thumb").show();
}

// function getLatLng() {
//     return new Promise(async function(resolve, reject) {
//         let positionInfo = null;
//         if(navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(function(position) {
//                 positionInfo = {"lat": position.coords.latitude, "lng": position.coords.longitude};
//                 // console.log(positionInfo)
//                 // return positionInfo;
//             });
//         } else {
//             alert("Sorry, your browser does not support HTML5 geolocation.");
//             // return null;
//         }
//         resolve(positionInfo);
//     });
// }


function autocomplete(inp, arr, callback) {
    var currentFocus = 0;

    $(document).on("input", `#${inp}`, function(e) {
        var a, b, i, val = $(this).val();
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", $(this).attr('id') + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        $(this).parent().append(a);

        for (i = 0; i < arr.length; i++) {
            if (arr[i].display_name.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].display_name.substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].display_name.substr(val.length);
                b.innerHTML += `<input type='hidden' data-index = '${i}' value='${arr[i].display_name}'data-lat="${arr[i].lat}" data-lon="${arr[i].lon}">`;
                b.addEventListener("click", function(e) {
                    console.log("clicked");
                    let x = this.getElementsByTagName("input")[0];
                    let index = x.getAttribute("data-index");
                    $(`#${inp}`).val(x.value);
                    $(`#${inp}`).attr("data-index", index);
                    eval(`${callback}(${index})`);
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });

    $(document).on("keydown", `#${inp}`, function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (e.keyCode == 40) { //down
            currentFocus++;
            if(currentFocus >= $(x).find("div").length) currentFocus = $(x).find("div").length;
            addActive(x);
        } else if (e.keyCode == 38) { //up
            currentFocus--;
            if(currentFocus <= 1) currentFocus = 1;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) $(x).find(`div:nth-child(${currentFocus})`).click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        console.log(currentFocus);
        if (currentFocus >= x.length) currentFocus = 1;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        $(x).find(`div:nth-child(${currentFocus})`).addClass("autocomplete-active");
    }

    function removeActive(x) {
        $(x).find("div").removeClass("autocomplete-active")
    }

    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}
  
async function reverseGeoCode(lat, lng) {
    let nominatim = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    axios.get(nominatim).then(resp => {
        console.log(resp.data);
    });
    // let res = await axios.get(nominatim, {timeout: 10000}).then(function(res) {
    //     console.log(res);
    // });
}

function getCoordinates() {
    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function setUserLocation() {
    return new Promise(async function(resolve, reject) {
        try {
            let position = await getCoordinates();
            USER_LOCATION.lat = position.coords.latitude;
            USER_LOCATION.lng = position.coords.longitude;
            resolve(true);
        } catch (err) {
            resolve(err);
        }
    });
}

function isLoggedIn() {
    return CUR_USER_INFO !== null && CUR_USER_INFO.user_type == 2 && CUR_USER_INFO.unique_customer_id !== null ? true : false;
}

function showLoginPopup() {
    setTimeout(function () {
        $("#loginModal").modal('show');
    }, 500);
}