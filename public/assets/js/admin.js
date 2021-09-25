var url = "http://localhost:3000/";
url = "http://44.199.33.44:3000/";

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

function getUnapprovedEvents() {
    $.ajax({
        url: url + "getEventsDataAdmin",
        type: "POST",
        crossDomain: true,
        data: {
            showevents: 0
        },
        success: function (response) {
            var html = '';

            if (response.status === "success") {
                var data = response.data;
                if (data.length > 0) {
                    for (var id in data) {
                        html += '<div class="row"><div class="event-card"> <a href="#" class="eventBoxDel  list-group-item list-group-item-action flex-column align-items-start">    <div class="d-flex w-100 justify-content-between">        <h5 class="mb-1">' + data[id].title + '</h5>    </div>    <div class="row">        <div class="col-lg-6">' + data[id].address + ' ' + data[id].zipcode + '</div>    </div>    <div class="row">        <div class="col-lg-6">From: ' + formatDate(data[id].from_date) + '</div>        <div class="col-lg-6">To: ' + formatDate(data[id].to_date) + '</div>    </div>    <div class="row">        <div class="col-lg-6">Starting at: ' + data[id].start_time + '</div>        <div class="col-lg-6">Ending at: ' + data[id].end_time + '</div>    </div>    <div class="row">        <div class="col-lg-12">Description: ' + data[id].description + '</div>    </div>    <div class="row">        <div class="col-lg-6 event-organizer" style="text-align: start;">            <div class="col-lg-12">                &nbsp;            </div>            <div class="col-lg-12">                <button type="button" class="btn btn-success btn-sm approveButton" eveid = ' + data[id].event_id + '>                    Approve                </button>   <button type="button" class="btn btn-danger btn-sm rejectButton" eveid = ' + data[id].event_id + '>                    Reject                </button>            </div></div> <div class="col-lg-6 event-organizer" style="text-align: end;"><small>Event                creator</small> <img class="event-creator-image"                src="../assets/images/user_picture/' + data[id].user_id + '.jpeg">        </div>    </div> </a></div></div>';
                    }
                } else {
                    html = '<div class="row"><div class="event-card"><a href="#" class="list-group-item list-group-item-action flex-column align-items-start"><div class="d-flex w-100 justify-content-between"><h5 class="mb-1">No Events found</h5></div></a></div></div>';
                }
            } else {
                html = '<div class="row"><div class="event-card"><a href="#" class="list-group-item list-group-item-action flex-column align-items-start"><div class="d-flex w-100 justify-content-between"><h5 class="mb-1">No Events found</h5></div></a></div></div>';
            }
            $(".viewingAllEventsUser").html(html);
        },
        error: function () {
            alert("Please try again!!!")
        },
    });
}

$(document).on("click", ".approveButton", function () {
    if (confirm("Sure APPROVE event?") === true) {
        var obj = $(this);
        event_id = obj.attr("eveid");
        $.ajax({
            url: url + "updateEventStatusAdmin",
            type: "POST",
            crossDomain: true,
            data: {
                event_id: event_id,
                set: 1
            },
            success: function (response) {
                if (response.status === "success") {
                    alert("Event Approved!!!");
                    obj.closest('.row').remove();
                } else {
                    alert(response.message);
                }
            },
        });
    }
});


$(document).on("click", ".rejectButton", function () {
    if (confirm("Sure REJECT event?") === true) {
        var obj = $(this);
        event_id = obj.attr("eveid");
        $.ajax({
            url: url + "updateEventStatusAdmin",
            type: "POST",
            crossDomain: true,
            data: {
                event_id: event_id,
                set: 3
            },
            success: function (response) {
                if (response.status === "success") {
                    alert("Event Rejected!!!");
                    obj.closest('.row').remove();
                } else {
                    alert(response.message);
                }
            },
        });
    }
});

getUnapprovedEvents();