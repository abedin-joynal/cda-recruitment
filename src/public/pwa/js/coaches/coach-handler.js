async function getCoachList() {
    return new Promise(async function(resolve, reject) {
    let ddate = $("#filter-departure-date").val();
    let is_ac = $("#filter-is-ac").val();
    let route = $("#filter-route").val();
    let from_venue_id = $("#from-venu-id").val();
    let from_venue_type = $("#from-venu-type").val();
    let from_venue = $("#from-venue").val();
    let to_venue_id = $("#to-venu-id").val();
    let to_venue_type = $("#to-venu-type").val();
    let to_venue = $("#to-venue").val();

    // console.log(from_venue_id + from_venue + from_venue_type);

    ddate = ddate == "" ? null : ddate;
    let preloader = `<div class="col-md-12 my-auto mx-auto">
                        <i class="fas fa-circle-notch fa-spin"></i> Searching Bus..
                    </div>`;
    // COACH_LIST_CONTAINER.html(preloader);
    COACH_LIST_CONTAINER.show();
    TICKET_LIST_CONTAINER.hide();
    FINAL_TICKET_CONTAINER.hide();
    CONFIRMED_TICKETS_CONTAINER.hide();
    
    COACH_LIST_CONTAINER.html(`<div class='alert alert-site h-100 p-36 m-0 text-center'> ${preloader} </div>`);

    let coaches = false;
    try {
        let res = await axios.post(HOSTURL+'/coaches/coach-list/', {
            cur_user: CUR_USER_INFO,
            departure_date: ddate, is_ac: is_ac, route: route, 
            from_venue_id : from_venue_id, from_venue_type: from_venue_type, from_venue: from_venue,
            to_venue_id: to_venue_id, to_venue_type: to_venue_type, to_venue: to_venue
        });
        coaches = res.data;
        
    } catch(err) {
        console.log(err)
        // COACH_LIST_CONTAINER.html(`<div class='alert alert-warning'>Could not load coach list. Something went wrong!!</div>`)
        COACH_LIST_CONTAINER.html(`<div class='alert alert-site h-100 p-36 m-0'> <i class='fa fa-exclamation-triangle'></i> &nbsp &nbsp Could not load coach list. Something went wrong!!!! </div>`)
    }

    if(coaches) {
        COACH_LIST_CONTAINER.empty();
        // COACH_LIST_CONTAINER.show();
        // console.log(coaches);
        if (coaches.length >= 1) {
            for (let i in coaches) {
                let coach = coaches[i];
                let cm = $("#coach-element-markup").clone();
                let coach_id = coach.id;
                plotCounters(cm, coach.route_id, coach.company_id, coach.departure_time);
                cm.attr("data-coach-id", coach_id);
                cm.attr("data-route-id", coach.route_id);
                cm.attr("data-company-id", coach.company_id);
                for (var prop in coach) {
                    if (Object.prototype.hasOwnProperty.call(coach, prop)) {
                        let c = null;
                        if (prop == 'status') {
                            cm.attr("data-coach-status", coach[prop]);
                            cm.find(".coach_status").find(`option[value='${coach[prop]}']`).attr('selected', 'selected');
                        } else if (prop == 'is_ac') {
                            c = coach[prop] == 1 ? "AC" : "Non AC";
                        } else if (prop == 'unique_id') {
                            c = coach[prop];
                            cm.find(".unique_id_href").attr("href", "/coach-report/details-single/" + c);
                            cm.find(".reset_seat_btn").attr("href", `/coaches/reset-coach/${c}`)
                        } else if (prop == 'departure_date') {
                            c = coach[prop];
                        } else if (prop == 'departure_time' || prop == 'arrival_time') {
                            c = moment(coach[prop], ["HH:mm:ss"]).format("h:mm A");
                        } else if (prop == 'orientation') {
                            cm.attr("data-seat-orientation", coach[prop]);
                        } else if (prop == 'seats') {
                            cm.attr("data-seat-info", coach[prop]);
                        } else if (prop == 'route_preferences') {
                            cm.attr("data-route-preference", coach[prop]);
                            if(JSON.parse(coach[prop]) !== null) {
                                let fare = JSON.parse(coach[prop]).fare;
                                cm.attr("data-fare-regular", fare.regular);
                                cm.attr("data-fare-business", fare.business);
                                c = fare.regular + "TK";
                                c += _.has(fare, 'business') ? " | "+fare.business + "TK" : "";
                            }
                        } else if (prop == 'driver_id') {
                            cm.attr("data-driver-id", coach[prop]);
                        } else if (prop == 'supervisor_id') {
                            cm.attr("data-supervisor-id", coach[prop]);
                        } else if (prop == 'helper_id') {
                            cm.attr("data-helper-id", coach[prop]);
                        } else if (prop == 'vehicle_id') {
                            cm.attr("data-vehicle-id", coach[prop]);
                        } else if (prop == 'gps_device_id') {
                            cm.attr("data-gps-device-id", coach[prop]);
                        } else if(prop == "ss_mobile") {
                            c = coach[prop] == null ? "" : `<a href='tel:${coach[prop]}'>${coach[prop]}</a>`;
                        } else if(prop == "ss_mobile") {
                            cm.attr("data-company-name", coach[prop]);
                        } else {
                            c = coach[prop];
                        }
                        cm.find(`.${prop}`).html(c);
                        if (CUR_USER_INFO !== null && CUR_USER_INFO.hasOwnProperty('permissions')) {
                            CUR_USER_INFO.permissions["coach-delete"] || CUR_USER_INFO.permissions["coach-edit"] ? cm.find(".edit-delete-btn-container").show() : cm.find(".edit-delete-btn-container").hide();
                            CUR_USER_INFO.permissions["coach-delete"] ? cm.find(".btn_delete").attr("data-id", coach_id).show() : cm.find(".btn_delete").remove();
                            CUR_USER_INFO.permissions["coach-edit"] ? cm.find(".status-change-btn-container").show() : cm.find(".status-change-btn-container").remove();
                            CUR_USER_INFO.permissions["coaches-reset-seat"] ? cm.find(".reset_seat_btn").show() :  cm.find(".reset_seat_btn").remove() ;
                            if (CUR_USER_INFO.permissions["coach-edit"]) {
                                cm.find(".edit_btn").show();
                                cm.find(".edit_btn").attr("href", `/coaches/edit/${coach_id}`);
                            } else {
                                cm.find(".edit_btn").remove();
                            }
                        }
                    }
                }
                COACH_LIST_CONTAINER.append(cm);
            }
        } else {
            COACH_LIST_CONTAINER.html(`<div class='alert alert-site h-100 p-36 m-0'> <i class='fa fa-exclamation-triangle'></i> &nbsp &nbsp No Bus found!! </div>`);
        }
        // ddate = ddate == null ? moment().format('MM/DD/YYYY') : ddate;
        // let rddate = moment(ddate, ["MM:DD:YYYY"]).format('Do, MMM  YYYY');
        // $("#search-parameter-text").html(`Search Result for <span class="">${rddate}</span>`);
    }
    resolve(true);
    }); 
}

async function pollCoachList() {
    try {
        let res = await axios.get(HOSTURL+'/coaches/poll-coach-list');
        pollCoachList();

    } catch (err) {
        setTimeout(function () {
            pollCoachList();
        }, 5000)
    }
}

async function populateCoachCompleteModal() {
    let genStaffOptions = function(data) {
        let options = "";
        _.each(data, function(d) {
            options += `<option value='${d.id}' data-subtext="Ph: ${d.mobile}">${d.name}</option>`
        });
        return options;
    };

    let genVehicleOptions = function(data) {
        let options = "";
        _.each(data, function(d) {
            options += `<option value='${d.id}' data-subtext="${d.license_plate_no}">${d.license_plate_no}</option>`
        });
        return options;
    };

    let genExpenseOptions = function(data) {
        let options = "";
        _.each(data, function(d) {
            options += `<option value='${d.id}'>${d.name}</option>`
        });
        return options;
    };
    
    try {
        let res = await axios.post(HOSTURL+'/coaches/get-company-driver-supervisor-helper/');
        let drivers_options = genStaffOptions(res.data.drivers);
        let supervisors_options = genStaffOptions(res.data.supervisors);
        let helpers_options = genStaffOptions(res.data.helpers);
        let vehicles_options = genVehicleOptions(res.data.vehicles);
        let expense_options = genExpenseOptions(res.data.t_heads);
        $("#coachCompleteModal").find(".driver_id").append(drivers_options);
        $("#coachCompleteModal").find(".supervisor_id").append(supervisors_options);
        $("#coachCompleteModal").find(".helper_id").append(helpers_options);
        $("#coachCompleteModal").find(".vehicle_id").append(vehicles_options);
        $("#coachCompleteModal").find("#expense_id").append(expense_options);
    } catch (err) {
        Notify("<i class='fa fa-exclamation'></i>", "Something went wrong while getting staff data!!", "danger");
    }
}

async function changeCoachStatus(coach_id, status) {
    let res = await axios.post(HOSTURL+'/coaches/change-status', {
        status: status,
        id: coach_id
    });
    
    if (res.data.status == true) {
        Notify("<i class='fa fa-check'></i>", "Status Changed Successfully", "info");
    } else {
        Notify("<i class='fa fa-exclamation'></i>", "Something Went Wrong!!", "danger");
    }
}

function plotCounters($cm, route_id, company_id, departure_time) {
    // route_preference =  JSON.stringify(route_preference)
    console.log(COUNTERS);
    
    try {
        if(COUNTERS[route_id][company_id]) {
            let s_counters = COUNTERS[route_id][company_id][0]; // Boarding Counters
            let shtml = '';
            shtml += s_counters.length > 0 ? `<option value="">Select A Counter</option>` : ` <option disabled> No Counter Was Found</option>`;
            if(s_counters.length > 0) {
                _.each(s_counters, function (counter) { 
                    t = moment(departure_time, ["HH:mm:ss"]).add(counter.arrival_time, 'minutes').format("h:mm A");
                    shtml += `<option value="${counter.counter_id}">${counter.counter_name}  ${t}</option>`;
                });
            }

            let e_counters = COUNTERS[route_id][company_id][1]; // Dropping Counters
            let ehtml = '';
            ehtml += e_counters.length > 0 ? `<option value="">Select A Counter</option>` : ` <option disabled> No Counter Was Found</option>`;
            if(e_counters.length > 0) {
                _.each(e_counters, function (counter) {
                    // t = moment(departure_time, ["HH:mm:ss"]).add(counter.arrival_time, 'minutes').format("h:mm A");
                    // let fare_deducted_r = counter.regular_fare !== 0 ? `- ${counter.regular_fare} Tk.`: "";
                    // let fare_deducted_b = counter.business_fare !== 0 ? `- ${counter.business_fare} Tk.`: "";
                    ehtml += `<option value="${counter.counter_id}">${counter.counter_name}</option>`;
                });
            }
            $cm.find('.psngr_start_counter_id').html(shtml);
            $cm.find('.psngr_end_counter_id').html(ehtml);
        } else {
            console.log("Something went wrong: No counter is associated to this route & operator");
        }
    } catch (err) {
        Notify("<i class='fa fa-exclamation'></i>", "Something went wrong: No counter is associated to this route & operator", "danger");
    }
}

/*@TODO: Firing Multiple times */
$(document).on('click', '#coach-complete-add-cost-btn', function () {
    $("#additional-cost-container").append($("#additional-cost-markup").html());
    $("#additional-cost-container").removeClass("d-none");
});

$(document).on('click', '.remove-cost-item', function () {
    let $aci = $(this).closest(".additional-cost-item");
    $aci.remove();
    if($("#additional-cost-container .additional-cost-item").length <= 0) {
        $("#additional-cost-container").addClass("d-none")
    }
});

$(document).on('click', '.btn-coach-status-complete', async function () {
    $(".selectpicker").selectpicker('refresh');
    let coach_id = $(this).closest(".modal").attr("data-coach-id");
    let $coach_elem = $(`.coach-element[data-coach-id='${coach_id}']`);
    let driver_id = $(this).closest(".modal").find(".driver_id").val();
    let supervisor_id = $(this).closest(".modal").find(".supervisor_id").val();
    let helper_id = $(this).closest(".modal").find(".helper_id").val();
    let vehicle_id = $(this).closest(".modal").find(".vehicle_id").val();

    let a_costs = null;
    let $acis = $(this).closest(".modal").find("#additional-cost-container .additional-cost-item");
    if($acis.length >=1) {
        a_costs = [];
        _.each($acis, function($aci, index, list) {
            console.log($aci)
            let a = {};
            a.head_id = $($aci).find(".cost_head_id").val();
            a.cost_amount = $($aci).find(".cost_amount").val();
            a_costs.push(a);
        });
    }
    let res = await axios.post(HOSTURL+'/coaches/complete-staff-info', {
        driver_id: parseInt(driver_id),
        supervisor_id: parseInt(supervisor_id),
        helper_id: parseInt(helper_id),
        vehicle_id: parseInt(vehicle_id),
        coach_id: parseInt(coach_id),
        is_paid_driver: $(this).closest(".modal").find("#is_paid_driver").is(":checked") ? 1 : 0,
        is_paid_supervisor: $(this).closest(".modal").find("#is_paid_supervisor").is(":checked") ? 1 : 0,
        is_paid_helper: $(this).closest(".modal").find("#is_paid_helper").is(":checked") ? 1 : 0,
        a_costs: a_costs,
        route_preference: $coach_elem.attr("data-route-preference")
    });

    changeCoachStatus(coach_id, 3); // 3 = complete
    $("#coachCompleteModal").modal("hide");
});

$(document).on('click', '.coach_status', function (e) {
    e.stopPropagation();
});

$(document).on('change', '.coach_status', async function (e) {
    e.stopPropagation();
    let status = parseInt($(this).val());
    if(Number.isInteger(status)) {
        $coach_elem = $(this).closest(".coach-element");
        let coach_id = $coach_elem.attr("data-coach-id");
        if(status == 3) { // 3 = complete
            let driver_id = $coach_elem.attr("data-driver-id");
            let supervisor_id = $coach_elem.attr("data-supervisor-id");
            let helper_id = $coach_elem.attr("data-helper-id");
            let vehicle_id = $coach_elem.attr("data-vehicle-id");
            $("#coachCompleteModalForm")[0].reset();
            $("#coachCompleteModal").modal("show");
            $("#coachCompleteModal").attr("data-coach-id", coach_id);
            $("#coachCompleteModal").find(".driver_id").val(driver_id);
            $("#coachCompleteModal").find(".supervisor_id").val(supervisor_id);
            $("#coachCompleteModal").find(".helper_id").val(helper_id);
            $("#coachCompleteModal").find(".vehicle_id").val(vehicle_id);
            $("#additional-cost-container .additional-cost-item").remove();
            $("#additional-cost-container").addClass("d-none");
            $(".selectpicker").selectpicker('refresh');
            return;
        }
        changeCoachStatus(coach_id, status);
    }
});

$('#coachCompleteModal').on('hidden.bs.modal', function () {
    let coach_id = $(this).attr("data-coach-id");
    let $coach_elem = $(`.coach-element[data-coach-id='${coach_id}']`);
    let cur_coach_status = $coach_elem.attr("data-coach-status");
    $coach_elem.find(".coach_status").val(cur_coach_status);
    $(".selectpicker").selectpicker('refresh');
});