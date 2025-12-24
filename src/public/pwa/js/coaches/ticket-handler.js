
var ticketHandler = {};

ticketHandler.paginate = function() {
    
};

$(document).on('click', '.couter-wise-list-container li', function (e) {
    e.stopPropagation();
    toggle($(this).find(".counter-wise-list-data"));
});

$(document).on('click', '.btn_counterwise_view', async function (e) {
    e.stopPropagation();
    $(".seats-container").hide();
    $(".vehicle-location-container").hide();
    let $coach_elem = $(this).closest(".coach-element");
    let $couterview_container = $coach_elem.find(".couterwise-seats-container");
    generateCounterWiseView($coach_elem);
    toggle($couterview_container);
});

$(document).on('click', '.btn-confirm-booking', async function (e) {
    e.stopPropagation();
    let $coach_elem = $(this).closest(".coach-element");
    let ticket_id = $(this).attr("data-ticket-id");
    let coach_id = $(this).attr("data-coach-id");
    // let coach_id = $coach_elem.attr("data-coach-id");
    if (confirm('Are you sure you want confirm this booking?')) {
        let res = await axios.post(HOSTURL+'/tickets/confirm-ticket-booking', {
            ticket_id: ticket_id,
            coach_id: coach_id
        });
        if(res.data.status) {
            $coach_elem.attr("data-counter-view", 0);
            Notify("<i class='fa fa-check'></i>", "Booking confirmed", "info");
            generateCounterWiseView($coach_elem);
            $("#ticket-search-submit-btn").click(); // Used while in ticket module.
        } else {
            Notify("<i class='fa fa-exclamation'></i>", res.data.msg, "danger");
        }
    } else {

    }
});

$(document).on('click', '.btn-cancel-booking', async function (e) {
    e.stopPropagation();
    let $coach_elem = $(this).closest(".coach-element");
    let ticket_id = $(this).attr("data-ticket-id");
    let coach_id = $(this).attr("data-coach-id");
    if (confirm('Are you sure you want cancel this booking?')) {
        let res = await axios.post(HOSTURL+'/tickets/cancel-ticket-booking', {
            ticket_id: ticket_id,
            coach_id: coach_id
        });
        if(res.data.status) {
            $coach_elem.attr("data-counter-view", 0);
            Notify("<i class='fa fa-check'></i>", "Seat booking cancelled", "info");
            generateCounterWiseView($coach_elem);
            $("#ticket-search-submit-btn").click(); // Used while in ticket module.
        } else {
            Notify("<i class='fa fa-exclamation'></i>", res.data.msg, "danger");
        }
    } else {

    }
});

$(document).on('click', '.btn-cancel-selling', async function (e) {
    e.stopPropagation();
    let $coach_elem = $(this).closest(".coach-element");
    let ticket_id = $(this).attr("data-ticket-id");
    let coach_id = $(this).attr("data-coach-id");
  
    if (confirm('Are you sure you want cancel this ticket?')) {
        let res = await axios.post(HOSTURL+'/tickets/cancel-ticket-selling', {
            ticket_id: ticket_id,
            coach_id: coach_id
        });

        if(res.data.status) {
            // $coach_elem.attr("data-counter-view", 0);
            Notify("<i class='fa fa-check'></i>", "Seat cancellation successful", "info");
            generateCounterWiseView($coach_elem);
            $("#ticket-search-submit-btn").click(); // Used while in ticket module.
            $(`#tr_${ticket_id}`).remove(); // Used while in ticket module.
        } else {
            Notify("<i class='fa fa-exclamation'></i>", res.data.msg, "danger");
        }
    } else {
    
    }
});

$(document).on("click", ".confirmed-tickets-view-btn", async function(e) {
    let $coach_elem = $(this).closest(".coach-element");
    // $coach_elem.hide();

    let $selected_seat_list = $coach_elem.find(".selected-seat-list");
    let $selected_seat_lis = $selected_seat_list.find(".selected-seat-li");
    let ssl = [];
    if ($selected_seat_lis.length <= 0) {
        Notify("<i class='fa fa-exclamation'></i>", "Please Select At least 1 seat", "danger");
        return;
    }
    let seat_nos = "";
    $selected_seat_lis.each(function () {
        ssl.push([$(this).attr("data-seat-no"), $(this).attr("data-fare")]);
        seat_nos += $(this).attr("data-seat-no") + ",";
    });

    let coach_id = $coach_elem.attr("data-coach-id");
    let $psngr_info_container = $coach_elem.find(".passenger-info-container");
    let confirmation_type = $psngr_info_container.find('.confirmation_type').val();
    let psngr_name = $psngr_info_container.find('.psngr_name').val();
    let psngr_mobile = $psngr_info_container.find('.psngr_mobile').val();
    let psngr_age = $psngr_info_container.find('.psngr_age').val();
    let psngr_gender = $psngr_info_container.find('.psngr_gender').val();
    let psngr_start_counter_name = $psngr_info_container.find('.psngr_start_counter_id').find('option:selected').text();
    let psngr_end_counter_name = $psngr_info_container.find('.psngr_end_counter_id').find('option:selected').text();
    let psngr_start_counter_id = $psngr_info_container.find('.psngr_start_counter_id').val();
    let psngr_end_counter_id = $psngr_info_container.find('.psngr_end_counter_id').val();
    let error = validatePassengerInfo(psngr_name, psngr_age, psngr_gender, psngr_mobile, psngr_start_counter_id, psngr_end_counter_id);

    if(Object.keys(error).length == 0) {
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_company_name").html($coach_elem.find(".company_name").html());
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_journey_date_time").html($coach_elem.find(".departure_date").html() + $coach_elem.find(".departure_time").html());
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_seat_nos").html(seat_nos);
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_boarding").html(psngr_start_counter_name);
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_dropping").html(psngr_end_counter_name);
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_p_name").html(psngr_name);
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_p_mobile").html(psngr_mobile);
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_p_age").html(psngr_age);
        CONFIRMED_TICKETS_CONTAINER.find("#ctl_p_gender").html(psngr_gender);
        CONFIRMED_TICKETS_CONTAINER.find(".confirm-ticket-btn").html("Confirm").removeAttr("disabled");
        $("#ctl_coach_id").val(coach_id);

        TICKET_LIST_CONTAINER.hide();
        COACH_LIST_CONTAINER.hide();
        CONFIRMED_TICKETS_CONTAINER.show();
        $('html, body').animate({
            scrollTop: $("#confirmed-tickets-container").offset().top
        }, 500);
    } else {
        error = passengerInfoErrorHtml(error);
        Notify("", error, "danger");
        // $coach_elem.find(".confirm-seat-status").removeClass("d-none").removeClass("alert-success").addClass("alert-success").html(error);
    }
});

$(document).on("click", "#topnav-ticket-purchase-history-btn", async function(e) {
    if(isblockedUINavigation()) {return;}
    $("#topnav-menu-bus").click();
    let TICKET_LIST_ElEMENTS = TICKET_LIST_CONTAINER.find("#ticket-list-elements");
    COACH_LIST_CONTAINER.hide();
    TICKET_LIST_CONTAINER.show();
    // CUR_USER_INFO.id
    let preloader = `<div class="col-md-12 my-auto mx-auto">
                        <i class="fas fa-circle-notch fa-spin"></i> Loading Tickets..
                    </div>`;
    
    TICKET_LIST_ElEMENTS.html(`<div class='alert alert-site h-100 p-36 m-0 text-center'> ${preloader} </div>`);
    let res = {};
    try {
        res = await axios.post(HOSTURL+'/tickets/get-all-tickets-by-customer-id', {
            requester: CUR_USER_INFO
        });    
    } catch(err) {
        TICKET_LIST_ElEMENTS.html(`<div class='alert alert-site h-100 p-36 m-0'> <i class='fa fa-exclamation-triangle'></i> &nbsp &nbsp Could not load history. Something went wrong!!!! </div>`);
        return;
    }

    $('html, body').animate({
        scrollTop: TICKET_LIST_ElEMENTS.offset().top+50
    }, 500);

    TICKET_LIST_ElEMENTS.empty();
    let tickets = res.data.tickets;

    if(tickets.length >=1) {
        for (let i in tickets) {
            let $tem = $("#ticket-history-element-markup").clone(); // tem = ticket element markup
            let t = tickets[i];
            let issued_by = t.issuing_user_type == 1 ? t.issuing_user_name: t.issuing_customer_name;
            t.coach_status = COACH_STATUS[t.coach_status];
            t.is_ac = t.is_ac == 1 ? 'AC': 'Non AC';
            t.ticket_status = t.ticket_status == 1 ? 'ACTIVE': 'INACTIVE';
            t.customer_gender = t.customer_gender == 'M' ? 'Male': 'Female';
            t.departure_time = moment(t.departure_time, ["HH:mm:ss"]).format("h:mm A");
            t.departure_date = moment(t.departure_date, ["YYYY-MM-DD"]).format("MMM Do, YYYY");
            t.issue_time = moment(t.issue_time, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YYYY');
            $tem.find(".departure_time").html(t.departure_time);
            $tem.find(".arrival_time").html(t.arrival_time);
            $tem.find(".company_name").html(t.company_name);
            $tem.find(".route_name").html(t.route_name);
            $tem.find(".is_ac").html(t.is_ac);
            $tem.find(".ticket_status").html(t.ticket_status);
            $tem.find(".coach_status").html(t.coach_status);
            $tem.find(".ticket_unique_id").html(t.ticket_unique_id);
            $tem.find(".coach_unique_id").html(t.coach_unique_id);
            $tem.find(".coach_code").html(t.coach_code);
            $tem.find(".customer_name").html(t.customer_name);
            $tem.find(".customer_mobile").html(t.customer_mobile);
            $tem.find(".customer_age").html(t.customer_age);
            $tem.find(".customer_gender").html(t.customer_gender);
            $tem.find(".start_counter").html(t.start_counter);
            $tem.find(".end_counter").html(t.end_counter);
            $tem.find(".fare").html(t.fare);
            $tem.find(".seats").html(t.seats);
            $tem.find(".issue_time").html(t.issue_time); 
            $tem.find(".issued_by").html(issued_by); 
            $tem.find(".departure_date").html(t.departure_date);
            $tem.find(".btn_print_ticket_preview").attr("data-id", t.ticket_id);
            TICKET_LIST_ElEMENTS.append($tem);
        }
    } else {
        TICKET_LIST_ElEMENTS.html(`<div class='alert alert-site h-100 p-36 m-0'> No Ticket Found </div>`);
    }
    
});

// ticket-list-container
$(document).on("click", "#ticket-list-container .go-back", function(e) {
    COACH_LIST_CONTAINER.hide();
    TICKET_LIST_CONTAINER.hide();
    // TICKET_LIST_CONTAINER.hide();
    CONFIRMED_TICKETS_CONTAINER.hide();
    FINAL_TICKET_CONTAINER.hide();
    $('html, body').animate({
        scrollTop: $(`.coach-element[data-expanded="1"]`).offset().top-20
    }, 500);
});

$(document).on("click", "#confirmed-tickets-container .go-back", function(e) {
    COACH_LIST_CONTAINER.show();
    CONFIRMED_TICKETS_CONTAINER.hide();
    FINAL_TICKET_CONTAINER.hide();
    $('html, body').animate({
        scrollTop: $(`.coach-element[data-expanded="1"]`).offset().top-20
    }, 500);
});

$(document).on("click", "#final-ticket-container .go-back", function(e) {
    $("#filter-submit-btn").click();
});

$(document).on("click", ".btn_print_ticket_preview", function(e) {
    let ticket_id = $(this).attr("data-id");
    TICKET_LIST_CONTAINER.hide();
    COACH_LIST_CONTAINER.hide();
    CONFIRMED_TICKETS_CONTAINER.hide();
    FINAL_TICKET_CONTAINER.show();

    showFinalTicket(ticket_id);
});

$(document).on('click', '.payment-ticket-btn', function (e) {
    // confirmTicket();
    $(".seats-container").hide();
    $(".coach-element").attr("data-expanded", 0);
    $(".payment-ticket-btn").attr("disabled", true);
    $(this).closest(".payment-buttons-container").find("#payment-msg").html(`<i class="fas fa-spinner fa-spin"></i> &nbsp Redirecting to payment gateway..`);
    // $(this).attr("disabled", true).html('<i class="fas fa-circle-notch fa-spin"></i>');
    let pg = $(this).attr("data-pg");
    confirmTicket(pg);
});

/* @TODO: Move to admin_panel js */
$(document).on('click', '.confirm-ticket-btn', async function (e) {
    e.stopPropagation();
    e.preventDefault();
    $(this).attr("disabled", true).html("Confirming Ticket.. Please Wait...");
    let pg = null;
    confirmTicket(pg);
});
/* @TODO: Move to admin_panel js */

$(document).on('click', '.ticket-print-btn', async function (e) {
    e.stopPropagation();
    e.preventDefault();
    if($("#input-checkbox-pos-print").prop('checked')) {
        printDiv("pos-ticket");
    } else {
        printDiv("ticket");
    }
});

$(document).on('change', '#input-checkbox-pos-print', function (e) {
    if(this.checked) {
        $("#ticket-container").find('#ticket').hide();
        $("#ticket-container").find('#pos-ticket').show();
    } else {
        $("#ticket-container").find('#ticket').show();
        $("#ticket-container").find('#pos-ticket').hide();
    }
});

// async function confirmTicket(print_ticket) {
//     let ctl_coach_id = $.trim($("#ctl_coach_id").val());
//     let $coach_elem = $(`.coach-element[data-coach-id=${ctl_coach_id}]`);
//     let $selected_seat_list = $coach_elem.find(".selected-seat-list");
//     let $selected_seat_lis = $selected_seat_list.find(".selected-seat-li");
//     let ssl = [];
//     if ($selected_seat_lis.length <= 0) {
//         Notify("<i class='fa fa-exclamation'></i>", "Please Select At least 1 seat", "danger");
//         return;
//     }
//     $selected_seat_lis.each(function () {
//         ssl.push([$(this).attr("data-seat-no"), $(this).attr("data-fare")]);
//     });
//     let coach_id = $coach_elem.attr("data-coach-id");
//     let $psngr_info_container = $coach_elem.find(".passenger-info-container");
//     let confirmation_type = $psngr_info_container.find('.confirmation_type').val();
//     // console.log($psngr_info_container.find('.confirmation_type').val());
//     let psngr_name = $psngr_info_container.find('.psngr_name').val();
//     let psngr_mobile = $psngr_info_container.find('.psngr_mobile').val();
//     let psngr_age = $psngr_info_container.find('.psngr_age').val();
//     let psngr_gender = $psngr_info_container.find('.psngr_gender').val();
//     let psngr_start_counter_id = $psngr_info_container.find('.psngr_start_counter_id').val();
//     let psngr_end_counter_id = $psngr_info_container.find('.psngr_end_counter_id').val();

//     if(confirmation_type == '') {
//         Notify("<i class='fa fa-exclamation'></i>", "Please Select Reservation or Sale", "danger");
//         return;
//     }
//     let error = validatePassengerInfo(psngr_name, psngr_age, psngr_gender, psngr_mobile, psngr_start_counter_id, psngr_end_counter_id);
//     if(Object.keys(error).length == 0) {
//         let res = await axios.post(HOSTURL + '/tickets/confirm-tickets', {
//             coach_id: coach_id,
//             selected_seats: ssl,
//             confirmation_type: confirmation_type,
//             psngr_name: psngr_name,
//             psngr_mobile: psngr_mobile,
//             psngr_age: psngr_age,
//             psngr_gender: psngr_gender,
//             psngr_start_counter_id: psngr_start_counter_id,
//             psngr_end_counter_id: psngr_end_counter_id,
//             issued_by: CUR_USER_INFO.user_type == 1 ? CUR_USER_INFO.id : CUR_USER_INFO.unique_customer_id,
//             issuing_user_type: CUR_USER_INFO.user_type, 
//             counter_id: CUR_USER_INFO.counter_id
//         });

//         if (res.data.status == true) {
//             // let h = "Seat Confirmation was successfull";
//             FINAL_TICKET_CONTAINER.find(".alert").html(`<i class="fa fa-check"></i> Ticket Confirmation Successfull`).show();
//             showFinalTicket(res.data.newTicketId);
//             COACH_LIST_CONTAINER.hide();
//             CONFIRMED_TICKETS_CONTAINER.hide();
//             FINAL_TICKET_CONTAINER.show();
//             seatStateChanger.resetPassengerInfo($coach_elem);
//         } else {
//             Notify("", res.data.msg, "danger");
//         }
//     } else {
//         error = passengerInfoErrorHtml(error);
//         Notify("", error, "danger");
//         // $coach_elem.find(".confirm-seat-status").removeClass("d-none").removeClass("alert-success").addClass("alert-success").html(error);
//     }
// }

async function confirmTicket(pg) {
    let ctl_coach_id = $.trim($("#ctl_coach_id").val());
    let $coach_elem = $(`.coach-element[data-coach-id=${ctl_coach_id}]`);
    let $selected_seat_list = $coach_elem.find(".selected-seat-list");
    let $selected_seat_lis = $selected_seat_list.find(".selected-seat-li");
    let ssl = [];
    if ($selected_seat_lis.length <= 0) {
        Notify("<i class='fa fa-exclamation'></i>", "Please Select At least 1 seat", "danger");
        return;
    }
    $selected_seat_lis.each(function () {
        ssl.push([$(this).attr("data-seat-no"), $(this).attr("data-fare")]);
    });
    let coach_id = $coach_elem.attr("data-coach-id");
    let $psngr_info_container = $coach_elem.find(".passenger-info-container");
    let confirmation_type = $psngr_info_container.find('.confirmation_type').val();
    let psngr_name = $psngr_info_container.find('.psngr_name').val();
    let psngr_mobile = $psngr_info_container.find('.psngr_mobile').val();
    let psngr_age = $psngr_info_container.find('.psngr_age').val();
    let psngr_gender = $psngr_info_container.find('.psngr_gender').val();
    let psngr_start_counter_id = $psngr_info_container.find('.psngr_start_counter_id').val();
    let psngr_end_counter_id = $psngr_info_container.find('.psngr_end_counter_id').val();

    if(confirmation_type == '') {
        Notify("<i class='fa fa-exclamation'></i>", "Please Select Reservation or Sale", "danger");
        return;
    }
    let error = validatePassengerInfo(psngr_name, psngr_age, psngr_gender, psngr_mobile, psngr_start_counter_id, psngr_end_counter_id);
    if(Object.keys(error).length == 0) {
        BLOCKALLNAVIGATION.status = true;
        BLOCKALLNAVIGATION.msg = `Payment in Progress. Please do not reload browser.`;
        let res = await axios.post(HOSTURL + '/tickets/confirm-tickets', {
            pg: pg,
            coach_id: coach_id,
            selected_seats: ssl,
            confirmation_type: confirmation_type,
            psngr_name: psngr_name,
            psngr_mobile: psngr_mobile,
            psngr_age: psngr_age,
            psngr_gender: psngr_gender,
            psngr_start_counter_id: psngr_start_counter_id,
            psngr_end_counter_id: psngr_end_counter_id,
            issued_by: CUR_USER_INFO.user_type == 1 ? CUR_USER_INFO.id : CUR_USER_INFO.unique_customer_id,
            issuing_user_type: CUR_USER_INFO.user_type, 
            counter_id: CUR_USER_INFO.counter_id
        });
        BLOCKALLNAVIGATION.status = false;
        if (res.data.status == true) {
            if(res.data.issuing_user_type == 1) { // Counters
                let h = "Seat Confirmation was successful";
                FINAL_TICKET_CONTAINER.find(".alert").html(`<i class="fa fa-check"></i> Ticket Confirmation Successful`).show();
                showFinalTicket(res.data.newTicketId);
                COACH_LIST_CONTAINER.hide();
                CONFIRMED_TICKETS_CONTAINER.hide();
                FINAL_TICKET_CONTAINER.show();
            } else { // Public Customers`
                let pgr = res.data.pg_response;
                if(pgr.statusCode == "0000") {
                    location.href = pgr.bkashURL;
                } else {
                    Notify("", "Could not redirect to payment gateway", "danger");
                }
            }
            seatStateChanger.resetPassengerInfo($coach_elem);
        } else {
            Notify("", res.data.msg, "danger");
        }
    } else {
        error = passengerInfoErrorHtml(error);
        Notify("", error, "danger");
        // $coach_elem.find(".confirm-seat-status").removeClass("d-none").removeClass("alert-success").addClass("alert-success").html(error);
    }
}

async function generateCounterWiseView($coach_elem) {
    let $couterview_container = $coach_elem.find(".couterwise-seats-container");
    let coach_id = $coach_elem.attr('data-coach-id');
    let res = await axios.post(HOSTURL+'/tickets/get-all-tickets-by-coach-id', { /*@TODO: Remove the request dependency */
        coach_id: coach_id,
        requester: CUR_USER_INFO
    });
    let counter_seats = res.data;
    let html = "";
    if(!_.isEmpty(counter_seats)) {
        html = `<div class="card col-md-12 p-0">`;
        html += `<ul class="list-group list-group-flush couter-wise-list-container">`;

        _.each(counter_seats, function (cs, counter_id) {
            let issuing_counter_name = (cs.issuing_counter_name !== null && cs.issuing_counter_name !=="null"
                                        && cs.issuing_counter_name !== "NULL") ? cs.issuing_counter_name : "Online Ticket";
            html += `<li class="list-group-item " > ${issuing_counter_name}`;
            html += `<div class="row counter-wise-list-data mt-2">`;
            _.each(cs.tickets, function (ticket) {
                let btn_selling_cancel = cs.allow_selling_cancel && ticket.issue_type == 'S' ? `<button type="button" class="btn btn-danger p-1 btn-cancel-selling" data-ticket-id = "${ticket.ticket_id}" data-coach-id="${coach_id}">cancel</button>` : "";
                let btn_booking_confirm = cs.allow_booking_confirm && ticket.issue_type == 'B'  ? `<button type="button" class="btn btn-info p-1 btn-confirm-booking" data-ticket-id = "${ticket.ticket_id}" data-coach-id="${coach_id}">confirm</button>` : "";
                let btn_booking_cancel = cs.allow_booking_cancel && ticket.issue_type == 'B'  ? `<button type="button" class="btn btn-danger p-1 btn-cancel-booking" data-ticket-id = "${ticket.ticket_id}" data-coach-id="${coach_id}">Cancel</button>` : "";
                let issue_type = ticket.issue_type == "S" ? "Sold" : "Booked";
                html += `<div class="col-md-3 border border-success m-2 ml-xs-0">
                            <span class="text-success">${ticket.seats}</span> <span class="float-right">${issue_type}</span><br>
                            <span class="font-weight-bold">Name: </span> ${ticket.name}<br>
                            <span class="font-weight-bold">Mobile: </span>${ticket.mobile}<br>
                            <span class="font-weight-bold">Start Counter: </span>${ticket.start_counter}<br>
                            <span class="font-weight-bold">End Counter: </span>${ticket.end_counter}<br>
                            <div class="row mb-2 mt-1">
                                <div class="col-md-12 float-left">${btn_selling_cancel} ${btn_booking_confirm} ${btn_booking_cancel}</div>
                            </div>
                        </div>`;
            });
            html += `</div>`;
            html += `</li>`;
        });
        html += `</ul>
                </div>`;
    } else {
        html = `<div class="alert alert-danger col-md-12"> <i class="fa fa-exclamation"></i> No seats sold yet </div>`;
    }
    $couterview_container.html(html);
}

async function showFinalTicket(ticket_id) {

    $('html, body').animate({
        scrollTop: $("#ticket").offset().top-20
    }, 500);

    // $("#ticketModal").modal("show");
    let res = await axios.post(HOSTURL+'/tickets/get-ticket-details-by-id', {
        ticket_id: ticket_id
    });

    console.log(res);

    let $tem = $("#ticket-container");
    let t = res.data;
    let issued_by = t.issuing_user_type == 1 ? t.issuing_user_name: t.issuing_customer_name;
    // t.coach_status = COACH_STATUS[t.coach_status];
    t.is_ac = t.is_ac == 1 ? 'AC': 'Non AC';
    t.ticket_status = t.ticket_status == 1 ? 'ACTIVE': 'INACTIVE';
    t.customer_gender = t.customer_gender == 'M' ? 'Male': 'Female';
    t.departure_time = moment(t.departure_time, ["HH:mm:ss"]).format("h:mm A");
    t.departure_date = moment(t.departure_date, ["YYYY-MM-DD"]).format("h:mm A");
    t.issue_time = moment(t.issue_time, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YYYY');
    $tem.find(".ticket_unique_id").html(t.ticket_unique_id);
    $tem.find(".departure_time").html(t.departure_time);
    $tem.find(".arrival_time").html(t.arrival_time);
    $tem.find(".company_name").html(t.company_name);
    $tem.find(".route_name").html(t.route_name);
    $tem.find(".is_ac").html(t.is_ac);
    $tem.find(".ticket_status").html(t.ticket_status);
    // $tem.find(".coach_status").html(t.coach_status);
    $tem.find(".ticket_unique_id").html(t.ticket_unique_id);
    $tem.find(".coach_unique_id").html(t.coach_unique_id);
    $tem.find(".coach_code").html(t.coach_code);
    $tem.find(".customer_name").html(t.customer_name);
    $tem.find(".customer_mobile").html(t.customer_mobile);
    $tem.find(".customer_age").html(t.customer_age);
    $tem.find(".customer_gender").html(t.customer_gender);
    $tem.find(".coach_from_venue").html(t.coach_from_venue);
    $tem.find(".coach_to_venue").html(t.coach_to_venue);
    $tem.find(".start_counter").html(t.start_counter);
    $tem.find(".end_counter").html(t.end_counter);
    $tem.find(".fare").html(t.fare);
    $tem.find(".seats").html(t.seats);
    $tem.find(".issue_time").html(t.issue_time); 
    $tem.find(".issued_by").html(issued_by); 
    $tem.find(".departure_date").html(t.departure_date);
}

/* Temporary */
$(document).on('click', '#refund-bg-payment', async function (e) {
    let pg_callback_data = JSON.parse($("#pg-callback-data").val());
    let res = await axios.post(HOSTURL + '/tickets/refund-customer-ticket', {
        paymentID : pg_callback_data.paymentID,
        trx_id : pg_callback_data.paymentID,
        amount : pg_callback_data.amount,
        sku : "1628254033",
        reason : "Refund"
    });
    let x = "";
    console.log(res.data)
   
    x = `<div class="alert alert-site">
        ${res.data.msg}
    </div>`;

    $("#general-container").show(); 
    $("#general-container .container-wrapper").show().empty().append(x); 
});

