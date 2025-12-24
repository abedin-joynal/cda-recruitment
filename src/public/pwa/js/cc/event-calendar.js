
    var oldEvent,
        tempEvent = {},
        deleteEvent,
        restoreEvent,
        colorPicker,
        tempColor,
        $title = $('#event-title'),
        $description = $('#event-desc'),
        $total_amount = $('#event-total-amount'),
        $total_paid = $('#event-total-paid'),
        $total_due = $('#event-total-due'),
        $total_security_deposit = $('#event-total-security-deposit'),
        $total_security_deposit_paid = $('#event-total-security-deposit-paid'),
        $total_security_deposit_due = $('#event-total-security-deposit-due'),
        $total_security_deposit_deduction = $('#event-total-security-deposit-deduction'),
        $total_security_deposit_returned = $('#event-total-security-deposit-returned'),
        $allDay = $('#event-all-day'),
        $statusFree = $('#event-status-free'),
        $statusBusy = $('#event-status-busy'),
        $deleteButton = $('#event-delete'),
        $color = $('#event-color'),
        datePickerResponsive = {
            medium: {
                controls: ['calendar'],
                touchUi: false
            }
        },
        datetimePickerResponsive = {
            medium: {
                controls: ['calendar', 'time'],
                touchUi: false
            }
        },
        now = new Date(),
        myData = [{
            id: 1,
            start: '2022-10-08T13:00',
            end: '2022-10-08T13:45',
            title: 'Lunch @ Butcher\'s',
            description: '',
            allDay: false,
            free: true,
            color: '#009788'
        }, {
            id: 2,
            start: '2022-10-13T15:00',
            end: '2022-10-13T16:00',
            title: 'General orientation',
            description: '',
            allDay: false,
            free: false,
            color: '#ff9900'
        }, {
            id: 3,
            start: '2022-10-12T18:00',
            end: '2022-10-12T22:00',
            title: 'Dexter BD',
            description: '',
            allDay: false,
            free: true,
            color: '#3f51b5'
        }, {
            id: 4,
            start: '2022-10-14T10:30',
            end: '2022-10-14T11:30',
            title: 'Stakeholder mtg.',
            description: '',
            allDay: false,
            free: false,
            color: '#f44437'
        },{
            id: 2,
            start: '2022-10-12T15:00',
            end: '2022-10-12T16:00',
            title: 'General orientation',
            description: '',
            allDay: false,
            free: false,
            color: '#ff9900'
        }];

    function createAddPopup(elm) {
        // hide delete button inside add popup
        
        $deleteButton.hide();

        deleteEvent = true;
        restoreEvent = false;

        // set popup header text and buttons for adding
        popup.setOptions({
            headerText: 'New event',
            buttons: ['cancel', {
                text: 'Add',
                keyCode: 'enter',
                handler: function () {
                    CALENDAR.updateEvent({
                        id: tempEvent.id,
                        title: tempEvent.title,
                        description: tempEvent.description,
                        allDay: tempEvent.allDay,
                        start: tempEvent.start,
                        end: tempEvent.end,
                        color: tempEvent.color,
                    });
                    // navigate the calendar to the correct view
                    // CALENDAR.navigateToEvent(tempEvent);
                    deleteEvent = false;
                    // popup.close();
                },
                cssClass: 'mbsc-popup-button-primary'
            }]
        });

        // fill popup with a new event data
        $title.mobiscroll('getInst').value = tempEvent.title;
        $description.mobiscroll('getInst').value = '';
        $allDay.mobiscroll('getInst').checked = true;
        range.setVal([tempEvent.start, tempEvent.end]);
        $statusBusy.mobiscroll('getInst').checked = true;
        range.setOptions({ controls: ['date'], responsive: datePickerResponsive });
        // selectColor('', true);

        // set anchor for the popup
        popup.setOptions({ anchor: elm });

        popup.open();
    }

    function createEditPopup(args) {
        var ev = args.event;
        // show delete button inside edit popup
        $deleteButton.show();

        deleteEvent = false;
        restoreEvent = true;

        // set popup header text and buttons for editing
        popup.setOptions({
            headerText: 'Edit event',
            buttons: ['cancel', {
                text: 'Save',
                keyCode: 'enter',
                handler: function () {
                    var date = range.getVal();
                    var eventToSave = {
                        id: ev.id,
                        title: $title.val(),
                        description: $description.val(),
                        total_amount: $total_amount.val(),
                        total_paid: $total_paid.val(),
                        total_due: $total_due.val(),
                        total_security_deposit: $total_security_deposit.val(),
                        total_security_deposit_paid: $total_security_deposit_paid.val(),
                        total_security_deposit_due: $total_security_deposit_due.val(),
                        total_security_deposit_deduction: $total_security_deposit_deduction.val(),
                        total_security_deposit_returned: $total_security_deposit_returned.val(),
                        // allDay: $allDay.mobiscroll('getInst').checked,
                        // start: date[0],
                        // end: date[1],
                        // free: $statusFree.mobiscroll('getInst').checked,
                        color: ev.color,
                    };
                    // update event with the new properties on save button click
                    CALENDAR.updateEvent(eventToSave);
                    // navigate the calendar to the correct view
                    // CALENDAR.navigateToEvent(eventToSave);
                    restoreEvent = false;
                    popup.close();
                },
                cssClass: 'mbsc-popup-button-primary'
            }]
        });

        // fill popup with the selected event data
        $title.mobiscroll('getInst').value = ev.title || '';
        $description.mobiscroll('getInst').value = ev.description || '';
        $total_amount.mobiscroll('getInst').value = ev.total_amount || '';
        $total_paid.mobiscroll('getInst').value = ev.total_paid || '';
        $total_due.mobiscroll('getInst').value = ev.total_due || '';
        $total_security_deposit.mobiscroll('getInst').value = ev.total_security_deposit || '';
        $total_security_deposit_paid.mobiscroll('getInst').value = ev.total_security_deposit_paid || '';
        $total_security_deposit_due.mobiscroll('getInst').value = ev.total_security_deposit_due || '';
        $total_security_deposit_deduction.mobiscroll('getInst').value = ev.total_security_deposit_deduction || '';
        $total_security_deposit_returned.mobiscroll('getInst').value = ev.total_security_deposit_returned || '';
        // $allDay.mobiscroll('getInst').checked = ev.allDay || false;
        // range.setVal([ev.start, ev.end]);
        // selectColor(ev.color, true);

        // if (ev.free) {
        //     $statusFree.mobiscroll('getInst').checked = true;
        // } else {
        //     $statusBusy.mobiscroll('getInst').checked = true;
        // }

        // change range settings based on the allDay
        range.setOptions({
            controls: ev.allDay ? ['date'] : ['datetime'],
            responsive: ev.allDay ? datePickerResponsive : datetimePickerResponsive
        });

        // set anchor for the popup
        popup.setOptions({ anchor: args.domEvent.currentTarget });
        popup.open();
    }

    var popup = $('#demo-add-popup').mobiscroll().popup({
        display: 'bottom',
        contentPadding: false,
        fullScreen: true,
        onClose: function () {
            if (deleteEvent) {
                CALENDAR.removeEvent(tempEvent);
            } else if (restoreEvent) {
                CALENDAR.updateEvent(oldEvent);
            }
        },
        responsive: {
            medium: {
                display: 'anchored',
                width: 400,
                fullScreen: false,
                touchUi: false
            }
        }
    }).mobiscroll('getInst');

    $title.on('input', function (ev) {
        // update current event's title
        tempEvent.title = ev.target.value;
    });

    $description.on('change', function (ev) {
        // update current event's title
        tempEvent.description = ev.target.value;
    });

    $allDay.on('change', function () {
        var checked = this.checked

        // change range settings based on the allDay
        range.setOptions({
            controls: checked ? ['date'] : ['datetime'],
            responsive: checked ? datePickerResponsive : datetimePickerResponsive
        });

        // update current event's allDay property
        tempEvent.allDay = checked;
    });

    var range = $('#event-date').mobiscroll().datepicker({
        controls: ['date'],
        select: 'range',
        startInput: '#start-input',
        endInput: '#end-input',
        showRangeLabels: false,
        touchUi: true,
        responsive: datePickerResponsive,
        onChange: function (args) {
            var date = args.value;

            // update event's start date
            tempEvent.start = date[0];
            tempEvent.end = date[1];
        }
    }).mobiscroll('getInst');

    $('input[name=event-status]').on('change', function () {
        // update current event's free property
        tempEvent.free = $statusFree.mobiscroll('getInst').checked;
    });

    $deleteButton.on('click', function () {
        // delete current event on button click
        CALENDAR.removeEvent(oldEvent);

        popup.close();

        mobiscroll.snackbar({
            button: {
                action: function () {
                    CALENDAR.addEvent(tempEvent);
                },
                text: 'Undo'
            },
            message: 'Event deleted'
        });
    });

    // colorPicker = $('#demo-event-color').mobiscroll().popup({
    //     display: 'bottom',
    //     contentPadding: false,
    //     showArrow: false,
    //     showOverlay: false,
    //     buttons: [
    //         'cancel',
    //         {
    //             text: 'Set',
    //             keyCode: 'enter',
    //             handler: function (ev) {
    //                 setSelectedColor();
    //             },
    //             cssClass: 'mbsc-popup-button-primary'
    //         }
    //     ],
    //     responsive: {
    //         medium: {
    //             display: 'anchored',
    //             anchor: $('#event-color-cont')[0],
    //             buttons: {},
    //         }
    //     }
    // }).mobiscroll('getInst');

    // function selectColor(color, setColor) {
    //     $('.crud-color-c').removeClass('selected');
    //     $('.crud-color-c[data-value="' + color + '"]').addClass('selected');
    //     if (setColor) {
    //         $color.css('background', color || '');
    //     }
    // }

    // function setSelectedColor() {
    //     tempEvent.color = tempColor;
    //     $color.css('background', tempColor);
    //     colorPicker.close();
    // }

    // $('#event-color-picker').on('click', function () {
    //     selectColor(tempEvent.color || '');
    //     colorPicker.open();
    // });


    // $('.crud-color-c').on('click', function (ev) {
    //     var $elm = $(ev.currentTarget);

    //     tempColor = $elm.data('value');
    //     selectColor(tempColor);

    //     if (!colorPicker.s.buttons.length) {
    //         setSelectedColor();
    //     }
    // });


    function initiateEventCalendar() {
        console.log(HALL_BOOKING_DATA)
        CALENDAR = $('.eventcalendar').mobiscroll().eventcalendar({
            clickToCreate: 'double',
            dragToCreate: false,
            dragToMove: false,
            dragToResize: false,
            view: {
                calendar: { labels: true }
            },
            // data: myData,
            data: JSON.parse(HALL_BOOKING_DATA),
            onEventClick: function (args) {
                console.log(args)

                oldEvent = $.extend({}, args.event);
                tempEvent = args.event;

                if (!popup.isVisible()) {
                    createEditPopup(args);
                }
            },
            onEventCreated: function (args) {
                console.log(args);
                console.log(args.inst.state.selectedDate);
                console.log(moment.unix(args.inst.state.selectedDate).format("MM/DD/YYYY"));

                popup.close();

                // store temporary event
                tempEvent = args.event;
                createAddPopup(args.target);
            },
            onEventDeleted: function () {
                mobiscroll.snackbar({
                    button: {
                        action: function () {
                            calendar.addEvent(args.event);
                        },
                        text: 'Undo'
                    },
                    message: 'Event deleted'
                });
            }
        }).mobiscroll('getInst');
    }