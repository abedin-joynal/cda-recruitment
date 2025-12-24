var SEAT_STATUS = {
    "0": { "status": "Processing", "class": "s-processing", "callback": "processing" },
    "1": { "status": "Available", "class": "s-available", "callback": "available" },
    "2": { "status": "Sold(M)", "class": "s-sold-male", "callback": "soldMale" },
    "3": { "status": "Sold(F)", "class": "s-sold-female", "callback": "soldFemale" },
    "4": { "status": "Booked(M)", "class": "s-booked-male", "callback": "bookedMale" },
    "5": { "status": "Booked(F)", "class": "s-booked-female", "callback": "bookedFemale" },
    "6": {"status": "Blocked", "class": "s-blocked", "callback" : "blocked"},
};

let COACH_STATUS = {
    "-1": "Removed", "0": "Inactive", "1": "Up Coming", "2": "On Going", "3": "Complete"
};

var COACH_LIST_CONTAINER = $("#coach-list-container");
let TICKET_LIST_CONTAINER = $("#ticket-list-container");
let CONFIRMED_TICKETS_CONTAINER = $("#confirmed-tickets-container");
let FINAL_TICKET_CONTAINER = $("#final-ticket-container");


$(function() {
    populateCoachCompleteModal();
    setMobiscrollDate($('.date-only'), new Date());

    $(document).on('keyup', '#from-venue', function() {
        emptyFromVenue();
    });

    $(document).on('keyup', '#to-venue', function() {
        emptyToVenue();
    });

    $('#from-venue').autoComplete({
        minChars: 1,
        source: function(term, suggest) {
            term = term.toLowerCase();
            var suggestions = [];
            for ( i = 0; i < VENUES['venues'].length; i++ ) {
                if (~VENUES['venues'][i].venue_name.toLowerCase().indexOf(term)) suggestions.push(VENUES['venues'][i]);
            }
            for ( i = 0; i < VENUES['districts'].length; i++ ) {
                if (~VENUES['districts'][i].venue_name.toLowerCase().indexOf(term)) suggestions.push(VENUES['districts'][i]);
            }
            
            suggest(suggestions);
        },
        renderItem: function (item, search) {
            // console.log(item)
            search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
            return '<div class="autocomplete-suggestion" data-venue-id="' + item.venue_id+'" data-venue-name="'+item.venue_name+'" data-venue-type="'+item.type+'">'+item.venue_name.replace(re, "<b>$1</b>")+'</div>';
        },
        onSelect: function(e, term, item) {
            // console.log(item);
            $('#from-venue').val(item.data('venue-name'));
            $('#from-venu-id').val(item.data('venue-id'));
            $('#from-venu-type').val(item.data('venue-type'));
            // console.log('Item "'+item.data('langname')+' ('+item.data('lang')+')" selected by '+(e.type == 'keydown' ? 'pressing enter or tab' : 'mouse click')+'.');
            // $('#advanced-demo').val(item.data('langname')+' ('+item.data('lang')+')');
        }
    });

    $('#to-venue').autoComplete({
        minChars: 1,
        source: function(term, suggest) {
            term = term.toLowerCase();
            var suggestions = [];
            for ( i = 0; i < VENUES['venues'].length; i++ ) {
                if (~VENUES['venues'][i].venue_name.toLowerCase().indexOf(term)) suggestions.push(VENUES['venues'][i]);
            }
            // for ( i = 0; i < VENUES['thanas'].length; i++ ) {
            //     if (~VENUES['thanas'][i].venue_name.toLowerCase().indexOf(term)) suggestions.push(VENUES['thanas'][i]);
            // }
            for ( i = 0; i < VENUES['districts'].length; i++ ) {
                if (~VENUES['districts'][i].venue_name.toLowerCase().indexOf(term)) suggestions.push(VENUES['districts'][i]);
            }
            
            suggest(suggestions);
        },
        renderItem: function (item, search){
            // console.log(item)
            search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
            return '<div class="autocomplete-suggestion" data-venue-id="' + item.venue_id+'" data-venue-name="'+item.venue_name+'" data-venue-type="'+item.type+'">'+item.venue_name.replace(re, "<b>$1</b>")+'</div>';
        },
        onSelect: function(e, term, item) {
            // console.log(item);
            $('#to-venue').val(item.data('venue-name'));
            $('#to-venu-id').val(item.data('venue-id'));
            $('#to-venu-type').val(item.data('venue-type'));
            // console.log('Item "'+item.data('langname')+' ('+item.data('lang')+')" selected by '+(e.type == 'keydown' ? 'pressing enter or tab' : 'mouse click')+'.');
            // $('#advanced-demo').val(item.data('langname')+' ('+item.data('lang')+')');
        }
    });
    
    jQuery.fn.extend({
        removeAllSeatClasses: function () {
            var $elem = this;
            _.each(SEAT_STATUS, function (element, index, list) {
                $elem.removeClass(element.class);
            });
            return $elem;
        },
        uncheck: function () {
            return this.each(function () { this.checked = false; });
        }
    });

    mobiscroll.setOptions({
        locale: mobiscroll.localeEn,  // Specify language like: locale: mobiscroll.localePl or omit setting to use default
        theme: 'material',                 // Specify theme like: theme: 'ios' or omit setting to use default
        themeVariant: 'light'     // More info about themeVariant: https://docs.mobiscroll.com/5-18-3/datetime#opt-themeVariant
    });

    $('#filter-departure-date').mobiscroll().datepicker({
        controls: ['date'],
        //display: 'bottom',
        onChange: function (event, inst) {  }
    });

    /* GPS & Location Tracking */
    let company_id = JSON.parse($("#cur-user-info").val()).company_id;
    let initial_coords = [23.7104, 90.40744];
    CUR_LAT = initial_coords[0];
    CUR_LNG = initial_coords[1];
    init_map('osm-map', initial_coords);

});

function setMobiscrollDate($this, dt) {
    setTimeout(function() {
        $this.mobiscroll('setVal', dt);
    }, 1000);
}

function preferenceNPermissionManagement() {
    $(".coach-element").each(function() {
        // $(this).find(".confirmation_type").html(CONFIRMATION_TYPE_HTML);
        // console.log(CONFIRMATION_TYPE_HTML);
        try {
            let rp = JSON.parse($(this).attr("data-route-preference"));
            console.log(CUR_USER_INFO.user_type);
            
            if(CUR_USER_INFO.user_type == 2) {
                // $(this).hide();
                $(this).find(".confirmation_type").hide();
            }
            if(CUR_USER_INFO.user_type == 2 && rp.vehicle_tracking.customers.status == true) { // customers
                $(this).find(".btn_vehicle_location").show();
            }
            if(CUR_USER_INFO.user_type == 1 && CUR_USER_INFO.permissions['gps-full-control'] && rp.vehicle_tracking.staffs == true) {
                $(this).find(".btn_vehicle_location").show();
            }
        } catch(error) {
            console.log(error);
        }
    });
}

// async function pollSeats() {
//     try {
//         let res = await axios.get(HOSTURL+'/coaches/poll-seats');
//         console.log(res.data);
//         pollSeats();
//         seatStateChanger.update(res.data);
//     } catch (err) {
//         let timeout = 0;
//         if(navigator.onLine) {
//             timeout = 1000;
//         } else {
//             timeout = 10000;
//         }
//         // setTimeout(function () { /*@TODO: Remove comments */
//         //     pollSeats();
//         // }, timeout);
//     }
// }

function generateSeatLayout(orientation) {
    let number_to_letter = {1 : "A", 2 : "B", 3 : "C", 4 : "D", 5 : "E", 6: "F", 7: "G", 8: "H", 9: "I", 10: "J"};
    if(orientation !== null) {
        orientation = JSON.parse(orientation);
        let rows = orientation.rows;
        let columns = orientation.columns;
        let cac = orientation.coridor_after_column;
        let middle_seat = "no";
        let crs = 'custom_rows' in orientation ? orientation.custom_rows : null;
        console.log(crs);
        var html = '';
        for(let i = 1; i <= rows; i++) {
            let column_letter = number_to_letter[i];
            let seat_type = "regular";
            html += `<div class="row"><div class="col-md-12">`;
            if(crs !== null && i in crs) {
                let c_columns = crs[i].columns;
                let c_cac = crs[i].coridor_after_column;
                let middle_seat = crs[i].middle_seat;
                // console.log(c_cac);
                seat_type = crs[i].seat_type;
                html += generateColumns(c_columns, c_cac, middle_seat, seat_type, column_letter);
            } else {
                html += generateColumns(columns, cac, middle_seat, seat_type, column_letter);
            }
            html += `</div></div>`;
        }
        return html;
    }
}

function generateColumns(columns, cac, middle_seat, seat_type, column_letter) {
    let html = "";
    if (cac !== null ) {
        html += `<div class="left-side float-left">`;
        for (let l = 1; l <= cac; l++) {
            let seat_no = column_letter + l;
            html += `<div class="seat s-available float-left ${seat_no} d-flex " data-seat-no="${seat_no}" data-seat-type="${seat_type}" data-seat-status="1">
                        <span class="seat-symbol"><div class="upper">${seat_no}</div><div class="lower"></div></span>
                    </div>`;
        }
        html += `</div>`;

        html += `<div class="right-side float-right">`;
        for (let r = columns; r >= parseInt(cac) + 1; r--) {
            let seat_no = column_letter + r;
            html += `<div class="seat s-available float-right ${seat_no} d-flex " data-seat-no="${seat_no}" data-seat-type="${seat_type}" data-seat-status="1">
                        <span class="seat-symbol"><div class="upper">${seat_no}</div><div class="lower"></div></span>
                    </div>`;
        }
        html += `</div>`;
    } else {
        // let center = Math.ceil(columns / 2);
        // let left_count = parseInt(center) - 1;
        let center = middle_seat;
        let left_count = parseInt(middle_seat - 1) ;

        html += `<div class="left-side float-left">`;
        for (let l = 1; l <= left_count; l++) {
            let seat_no = column_letter + l;
            html += `<div class="seat  s-available float-left ${seat_no} d-flex " data-seat-no="${seat_no}" data-seat-type="${seat_type}" data-seat-status="1">
                <span class="seat-symbol"><div class="upper">${seat_no}</div><div class="lower"></div></span>
            </div>`;
        }
        html += `</div>`;

        let seat_no = column_letter + center;
        html += `<div class="middle-seat float-left d-flex ">`;
        html += `<div class="seat s-available ${seat_no} d-flex " data-seat-no="${seat_no}" data-seat-type="${seat_type}" data-seat-status="1">
            <span class="seat-symbol"><div class="upper">${seat_no}</div><div class="lower"></div></span>
            </div>`;
        html += `</div>`;

        html += `<div class="right-side float-right">`;
        for (let r = columns; r > parseInt(center); r--) {
            let seat_no = column_letter + r;
            html += `<div class="seat  s-available float-right ${seat_no} d-flex " data-seat-no="${seat_no}" data-seat-type="${seat_type}" data-seat-status="1">
            <span class="seat-symbol"><div class="upper">${seat_no}</div><div class="lower"></div></span>
            </div>`;
        }
        html += `</div>`;
    }
    return html;
}

function toggle($elem) {
    if ($elem.hasClass("d-none")) {
        $elem.removeClass('d-none').show();
    } else {
        $elem.addClass('d-none').hide();
    }
}

function passengerInfoErrorHtml(error) {
    let html = "";
    _.each(error, function (e, index, list) {
        html += `${e}, `;
    });
    html += "";
    return html.substring(0, html.length - 2);
}

function validatePassengerInfo(psngr_name, psngr_age, psngr_gender, psngr_mobile, psngr_start_counter_id, psngr_end_counter_id) {
    let error = {};
    let name_regex = /^[a-zA-Z ]{2,30}$/;
    let age_regex = /^[0-9]{1,5}$/;
    let mobile_regex = /^[01][0-9]{8,10}$/;

    if (!name_regex.test(psngr_name)) {
        error.psngr_name = "Name must be letters only with at least 2 characters";
    }
    if (!age_regex.test(psngr_age)) {
        error.psngr_age = "Age must be numbers only with at least 1 digits";
    }
    if (!mobile_regex.test(psngr_mobile)) {
        error.psngr_mobile = "Mobile must be numbers only with at least 1 digits";
    }
    if(psngr_gender == "") {
        error.psngr_gender = "Gender is mendatory";
    }
    if(psngr_start_counter_id == "") {
        error.psngr_start_counter_id = "Start counter is mendatory";
    }
    if(psngr_end_counter_id == "") {
        error.psngr_end_counter_id = "End counter is mendatory";
    }
    return error;
}

// function generateConfirmationTypeHTML() {
//     /* Generate Confirmation Types */
//     let ct_html = `<option value="">Select</option>`;
//     let x = 1;
//     console.log("Confirmation Types: ", CONFIRMATION_TYPES)
//     _.each(CONFIRMATION_TYPES, function (ct, index) {
//         let selected = x == 1 ? "selected" : "";
//         ct_html += `<option ${selected} value='${ct.value}'>${ct.label}</option>`;
//         x++;
//     });
//     return ct_html;
// }

function generateConfirmationTypeMarkup(route_preference) {
    console.log(CONFIRMATION_TYPES)
    let ct_html = ``;
    CONFIRMATION_TYPES.forEach(
        item => {
            ct_html += `<option value="${item.value}">${item.label}</option>`
        }
    )
    return ct_html;

    CONFIRMATION_TYPES.each(function(ct){
        console.log(ct);
    });
    
    return;
    // let rf = JSON.parse(route_preference);
    // console.log("RF: ", CONFIRMATION_TYPES);
    // let sale = rf.sale;
    // let reservation = rf.reservation;
    // /* Generate Confirmation Types */
    // let ct_html = "";
    // // let ct_html = `<option value="">Select</option>`;
    // if(sale) {
    //     ct_html += `<option value='sale'>Sale</option>`;
    // }
    // if(reservation) {
    //     ct_html += `<option value='book'>Reservation</option>`;
    // }
    return ct_html;
}

function generateVenusDropdownHTML(VENUES) {
    
}

function calculateCouterWiseFare($coach_elem) {
    let route_preference = JSON.parse($coach_elem.attr("data-route-preference"));

    let $scfi = $coach_elem.find(".start-counter-fare-info");
    let $ecfi = $coach_elem.find(".end-counter-fare-info");
    let route_id = $coach_elem.attr('data-route-id');
    let company_id = $coach_elem.attr('data-company-id');
    let s_counter_id = $coach_elem.find(".psngr_start_counter_id").val();
    let e_counter_id = $coach_elem.find(".psngr_end_counter_id").val();

    let fare_r = 0;
    let fare_b = 0;
    if(COUNTERS[route_id][company_id]) {
        let s_counters = COUNTERS[route_id][company_id][0]; // Boarding Counters
        let shtml = '';
        if(s_counters.length > 0) {
            _.each(s_counters, function (counter) {
                if(counter.counter_id == s_counter_id) {
                    fare_r = route_preference.fare.regular - counter.regular_fare;
                    fare_b = route_preference.fare.business - counter.business_fare;
                    // let fare_deducted_r = counter.regular_fare !== 0 ? `<div class=''>Regular: ${counter.regular_fare} Tk. Less </div>`: ""; 
                    // let fare_deducted_b = counter.business_fare !== 0 ? `<div class=''>Business: ${counter.business_fare} Tk. Less </div>`: "";
                    // shtml = fare_deducted_b + fare_deducted_r;
                }
            });
            // $scfi.html(shtml);
        }

        let e_counters = COUNTERS[route_id][company_id][1]; // Dropping Counters
        // console.log(e_counters);
        let ehtml = '';
        if(e_counters.length > 0) {
            _.each(e_counters, function (counter) {
                if(counter.counter_id == e_counter_id) {
                    fare_r = fare_r == 0 ? route_preference.fare.regular - counter.regular_fare : fare_r - counter.regular_fare;
                    fare_b = fare_b == 0 ? route_preference.fare.business - counter.business_fare : fare_b - counter.business_fare;
                    
                    // let fare_deducted_r = counter.regular_fare !== 0 ? `Regular : ${counter.regular_fare} Tk. `: "";
                    // let fare_deducted_b = counter.business_fare !== 0 ? `Business :${counter.business_fare} Tk. `: "";
                    // ehtml = fare_deducted_b + fare_deducted_r;
                }
            });
            // $ecfi.html(ehtml);
        }
        
        fare_r = fare_r !== 0 ? fare_r : route_preference.fare.regular;
        fare_b = fare_b !== 0 ? fare_b : route_preference.fare.business;
        $coach_elem.attr("data-fare-regular", fare_r);
        $coach_elem.attr("data-fare-business", fare_b);

        let d_fare_html = ""; // deducted fare
        d_fare_html += fare_r !== 0 ? `<div>Regular: ${fare_r} Tk. </div>` : "";
        d_fare_html += fare_b !== 0 ? `<div>Business: ${fare_b} Tk. </div>` : "";
        $ecfi.html(d_fare_html);

        // seatStateChanger.recalibrateSelectedSeatFares($coach_elem);
    } else {
        console.log("Something went wrong: No counter is associated to this route & company");
    }
}

function pickPsngrSuggestion(elem) {
    let $coach_elem = elem.closest(".coach-element");
    let $active = $coach_elem.find(".psngr_suggestion").find(".active");
    $coach_elem.find(".psngr_mobile").val($active.attr("data-mobile-no"))
    $coach_elem.find(".psngr_name").val($active.attr("data-name"))
    $coach_elem.find(".psngr_age").val($active.attr("data-age"))
    $coach_elem.find(".psngr_gender").val($active.attr("data-gender"))
}

async function refreshCoachSeats($this, refresh_only) {
    $(".couterwise-seats-container").addClass('d-none').hide();
    $(".seats-container").hide();
    $(".vehicle-location-container").hide();
    let $coach_elem = $this.closest(".coach-element");
    let $seat_container = $coach_elem.find(".seats-container");
    let $seat_map = $coach_elem.find(".seats-map");
    if ($coach_elem.attr("data-seat-plotted") == 0) {
        let seat_orientation_json = $coach_elem.attr("data-seat-orientation");
        let seat_orientation_html = generateSeatLayout(seat_orientation_json);
        $seat_map.html(seat_orientation_html);
        $coach_elem.attr("data-seat-plotted", 1);
    }
    /* Prepend Preloader */
    let seat_preloader = `<div class="seat-preloader col-md-12">
                            <div class="">
                                <i class="fas fa-circle-notch fa-spin"></i> Loading..
                            </div>
                        </div>`;
    $seat_map.prepend(seat_preloader);
    $seat_map.css('opacity', "0.8");
    /* Prepend Preloader */

    let expanded = $coach_elem.attr("data-expanded");
    if (expanded == 0 || refresh_only) {
        $coach_elem.attr("data-expanded", 1);
        $seat_container.show();
        /* Get updated data from server */
        let coach_id = $coach_elem.attr("data-coach-id");
        seatStateChanger.emptySelectedList($coach_elem);
        let res = await axios.post(HOSTURL+'/coaches/get-seat-info-by-coach-id/', {
            coach_id: coach_id
        });
        $coach_elem.attr("data-seat-info", JSON.stringify(res.data));
        /* Get updated data from server */
        // seatStateChanger.recalibrateSelectedSeatFares($coach_elem);
        seatStateChanger.update($coach_elem, res.data);
    } else {
        $coach_elem.attr("data-expanded", 0);
        $seat_container.hide();
        seatStateChanger.releaseAllSelectedSeats();
    }
    /* Recalibrate Selected Seats*/

    // let seat_info = $coach_elem.attr("data-seat-info");
    // plotSeatInfo($seat_map, seat_info);
    let $c_type = $coach_elem.find(".passenger-info-form").find(".confirmation_type");
    $c_type.html(generateConfirmationTypeMarkup($coach_elem.attr("data-route-preference")));
    if(CUR_USER_INFO.user_type == 1) {
        $c_type.closest('fieldset').show();
    } else {
        $c_type.closest('fieldset').hide();
    }

    /* Remove Preloader */
    $seat_map.find('.seat-preloader').remove();
    $seat_map.css('opacity', "1");
}

$(document).on('click', '.btn_seat_view', async function () {
    refreshCoachSeats($(this).closest(".coach-element"), false);
});

$(document).on('click', '.btn-refresh-seat', async function () {
    refreshCoachSeats($(`.coach-element[data-expanded="1"]`), true);
});

$(document).on('click', '.seat', async function (e) {
    // console.log(CUR_USER_INFO)
    e.stopPropagation();
    // if( C_PERMISSION !== null && !C_PERMISSION.perm_booking_or_sale) /*@TODO: REMOVE after dependency checking */
    //     return; // Return if sale/booking permission is absent
    let $seat = $(this);
    let $coach_elem = $(this).closest(".coach-element");
    let coach_id = $coach_elem.attr("data-coach-id");
    let route_preference = JSON.parse($coach_elem.attr("data-route-preference"));
    let seat_no = $seat.attr("data-seat-no");
    let seat_status = $seat.attr("data-seat-status");
    let seat_type = $seat.attr("data-seat-type");
    let new_status = seat_status == 0 ? 1 : 0;
    let occupying_user_id = CUR_USER_INFO.id;
    let occupying_user = CUR_USER_INFO.fullname;
    let occupying_counter = CUR_USER_INFO.counter_id;
    let occupying_user_type = CUR_USER_INFO.user_type ; 
    let occupassion_start_time =  null;
    let occupying_customer_id = CUR_USER_INFO.unique_customer_id;
    
    $coach_elem.find(".seats-map .seat").css("pointer-events", "none");
    if ((CUR_USER_INFO.user_type == 1 && CUR_USER_INFO.id !== null) || 
        (isLoggedIn())) {
        if (seat_status == 1 || seat_status == 0) { /* Available or Selected */
            
            if(route_preference.fare[seat_type] == null) {
                console.error("Route Preference for this seat type is not found");
                Notify("<i class='fa fa-exclamation'></i>", "Seat can not be selected (Route Preference issue)!", "danger");
                return;
            }
            // $seat.addClass("blink-bg");
            $seat.find('span').addClass("animate__animated animate__swing animate__infinite infinite");
            axios.get(HOSTURL+'/coaches/occupy-unoccupy-seat', {timeout: 10000, params: {
                seat_status: new_status, 
                seat_no: [seat_no], 
                coach_id: coach_id, 
                occupying_user_id: occupying_user_id, 
                occupying_user: occupying_user, 
                occupying_counter: occupying_counter, 
                occupassion_start_time : occupassion_start_time, 
                occupying_user_type: occupying_user_type, 
                occupying_customer_id : occupying_customer_id  /*@TODO: occupying counter fix */
            }}).then(function(res) {
                if (!res.data.status) {
                    Notify("<i class='fa fa-exclamation'></i>", res.data.msg, "danger");
                } else {

                }
                $coach_elem.attr("data-seat-info", JSON.stringify(res.data.seat_info));
                seatStateChanger.update($coach_elem, res.data.seat_info);
                $seat.find('span').removeClass("animate__animated animate__swing animate__infinite infinite");
            });
            
        } else if(seat_status == 4 || seat_status == 5) { /* Booked */
             Notify("<i class='fa fa-check'></i>", "Seats are booked", "info");
        } else {
            console.error("Only Available seats can be modified");
            Notify("<i class='fa fa-check'></i>", "Only Available seats can be modified", "info");
        } 
    } else {
        Notify("<i class='fa fa-check'></i>", "Please login to select seat", "info");
        showLoginPopup();
    }
    $coach_elem.find(".seats-map .seat").css("pointer-events", "auto");
});

$(document).on('click', '#filter-submit-btn', async function () {
    if(isblockedUINavigation()) {return;}
    $("#general-container").hide();
    await getCoachList();
    preferenceNPermissionManagement();
});

// $(document).on('click', '.confirm-seat-n-print-modal-btn', async function (e) {
//     e.stopPropagation();
//     e.preventDefault();
//     confirmSeats($(this), true); 
//     // $("#ticketModal").modal("show");
//     ACTIVE_TICKET = $(this);
// });

$(document).on('click', '.proceed-payment-btn', async function (e) {
});

$(document).on('click', '.seats-container', function (e) {
    e.stopPropagation();
});

$(document).on('keyup', '.psngr_mobile', async function (e) {
    return;
    let $coach_elem = $(this).closest(".coach-element");
    let $list_group = $coach_elem.find(".list-group");
    let $psngr_suggestion_container = $coach_elem.find(".psngr_suggestion_container");
    let $list_group_items = $psngr_suggestion_container.find(".list-group-item");
    if(e.keyCode !== 38 && e.keyCode !== 40 && e.keyCode !== 13 ) {
        let data = "";
        let res = await axios.post(HOSTURL+'/coaches/get-passenger-suggestion', {
            mobile : $(this).val()
        });
        if(res.data == null) {
            data = "";
        } else {
            let i = 0;
            _.each(res.data, function(d) {
                let active = i == 0 ? "active" : "";
                data += `<a class="list-group-item psngr_suggestion_item rounded-0 ${active}" 
                            data-toggle="list" href="javascript:void(0)" 
                            data-mobile-no="${d.psngr_mobile}" data-name="${d.psngr_name}" data-age="${d.psngr_age}" data-gender="${d.psngr_gender}"
                            >${d.psngr_name} <span class="float-right"><i class="fa fa-mobile"></i> ${d.psngr_mobile}</a></span>`;
                i++;
            });
        }
        $coach_elem.find(".psngr_suggestion").html(data).show().css("width", $(this).width());
        // $coach_elem.find(".psngr_suggestion").html(data).show();
    }

    if (e.keyCode == 13) { // enter
        pickPsngrSuggestion($(this));
        $coach_elem.find(".psngr_suggestion").hide();
    }

    if (e.keyCode == 38) { // up
        console.log($list_group_items.length)
        if($list_group_items.length !== 1) { /*@TODO : Issue .list-group-item-count results to 2 when there is actuallu 1 */
            let selected = $list_group.find(".active");
            $list_group_items.removeClass("active");
            let $next_selected;
            if (selected.prev().length == 0) {
                $next_selected = selected.siblings().last();
            } else {
                $next_selected = selected.prev();
            }
            $next_selected.addClass("active");
            // $psngr_suggestion_container.scrollTop( $next_selected.offset().top );
        }
    }

    if (e.keyCode == 40) { // down
        if($list_group_items.length !== 1) {
            let selected = $list_group.find(".active");            
            $list_group_items.removeClass("active");
            let $next_selected;
            if (selected.next().length == 0) {
                $next_selected = selected.siblings().first();
            } else {
                $next_selected = selected.next();
            }
            $next_selected.addClass("active");
            // $psngr_suggestion_container.scrollTop( $next_selected.offset().top );
        }
    }
});

$(document).on('mouseover', ".psngr_suggestion_item", async function (e) {
// $(".psngr_suggestion.list-group-item").mouseover(function() {
    $(".psngr_suggestion_item").removeClass("active");
    $(this).addClass("active");
});

$(document).on('click', ".psngr_suggestion_item", async function (e) {
    pickPsngrSuggestion($(this));
    let $coach_elem = $(this).closest(".coach-element");
    $coach_elem.find(".psngr_suggestion").hide();
});

$(document).on('change', ".psngr_start_counter_id, .psngr_end_counter_id", function (e) {
    let $coach_elem = $(this).closest(".coach-element");
    calculateCouterWiseFare($coach_elem)
});

$(document).on("click", ".btn_vehicle_location", async function() {
    $(".couterwise-seats-container").addClass('d-none').hide();
    $(".seats-container").hide();
    $(".vehicle-location-container").addClass("d-none").hide();
    let $coach_elem = $(this).closest(".coach-element");
    $coach_elem.find(".vehicle-location-container").removeClass("d-none").show();
    let gps_device_id = $coach_elem.attr("data-gps-device-id");
    let coach_id = $coach_elem.attr("data-coach-id");
    let r = await getLatestDeviceLocation(false, initial_coords, gps_device_id, false, false, 0, true);
   
    if(r.status == true) {
        $("#osm-map").css("border", "1px solid black");
        $MAP_CONTAINER = $("#osm-map");
        $("#osm-map").remove();
        $coach_elem.find(".vehicle-location-container div").empty();
        $coach_elem.find(".vehicle-location-container div").html($MAP_CONTAINER);      
        MAP.invalidateSize();

    } else {
        $coach_elem.find(".vehicle-location-container div").html(`<div class="alert alert-site"><i class="fa fa-exclamation-circle"></i> Location data is not available for this vehicle</div>`);
    }
});
/* GPS & Location Tracking */

$('#datepicker1').datetimepicker({
    format: 'L',
    defaultDate: new Date(),
});

function emptyFromVenue() {
    $('#from-venu-id').val('null');
    $('#from-venu-type').val('null');
}

function emptyToVenue() {
    $('#to-venu-id').val('null');
    $('#to-venu-type').val('null');
}

window.addEventListener("beforeunload", function (e) {
    // *********** perform database operation here
    // before closing the browser ************** //
    // seatStateChanger.releaseAllSelectedSeats();
    // added the delay otherwise database operation will not work
    // for (var i = 0; i < 500000000; i++) { }
    // return undefined;
});