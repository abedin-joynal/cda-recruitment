$(function () {

    if($('#role_id').val() == 4) {
        $("#counter_id").closest(".form-group").removeClass("d-none");
    } else {
        $("#counter_id").closest(".form-group").addClass("d-none");
    }
    
    // getCounters();

    $(document).on('change', '#role_id', function (e) {
        getCounters();
    });

    $(document).on('change', '#company_id', function (e) {
        getCounters();
    });

    async function getCounters() {
        console.log("changed")
        let role_id = $("#role_id").val();
        let $counter_container = $("#counter_id").closest(".form-group");
        if (role_id == 4) { // counter executives
            let company_id = $("#cur_user_company_id").val() == -1 ? $("#company_id").val() : $("#cur_user_company_id").val();
            let res = await axios.post(HOSTURL+'/users/get-company-counters', {
                company_id: company_id,
            });
            console.log(res.data);
            $("#counter_id").html(res.data);
            $counter_container.removeClass("d-none");
        } else {
            $counter_container.addClass("d-none");
        }
    }
});
