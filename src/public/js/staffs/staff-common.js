async function getStaffsDueTrips(staff_id) {
    return new Promise(async function(resolve, reject) {
        let r = {};
        let due_trips = 0;
        $("#ct-table").empty();

        let res = await axios.get(HOSTURL+'/coach-report/single-staff-due-data', {timeout: 10000, params: {
                staff_id: parseInt(staff_id)
            }}).then(function(res) {
                if(res.data.status) {
                    $("#alert-msg").hide();
                    $("#element").show();

                    let data = res.data.data;
                    $("#element .status").html(data[0].staff_status);
                    $("#element .name").html(data[0].staff_name);
                    $("#element .mobile").html(`<a href="tel:${data[0].staff_mobile}">${data[0].staff_mobile}</a>`);
                    $("#element .created_on").html(moment(data[0].staff_created).format("Do MMM, YYYY"));
                    $("#element .total_due_trips").html(data[0].total_due_trips);
                    if(!_.has(data[0], "total_due_trips")) {
                        $("#ct-table").append(`<tr><td colspan="4"><div class='alert alert-site'>No Trip History</div></td></tr>`);
                        $("#element .total_due_trips").html(0);
                        return;
                    }
                    let data1 = _.groupBy(data, 'departure_date');
                    _.each(data1, function(items, departure_date) {
                        due_trips++;
                        let x = `<tr><td rowspan="${items.length + 1}">${moment(departure_date).format("Do MMM, YYYY")}</td></tr>`;
                        $("#ct-table").append(x);

                        _.each(items, function(item, index) {
                            td =`<td>${moment(item.departure_time, "HH:mm:ss").format("hh:mm A")}</td>
                                <td>${item.coach_code}</td>
                                <td><a href="/coach-report/details-single/${item.coach_unique_id}" target="_new">${item.coach_unique_id}</a></td>
                                <td>${item.due_amount}</td>
                                `;
                            let tr = `<tr>${td}</tr>`
                            $("#ct-table").append(tr);
                        });
                    });
                    $("#ct-table").append(`<tr><td colspan="4">Total Due</td><td>${data[0].total_due}</td></tr>`);
                } else {
                    r.status = false;
                    $("#alert-msg").removeClass("display-none");
                    $("#element").addClass("display-none");
                }
            
        });
        resolve(true);
    });
}