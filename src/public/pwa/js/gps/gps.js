
    //timeago().render(document.querySelectorAll('.need_to_be_rendered')); 
    // console.log(timeago().format(""));

    var MAP, LAYERGROUP, CUR_LAT, CUR_LNG, DEVICE_ID;
    var $MAP_CONTAINER;
    // $(document).on("click", ".btn_vehicle_location", function() {
    //     // let gps_device_id = $(this).attr("data-gps-device-id");
    //     // $("#device_id").val(gps_device_id);
    //     // getLatestDeviceLocation(false);
    // });

    function init_map(map_container, initial_coords) {
        MAP = L.map(map_container).setView(initial_coords, 10);
        LAYERGROUP = L.layerGroup();
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(MAP);
    }

    function getCompanyVehicles(company_id) {
        return new Promise(async function(resolve, reject) {
            let r = {};
            let res = await axios.get(HOSTURL+'/gps/get-vehicles-by-company-id', {timeout: 10000, params: {
                company_id: company_id
            }}).then(function(res) {
                let vehicles = res.data.vehicles;
                let li = tabcontent = ``;
                let i = 0;
                _.each(vehicles, function(item) {
                    i++;
                    li += `<a class="list-group-item list-group-item-action d-flex w-100 justify-content-between" id="list-${item.id}-list" style="" 
                                data-toggle="list" href="#list-osm-map" data-gps-device-id="${item.gps_device_id}" role="tab" aria-controls="home">
                                ${i} . ${item.license_plate_no} <small>${item.make} ${item.model}</small>
                            </a>`
                });
                $("#vehicle-list-tab").html(li);
            });
            resolve(r);
        });
    }
    
    function getLatestDeviceLocation(animate, initial_coords, device_id, start_date, end_date, start, navigate) {
        // let device_id = parseInt($("#device_id").val());
        return new Promise(async function(resolve, reject) {
            let r = {};
            let old_coords = [parseFloat(CUR_LAT), parseFloat(CUR_LNG)];
            if(device_id > 0) {
                let res = await axios.get(HOSTURL+'/gps/latest-vehicle-location', {timeout: 10000, params: {
                        device_id: device_id,
                        start: start,
                        start_date: start_date, 
                        end_date: end_date,
                    }}).then(function(res) {
                        if(res.data.status) {
                            if(navigate) {
                                $("#osm-msg").hide();
                                $("#osm-map").show();
                                let new_coords = [parseFloat(res.data.location[0].lat), parseFloat(res.data.location[0].lng)];
                                date_created = res.data.location[0].date_created;
                                if(new_coords[0] !== old_coords[0] || new_coords[1] !== old_coords[1]) {
                                    removeAllMarkers();
                                    MAP.setView(new_coords, 15);
                                    let marker_title = "<strong> License plate no :</strong>" + res.data.location.license_plate_no + "<br>" + `<span class="need_to_be_rendered" datetime="${date_created}">${timeago().format(date_created)}</span>`; 
                                    if(animate) {
                                        console.log("marker added");
                                        moveMarker(old_coords, new_coords, marker_title);
                                    } else {
                                        addMarker(new_coords, marker_title);
                                    }
                                    CUR_LAT = parseFloat(res.data.location[0].lat);
                                    CUR_LNG = parseFloat(res.data.location[0].lng);
                                }
                            }
                            r.status = true;
                            r.data = res.data.location;
                        } else {
                            CUR_LAT = ""; 
                            CUR_LNG = "";
                            removeAllMarkers();
                            MAP.setView(initial_coords, 10);
                            r.status = false;
                        }
                });
            } else {
                r.status = false;
            }
            resolve(r);
        });
    }

    function removeAllMarkers() {
        if (MAP.hasLayer(LAYERGROUP)) {
            console.log('already have one, clear it');
            LAYERGROUP.clearLayers();
        } else {
            console.log('never have it before');
        }
    }

    function moveMarker(prev_coords, coords, title) {
        var myMovingMarker = L.Marker.movingMarker([prev_coords,coords],[2000]).addTo(MAP);
        // var myMovingMarker = L.Marker.movingMarker([[22.3475365, 91.81233240000006],[22.368500, 91.824371]],[2000]).addTo(MAP); --}}
        myMovingMarker.start();
        myMovingMarker.on('end', function() {
            myMovingMarker.remove();
            addMarker(coords, title);
        });
    }

    function addMarker (coords, title) {        
        var iconOptions = {
            iconUrl: 'logo.png',
            iconSize: [25, 25]
        }
        var customIcon = L.icon(iconOptions);

        var markerOptions = {
            title: title,
            clickable: true,
            draggable: false,
            icon: L.icon.glyph({ glyph: title})
            // icon: customIcon --}}
        }         
        // removeAllMarkers(); --}}
        // MAP.setView(coords, 18); --}}
        var marker = L.marker(coords, markerOptions);
        // marker.bindTooltip("my tooltip text").openTooltip(); --}}
        marker.bindPopup(title).openPopup();
        LAYERGROUP.addLayer(marker);
        MAP.addLayer(LAYERGROUP);
    }  

    function placeMarkerOnMap($map, coords, markerOptions) {
        var iconOptions = {
            iconUrl: 'logo.png',
            iconSize: [25, 25]
        }     
        let marker = L.marker(coords, markerOptions);
        marker.bindPopup(markerOptions.title).openPopup();
        LAYERGROUP.addLayer(marker);
        $map.addLayer(LAYERGROUP);
        return marker;
    }

    function historyItemHTML(data) {
        let html = "";
        let date_grouped = _.groupBy(data, "date");
        console.log(date_grouped);
        _.each(date_grouped, function(data, index){
        html +=`<span class="text-site d-flex justify-content-center border-bottom mb-3 pb-2">${moment(index, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YY ')}</span>`;
                html +=`<ul class="list-group list-group-flush">`;
                _.each(data, function(i, index){
                    html += `<li class="list-group-item list-group-item-action">
                                <a class="loc-history-a text-dark" data-lat="${i.lat}" data-lng="${i.lng}" data-lpn="${i.license_plate_no}" data-datetime="${i.date_created}" href="javascript:void(0)">
                                <small>
                                    <!-- <div>${moment(i.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('LT  MMM Do, YY ')} </div> -->
                                    <div>${moment(i.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('LT')} </div>
                                    <span class="needs_to_be_rendered" datetime="${moment(i.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('YYYY-MM-DD HH:mm:ss')} "></span>
                                    <!-- (${timeago().format(i.date_created)}) -->
                                </small>
                            </a>
                        </li>`;
                });
                html +=`</ul>`;
        });
        // html += `<div><small class="justify-content-center d-flex mt-2">Showing latest <span class="history-count-text"> 50 </span> data</small></div>`;
        html += `<div><a id="history-load-more-btn" href="javascript:void(0)" class="justify-content-center d-flex mt-2">Load More(50)</a></div>`;
        return html;


        _.each(data, function(index, i) {
            console.log(index);
            /*@TODO: Fix Timeago feature*/    
            html += `<li class="list-group-item list-group-item-action">
                        <a class="loc-history-a text-dark" data-lat="${i.lat}" data-lng="${i.lng}" data-lpn="${i.license_plate_no}" data-datetime="${i.date_created}" href="javascript:void(0)">
                            <small>
                                <div>${moment(i.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('LT  MMM Do, YY ')} </div>
                                <span class="needs_to_be_rendered" datetime="${moment(i.date_created, ["YYYY-MM-DD HH:mm:ss"]).format('YYYY-MM-DD HH:mm:ss')} "></span>
                                (${timeago().format(i.date_created)}) 
                            </small>
                        </a>
                    </li>`;
        });

        html += `<div><small class="justify-content-end d-flex mt-2">Showing latest 50 data</small></div>`;
        html += `<small><a href="javascript:void(0)" class="justify-content-center d-flex mt-2">Load More(50)</a><small>`;
        return html;
    }