
    var seatStateChanger = {};
    console.log(HOSTURL)

    seatStateChanger.update1 = function (data) {
        let $this = this;
        console.log("Polled Seat Data1: " + JSON.stringify(data.emitted_data));
        let seat_info_str = data.seat_info;
        
        _.each(data.emitted_data, function (element, index, list) {
            let $coach_elem = $(`.coach-element[data-coach-id='${element.coach_id}']`);
            $coach_elem.attr("data-seat-info", seat_info_str);
            if(typeof element.seat_no === 'object') {
                for(let seat_no of element.seat_no) {
                    let $seat = $coach_elem.find(`.${seat_no}`);
                    let seat_status = element.seat_status;
                    let ss = SEAT_STATUS[seat_status];
                    let seat_info_json = JSON.parse(seat_info_str);
                    let cur_seat_info = seat_info_json[seat_no];
                    $this[ss.callback]($seat, ss, cur_seat_info);
                    $seat.attr("data-seat-status", seat_status);
                }
            }
            $coach_elem.attr("data-counter-view", 0);
            generateCounterWiseView($coach_elem); /*@TOD: Remove after checking */
        });
    }

    seatStateChanger.update = function ($coach_elem, seat_info_json) {
        let $this = this;
        _.each(seat_info_json, function (si, seat_no, list) {
            let $seat = $coach_elem.find(`.${seat_no}`);
            let seat_status = parseInt(si.status);
            let ss = SEAT_STATUS[seat_status];
            // console.log(seat_no, ss);
            if(typeof ss !== "undefined") {
                $seat.attr("data-seat-status", seat_status);
                $this[ss.callback]($seat, ss, si);
            }
        });
        $coach_elem.attr("data-counter-view", 0);
    }
    
    seatStateChanger.processing = function ($seat, ss, cur_seat_info) {
        if ((CUR_USER_INFO.user_type == 1 && cur_seat_info.occupying_user_id == CUR_USER_INFO.id) || 
            (CUR_USER_INFO.user_type == 2 && cur_seat_info.occupying_customer_id == CUR_USER_INFO.unique_customer_id && CUR_USER_INFO.unique_customer_id !== null)) { /* Enabling the seat edit for current user only */
            this.removeAllSeatClasses($seat);
            $seat.addClass(ss.class);
            this.addSeatToSelectedList($seat);
            // console.log("CUR SEAT INFO: ", cur_seat_info)
        } else {
            this.removeAllSeatClasses($seat);
            $seat.addClass("s-blocked");
        }
    }
    
    seatStateChanger.available = function ($seat, ss, seat_info_str) {
        this.removeAllSeatClasses($seat);
        $seat.addClass("s-available");
        this.removeSeatFromSelectedList($seat);
    }
    
    seatStateChanger.bookedFemale = function ($seat, ss, seat_info_str) {
        this.removeAllSeatClasses($seat);
        $seat.addClass("s-booked-female");
        // this.emptySelectedList($seat);
    }
    
    seatStateChanger.bookedMale = function ($seat, ss, seat_info_str) {
        this.removeAllSeatClasses($seat);
        $seat.addClass("s-booked-male");
        // this.emptySelectedList($seat);
    }
    
    seatStateChanger.soldMale = function ($seat, ss, seat_info_str) {
        this.removeAllSeatClasses($seat);
        $seat.addClass("s-sold-male");
        // this.emptySelectedList($seat);
    }
    
    seatStateChanger.soldFemale = function ($seat, ss, seat_info_str) {
        this.removeAllSeatClasses($seat);
        $seat.addClass("s-sold-female");
        // this.emptySelectedList($seat);
    }
    
    seatStateChanger.blocked = function ($seat, ss, seat_info_str) {
        this.removeAllSeatClasses($seat);
        $seat.addClass("s-blocked");
        // this.emptySelectedList($seat);
    }
    
    seatStateChanger.addSeatToSelectedList = function ($seat) {
        let $coach_elem = $seat.closest(".coach-element");
        $selected_seat_list = $coach_elem.find(".selected-seat-list");
        // $selected_seat_list.css("border", "1px solid black");
        let route_preference = JSON.parse($coach_elem.attr("data-route-preference"));
        let seat_type = $seat.attr("data-seat-type");
        let seat_no = $seat.attr("data-seat-no");
        // let fare = route_preference.fare[seat_type];
        // $selected_seat_list.find(`.list-group-item [data-seat-no='${seat_no}']`).hide();
        let exists = $selected_seat_list.find(`[data-seat-no='${seat_no}']`).length > 0 ? true : false;
        // console.log(exists);

        if(!exists) {
            let fare = seat_type == 'regular' ? $coach_elem.attr("data-fare-regular") : $coach_elem.attr("data-fare-business")
            let sslm = `<li class="list-group-item d-flex justify-content-between align-items-center selected-seat-li" 
                            data-fare="${fare}" data-seat-no="${seat_no}">
                            <span class="label">${seat_no}</span>
                            <span class="badge badge-site badge-pill"><span class="fare">${fare}</span>Tk</span>
                        </li>`;
            $coach_elem.find(".selected-seat-list-container").removeClass("d-none");
            // console.log(sslm);
            // $coach_elem.append(sslm);
            $selected_seat_list.find("li:last").before(sslm);
            // $selected_seat_list.find("li:last").before("1111");
            // $selected_seat_list.html(sslm);
        }
        this.calculateTotalFare($coach_elem);
    }
    
    seatStateChanger.removeSeatFromSelectedList = function ($seat) {
        // console.log();
        let seat_no = $seat.attr("data-seat-no");
        let $coach_elem = $seat.closest(".coach-element");
        $selected_seat_list = $coach_elem.find(".selected-seat-list");
        $selected_seat_list.find(`li[data-seat-no='${seat_no}']`).remove();
        this.calculateTotalFare($coach_elem);
    }
    
    seatStateChanger.removeAllSeatClasses = function ($seat) {
        $seat.removeClass("s-processing").removeClass("s-available").removeClass("s-booked-male").removeClass("s-booked-female").removeClass("s-sold-male").removeClass("s-sold-female").removeClass("s-blocked");
    }
    
    seatStateChanger.releaseAllSelectedSeats = async function () {
        let occupying_user_id = CUR_USER_INFO.id;
        let occupying_user_type = CUR_USER_INFO.user_type;
        let occupying_customer_id = CUR_USER_INFO.unique_customer_id; 
        let res = await axios.get(HOSTURL+'/coaches/release-all-seats', {
            params: {occupying_user_id: occupying_user_id, occupying_user_type: occupying_user_type, occupying_customer_id: occupying_customer_id}
        });
    }
    
    seatStateChanger.emptySelectedList = function ($coach_elem) {
        // let seat_no = $seat.attr("data-seat-no");
        // let $coach_elem = $seat.closest(".coach-element");
        $selected_seat_list = $coach_elem.find(".selected-seat-list");
        // $selected_seat_list.empty();
        $selected_seat_list.find('li').not('li:last').remove(); 
        this.calculateTotalFare($coach_elem);
    }
    
    seatStateChanger.resetPassengerInfo = function ($elem) {
        let $coach_elem = $elem.closest(".coach-element");
        let $pif = $coach_elem.find(".passenger-info-form");
        $pif[0].reset();
    }
    
    seatStateChanger.calculateTotalFare = function ($coach_elem) {
        $selected_seat_list_con = $coach_elem.find(".selected-seat-list-container");
        $selected_seat_list = $coach_elem.find(".selected-seat-list");
        // $route_preference.service_charges.customer.per_ticket;
        // CUR_USER_INFO.user_type == 1
        let lis = $selected_seat_list.find(".selected-seat-li");
        if (lis.length >= 1) {
            $selected_seat_list_con.removeClass("d-none");
        } else {
            $selected_seat_list_con.addClass("d-none");
        }
        let total_fare = 0;
        lis.each(function () {
            let fare = $(this).attr("data-fare");
            total_fare += parseFloat(fare);
        });
        $selected_seat_list.find(".total-fare").html(`${total_fare} Tk`)
    }
    
    seatStateChanger.recalibrateSelectedSeatFares = function ($coach_elem) {
        let $seats = $coach_elem.find(`.seat[data-seat-status='0']`);
        let $this = this;
        $seats.each(function() {
            if($(this).attr("data-seat-status") == 0) {
                $this.removeSeatFromSelectedList($(this));
                $this.addSeatToSelectedList($(this));
            }
        });
        return;
    }
    
    