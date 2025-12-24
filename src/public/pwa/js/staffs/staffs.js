// var SERVER = "http://119.18.147.183:3000/";
//var SERVER = "http://192.168.0.17:3000/";
var SERVER = "";
var $AVATAR_PANEL = $("#nav-item-avatar-panel");
var $SIDEBAR_TOGGLE = $("#sidebarToggleTop");
var $SIDEBAR_NAV = $("#sidebar-navigation-panel");
var $LOGGEDINUSERNAME = $("#loggedin-user-name");
var $ELEM_SIGNIN = $("#elem-signin");
var $ELEM_DASH = $("#elem-dash");
var $ELEM_TRIPS = $("#elem-trips");
var $ELEM_TRIPS = $("#elem-trips");
var $ELEM_PAYMENT = $("#elem-payment");
var $MARKUP_C_ITEM = $("#markup-coachlist-item");
var $MARKUP_TICKET_LI = $("#markup-ticket-li");
var $PILLS_ONGOING = $("#pills-ongoing");
var $PILLS_UPCOMING = $("#pills-upcoming");
var $PILLS_COMPLETED = $("#pills-completed");
var ELEM_BTN_PASSENGER_DETAILS = ".btn_passenger_details";
var SPINNER = '<div class="spinner-grow text-info" role="status"><span class="sr-only">Loading...</span></div>';
var $ALERT_SIGNIN = $("#alert-signin");
var $NAV_TRIPS = $("#nav-trips");
var $NAV_DASH = $("#nav-dash");
var $NAV_PAYMENT = $("#nav-payment-dues");
var CACHE_NAME = "curStaff";

/* Get loggedin stafff info from cache */
var CUR_STAFF = localStorage.getItem(CACHE_NAME) == null || localStorage.getItem(CACHE_NAME) == "null" ? null : localStorage.getItem(CACHE_NAME);
// console.log(CUR_STAFF);

if(CUR_STAFF == null || CUR_STAFF == 'null') {
    showLoggedoutUI();
} else {
    showLoggedinUI();
}

$(document).on('click', '#btn-signin', async function (e) {
    let mobile = $("#form-signin .mobile").val();
    let pwd = $("#form-signin .password").val();

    let res = await axios.post(SERVER + '/staffs/signin', {
        mobile: mobile,
        pwd: pwd
    });

    if(res.data.status == true) {
        localStorage.setItem(CACHE_NAME, JSON.stringify(res.data));
        CUR_STAFF = JSON.stringify(res.data);
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
    $ELEM_DASH.removeClass('d-none');
    $ELEM_TRIPS.addClass('d-none');
    $ELEM_PAYMENT.addClass('d-none');
    $ELEM_DASH.find(".card-body").find(".row").hide();
    $ELEM_DASH.find(".card-body").append(SPINNER);
    $(".nav-item").removeClass("active");
    $(this).closest(".nav-item").addClass("active");
	if(CUR_STAFF !== null && CUR_STAFF !== "null") {
		let res = await axios.post(SERVER + '/staffs/getStaffDashData', {
			id: JSON.parse(CUR_STAFF).id
		});
		// console.log(res.data.data[0].total_trx);
		$ELEM_DASH.find("#lifetime-completed-trips").html(res.data.lifetime_completed_trips[0].lifetime_completed_trips);
		$ELEM_DASH.find("#lifetime-trip-earnings").html(res.data.lifetime_trip_earnings[0].lifetime_trip_earnings);
		$ELEM_DASH.find("#lifetime-trip-due").html(res.data.lifetime_trip_due[0].lifetime_trip_due);
		$ELEM_DASH.find(".card-body").find(".row").show();
		$ELEM_DASH.find(".card-body").find(".spinner-grow").remove();
	}
});

$NAV_TRIPS.click(async function() {
    $ELEM_DASH.addClass('d-none');
    $ELEM_PAYMENT.addClass('d-none');
    $ELEM_TRIPS.removeClass('d-none');
    $PILLS_UPCOMING.html(SPINNER);
    $PILLS_ONGOING.html(SPINNER);
    $PILLS_COMPLETED.html(SPINNER);
    $(".nav-item").removeClass("active");
    $(this).closest(".nav-item").addClass("active");
	if(CUR_STAFF !== null && CUR_STAFF !== "null") {
		let res = await axios.post(SERVER + '/staffs/getCoachesByStaffID', {
			id: JSON.parse(CUR_STAFF).id
		});

		$PILLS_UPCOMING.empty();
		$PILLS_ONGOING.empty();
		$PILLS_COMPLETED.empty();

		if(res.data.status == true) {
			let coaches = res.data.coaches;
			// console.log(coaches);
			_.each(coaches, function (coach) {
				populateCoachListMarkup(coach); 
			});
			
			if($PILLS_UPCOMING.find(".coachlist-item").length <= 0 ) {$PILLS_UPCOMING.html("<div class='alert alert-site'>No Upcoming Coach Found</div>")}
			if($PILLS_ONGOING.find(".coachlist-item").length <= 0 ) {$PILLS_ONGOING.html("<div class='alert alert-site'>No Ongoing Coach Found</div>")}
			if($PILLS_COMPLETED.find(".coachlist-item").length <= 0 ) {$PILLS_COMPLETED.html("<div class='alert alert-site'>No Completed Coach Found</div>")}

		} else {

		}
	}
});

$NAV_PAYMENT.click(async function() {
    $ELEM_DASH.addClass('d-none');
    $ELEM_TRIPS.addClass('d-none');
    $ELEM_PAYMENT.removeClass('d-none');
    $(".nav-item").removeClass("active");
    $(this).closest(".nav-item").addClass("active");
    $ELEM_PAYMENT.find(".card-body").append(SPINNER);
    await getStaffsDueTrips(JSON.parse(CUR_STAFF).id);
    $(".spinner-grow").remove();

});


$(document).on('click', ELEM_BTN_PASSENGER_DETAILS, async function (e) {
    
    let cuid = $(this).closest(".coachlist-item").attr("data-coach-unique-id");
    let $C_MARKUP = $(this).closest(".coachlist-item");
    
    let seats_sold = 0;
    $(".ct-table").empty();
    let res = await axios.get('/coach-report/details-report', {timeout: 10000, params: {
            coach_id: parseInt(cuid)
        }}).then(function(res) {
            console.log(res.data.status)
            console.log(res.data)

            if(res.data.status) {
                let data = res.data.data;
                data =  _.filter(res.data.data, function(item){ return item.ticket_status == 1; });
                if(data.length >= 1 ) {
                    data = _.groupBy(data, 'issuing_counter_name');
                    _.each(data, function(items, counter_name) {
                        let x = `<tr><td rowspan="${items.length + 2}">${counter_name}</td></tr>`;
                        $C_MARKUP.find(".ct-table").append(x);
                        let c_total_amount = c_total_seats = 0;
                        _.each(items, function(item, index) {
                            if(item.ticket_status == 1) {
                                c_total_amount += parseInt(item.amount);
                                c_total_seats += parseInt(item.no_of_seats);
                                td =`<td>${item.seats}</td>
                                    <td>${item.amount}</td>
                                    <td><b>Start:</b> ${item.customer_s_c_name}<br>
                                        <b>End:</b> ${item.customer_e_c_name}
                                    </td>
                                    <td>${moment(item.issue_time).format("Do MMM, YYYY HH:MM A")}</td>
                                    <td><b>Customer Info:</b> <br>
                                        <b>Name:</b>${item.customer_name}
                                        <b>Age:</b>${item.customer_age}
                                        <b>Mobile:</b><a href="tel:${item.customer_mobile}">${item.customer_mobile}</a>
                                    </td>`;
                                let tr = `<tr>${td}</tr>`
                                $C_MARKUP.find(".ct-table").append(tr);
                            }
                        });
                        seats_sold += parseInt(c_total_seats);
                        let tr = `<tr>
                                    <td>Total Seats: ${c_total_seats}</td>
                                    <td colspan="4">Total: ${c_total_amount}</td>
                                </tr>`
                        $C_MARKUP.find(".ct-table").append(tr);
                    });
                } else {
                    $C_MARKUP.find(".ct-table").append(`<tr><td colspan="10"><div class="alert alert-site">No Data Found</div></td></tr>`);
                }
            } else {
                $C_MARKUP.find(".ct-table").append(`<tr><td colspan="10"><div class="alert alert-site">No Data Found</div></td></tr>`);
            }
    });
});

$NAV_DASH.click(function() {
    $ELEM_TRIPS.addClass('d-none');
    $ELEM_PAYMENT.addClass('d-none');
    $ELEM_DASH.removeClass('d-none');
});

function populateCoachListMarkup(coach) {
    let is_ac = coach.is_ac == 1 ? 'AC' : 'Non AC';
    let departure_time = moment(coach.departure_time, 'hh:mm:ss').format('hh:mm A')
    let markup = $MARKUP_C_ITEM.find(".coachlist-item").clone();
    markup.removeClass("d-none");
    markup.attr("data-coach-unique-id", coach.unique_id);
    markup.find(".coach-info .coach_unique_id").html(coach.unique_id);
    markup.find(".coach-info .departure_time").html(departure_time);
    markup.find(".coach-info .departure_date").html(coach.departure_date);
    markup.find(".coach-info .s_counter").html(coach.s_counter);
    markup.find(".coach-info .e_counter").html(coach.e_counter);
    markup.find(".coach-info .is_ac").html(is_ac);
    markup.find(".coach-info .coach_code").html(coach.code);
    markup.find(".coach-info .bus_no").html(coach.license_plate_no);
    markup.find(".coach-info .supervisor_name").html(coach.supervisor);
    markup.find(".coach-info .supervisor_mob").html(coach.supervisor_mobile);
    markup.find(".coach-info .driver_name").html(coach.driver);
    markup.find(".coach-info .driver_mob").html(coach.driver_mobile);
    markup.find(".coach-info .helper_name").html(coach.helper);
    markup.find(".coach-info .helper_mob").html(coach.helper_mobile);
    if(coach.status == 1) { // upcoming coach
        $PILLS_UPCOMING.append(markup);
    } else if (coach.status == 2) {
        $PILLS_ONGOING.append(markup);
    } else if (coach.status == 3) {
        $PILLS_COMPLETED.append(markup);
    }
}

function showLoggedinUI() {
    $ELEM_SIGNIN.addClass('d-none');
    $SIDEBAR_TOGGLE.removeClass('d-none');
    $AVATAR_PANEL.removeClass('d-none');
    $SIDEBAR_NAV.removeClass('d-none');
    $ELEM_DASH.removeClass('d-none');
    $LOGGEDINUSERNAME.html(JSON.parse(CUR_STAFF).name);

    $NAV_DASH.click();
}

function showLoggedoutUI() {
    $ELEM_SIGNIN.removeClass('d-none');
    $SIDEBAR_TOGGLE.addClass('d-none');
    $AVATAR_PANEL.addClass('d-none');
    $SIDEBAR_NAV.addClass('d-none');
    $ELEM_DASH.addClass('d-none');
    $ELEM_TRIPS.addClass('d-none');
}

$(document).ready(function() {
    if(CUR_STAFF !== null && CUR_STAFF !== 'null') {
        console.log(CUR_STAFF);
        $NAV_DASH.click();
    }
});


$(document).on('click', '.nav-item', async function (e) {
    $(".navbar-nav").addClass("toggled");
    
});