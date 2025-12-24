
var HallIDGrouped = {};
var CC_CACHE_NAME = "curCCUser";
var HALL_IMGS = [];
let CC_IMG_DIR_URL = "/img/cc";
var CALENDAR, HALL_BOOKING_DATA;

async function generateCenterInfo2(cur_user_id) {
    return new Promise(async function(resolve, reject) {
        let res = await axios.get(HOSTURL+'/centers/center-list', {timeout: 10000, params: {
            id: cur_user_id
        }}).then(function(res) {
            if(res.data.status) {
                let data = res.data.data;
                let center_data = _.groupBy(data, 'center_id');
                _.each(center_data, function(cd, center_id) {
                    HallIDGrouped[center_id] = []; 
                    HallIDGrouped[center_id]["center_id"] = cd[0].center_id;
                    HallIDGrouped[center_id]["center_name"] = cd[0].center_name;
                    HallIDGrouped[center_id]["no_of_floor"] = cd[0].no_of_floor;
                    HallIDGrouped[center_id]["no_of_hall"] = cd[0].no_of_hall;
                    HallIDGrouped[center_id]["parking"] = cd[0].parking;
                    let hall_data = _.groupBy(cd, 'hall_id');
                    _.each(hall_data, function(hd, hall_id) {
                        if(!_.has(HallIDGrouped[center_id], "hall_data")) { HallIDGrouped[center_id]["hall_data"] = {} };
                        if(!_.has(HallIDGrouped[center_id]["hall_data"], hall_id)) { HallIDGrouped[center_id]["hall_data"][hall_id] = {} };
                        let hdata = {"hall_id": hd[0].hall_id, "hall_name": hd[0].hall_name, "area": hd[0].area, "single_hall": hd[0].single_hall, "batch": hd[0].batch, "capacity": hd[0].capacity, "hall_floor": hd[0].hall_floor, "shift_data": {}};
                        let shift_data = _.groupBy(hd, 'shift_id');
                        _.each(shift_data, function(sd, shift_id) {
                            let sdata = {"shift_id": sd[0].shift_id, "shift_name": sd[0].shift_name, "shift_rates": {}, "shift_special_rates": {}};
                            let shift_rates = _.groupBy(sd, 'shift_rate_id');
                            _.each(shift_rates, function(sr, shift_rate_id) {
                                if(shift_rate_id !== null) {
                                    let srdata = {"shift_rate_id": sr[0].shift_rate_id, "shift_amount": sr[0].shift_amount, "rate_start_date": sr[0].rate_start_date, "rate_end_date": sr[0].rate_end_date};
                                    sdata["shift_rates"][shift_rate_id] = srdata;
                                }
                            });

                            let shift_special_rates = _.groupBy(sd, 'special_rate_id');
                            _.each(shift_special_rates, function(spr, special_rate_id) {
                                if(special_rate_id !== null) {
                                    let sprdata = {"special_rate_id": spr[0].special_rate_id, "special_rate_day": spr[0].special_rate_day, "special_rate_date": spr[0].special_rate_date, "special_rate_amount": spr[0].special_rate_amount, "special_day_rate": spr[0].special_day_rate};
                                    sdata["shift_special_rates"][special_rate_id] = sprdata;
                                }
                            });

                            hdata["shift_data"][shift_id] = sdata;
                        });
                        HallIDGrouped[center_id]["hall_data"][hall_id] = hdata;
                    });
                });

                HALL_IMGS = [];
                let data5 = _.groupBy(data, 'hall_image_src');
                _.each(data5, function(halls, img) {
                        _.each(halls, function(hall, i) {
                            let hall_id = hall.hall_id;
                            if(HALL_IMGS.hasOwnProperty(hall_id)) {
                                if( img !== null) {
                                    HALL_IMGS[hall_id].push({"img":img});
                                }
                            } else {
                                HALL_IMGS[hall_id] = [];
                            }
                        });
                        HALL_IMGS[halls[0].hall_id] = _.uniq(HALL_IMGS[halls[0].hall_id], "img");
                });
            } else {

            }
        });
    
        console.log(HallIDGrouped);
        // console.log(HALL_IMGS);
        resolve(true);
    });
}

function loadHallThumbImages() {
    _.each(HALL_IMGS, function(imgs, hall_id) {
        $(`.item-hall[data-hall-id=${hall_id}]`).find(".item-thumbs").empty();
        if(typeof img !== "undefined" && img.length > 0) {
            _.each(imgs, function(img, i) {
                if(i == 0) return;
                img = img.img == null || img.img == 'null'  ? '/img/no-image.jpg' : `${CC_IMG_DIR_URL}/${img.img}`;
                $(`.item-hall[data-hall-id=${hall_id}]`).find(".item-thumbs").append(`<a rel="gallery-${hall_id}" class="swipebox" href="${img}"><img src="${img}" class="float-left mx-1" alt="" /></a>`);
            });
        } else {
            img = '/img/no-image.jpg' ;
        }
    });
}

async function loadBookingInfo(hall_id) {
    return new Promise(async function(resolve, reject) {
        let res = await axios.get(HOSTURL+'/centers/booking-list', {timeout: 10000, params: {
            hall_id: hall_id
        }}).then(function(res) {
            if(res.data.status) {
                HALL_BOOKING_DATA = JSON.stringify(res.data.data);
            } else {

            }
        });
        resolve(true);
    });
}

function setDate($this, dt) {
    setTimeout(function() {
        $this.mobiscroll('setVal', dt);
    }, 2000);
}

$(document).on('click', ".btn-hall-image-view-public", async function (e) {
    // $(".btn-cc-public-tab").removeClass("active");
    let $item_hall = $(this).closest(".item-hall");
    $item_hall.find(".tab-rates").addClass('d-none');
    $item_hall.find(".tab-bookings").addClass('d-none');
    $item_hall.find(".tab-images").removeClass('d-none');
    $item_hall.find(".btn-cc-public-tab").removeClass("active");
    $(this).addClass("active");
    let $item_img = $item_hall.find(".item-images")
    let hall_id = $item_hall.attr("data-hall-id");
    let loaded = $item_hall.attr("data-image-loaded");
    // console.log(hall_id);
    $item_img.show();
    if(loaded == 0) {
        loadHallThumbImages(hall_id);
        $item_hall.attr("data-image-loaded", 1);
    } else {

    }
});

$(document).on('click', ".btn-hall-rates-view-public", async function (e) {
    let $item_hall = $(this).closest(".item-hall");
    $item_hall.find(".tab-rates").removeClass('d-none');
    $item_hall.find(".tab-bookings").addClass('d-none');
    $item_hall.find(".tab-images").addClass('d-none');
    $item_hall.find(".btn-cc-public-tab").removeClass("active");
    $(this).addClass("active");
});

( function( $ ) {

	$( '.swipebox' ).swipebox();

} )( jQuery );