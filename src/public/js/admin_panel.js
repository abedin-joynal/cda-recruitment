
$(function () {
    
    navigationMenuHighlight();

    $(document).on("click", "#filter-download-csv-btn", function () {
        $("#filter-download-csv").val(1);
        $("#form_filter").submit();
        $("#filter-download-csv").val(0);
    });

    $(document).on("click", ".page-link", function () {
        let link_no = $(this).attr("data-link-no");
        $("#filter-page-no").val(link_no);
        $("#form_filter").submit();
    });

    $(document).on("click", "#record-per-page .dropdown-item", function () {
        let offset = $(this).attr("data-offset");
        $("#filter-offset").val(offset);
        $("#filter-page-no").val(1);
        $("#form_filter").submit();
    });

    $('#start_date').datetimepicker({
        // useCurrent: false,
        format: 'DD-MM-YYYY',
        // date: "18-08-2022", 
        // date: new Date(1434544882775)
    });

    $('#end_date').datetimepicker({
        // useCurrent: false,
        format: 'DD-MM-YYYY'
    });

    $('#start_date').click(function() {
        $('#start_date').datetimepicker("show");
    });

    $('#end_date').click(function() {
        $('#end_date').datetimepicker("show");
    });

    $(document).on("click", ".btn_delete", function() {
        let id = $(this).attr("data-id");
        let route = $(this).attr("data-route");
        $("#deleteModal").modal('show');
        $("#deleteModal").find("#btn_delete").attr("href", `/${route}/delete/${id}`);
    });
});

//Highlight Admin Panel Navigation 
function navigationMenuHighlight() {
    let path_name = window.location.pathname;
    let module_name = path_name.split("/")[1];
    if(module_name == "coaches") {
        module_name = "/coaches/list";
    } else if(module_name == "tickets") {
        module_name = "/tickets/list";
    } else if(module_name == "gps") {
        module_name = "/gps/company-vehicles";
    } else {
        module_name = `/${module_name}/`;
    }

    let $menu_a = $(`.navbar-nav .nav-item a[href='${module_name}']`);
    // $menu_a.hide();
    if($menu_a.hasClass("collapse-item")) {
        $menu_a.closest(".nav-item").addClass("active");
        $menu_a.closest(".collapse").addClass("show");
        $menu_a.addClass("active");
    } else {
        $menu_a.closest(".nav-item").addClass("active");
    }
}

//Create PDf from HTML...
function CreatePDFfromHTML(elem, file_name) {
    var HTML_Width = $(elem).width();
    var HTML_Height = $(elem).height();
    var top_left_margin = 15;
    var PDF_Width = HTML_Width + (top_left_margin * 2);
    var PDF_Height = (PDF_Width * 1.5) + (top_left_margin * 2);
    var canvas_image_width = HTML_Width;
    var canvas_image_height = HTML_Height;

    var totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

    html2canvas($(elem)[0]).then(function (canvas) {
        var imgData = canvas.toDataURL("image/jpeg", 1.0);
        var pdf = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);
        pdf.addImage(imgData, 'JPG', top_left_margin, top_left_margin, canvas_image_width, canvas_image_height);
        for (var i = 1; i <= totalPDFPages; i++) { 
            pdf.addPage(PDF_Width, PDF_Height);
            pdf.addImage(imgData, 'JPG', top_left_margin, -(PDF_Height*i)+(top_left_margin*4),canvas_image_width,canvas_image_height);
        }
        pdf.save(`${file_name}.pdf`);
        // $(elem).hide();
    });
}
