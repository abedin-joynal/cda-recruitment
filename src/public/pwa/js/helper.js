$(document).on('change', '#route_id', async function (e) {
    let route_id = $(this).val();
    populateStartEndCounters(route_id);
});

$(document).ready(function() {
    let route_id = $("#route_id").val();
    populateStartEndCounters(route_id);
});

async function populateStartEndCounters(route_id) {
    $("#start_counter_id").removeClass("selectpicker");
    $("#end_counter_id").removeClass("selectpicker");
    let company_id = JSON.parse($("#cur-user-info").val()).company_id;
    if(route_id !== "") {
        let res = await axios.post(HOSTURL+'/counters/get-counters-by-route', {
           route_id: route_id,
           company_id: company_id
        });

        let s_html = e_html = "";
        let s_val = $("#start_counter_id_val").val();
        let e_val = $("#end_counter_id_val").val();
        if(res.data[0].length > 0) {
            s_html += `<option value="">Select a start counter</option>`;
            _.each(res.data[0], function(sc) {
                let selected = sc.counter_id == s_val ? "selected" : "";
                s_html += `<option value="${sc.counter_id}" ${selected}>${sc.counter_name}</option>`;
            })
        } else {
            s_html = `<option value=""> No Start Counter Found </option>`;
        }

        if(res.data[1].length > 0) {
            e_html += `<option value="">Select a start counter</option>`;
            _.each(res.data[1], function(sc) {
                let selected = sc.counter_id == e_val ? "selected" : "";
                e_html += `<option value="${sc.counter_id}" ${selected}>${sc.counter_name}</option>`;
            })
        } else {
            e_html = `<option value=""> No Start Counter Found </option>`;
        }

        $("#start_counter_id").empty().html(s_html);
        $("#end_counter_id").empty().html(e_html);
        
        // $("#start_counter_id").addClass("selectpicker");
        // $("#end_counter_id").addClass("selectpicker");

    }
}
