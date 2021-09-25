//VIDHI - Event us PAGE
var url = "http://localhost:3000/";
url = "http://44.199.33.44:3000/";

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

function getEvents() {
    var zip_code;
    if ($("#filterzipcode").val().length == 5) {
        zip_code = $("#filterzipcode").val();
    }
    $.ajax({
        url: url + "getFilterEvents",
        type: "POST",
        crossDomain: true,
        data: {
            zip_code: zip_code,
            showevents: 1
        },
        success: function (response) {
            var html = '';
            if (response.status === "success") {
                var data = response.data;
                if (data.eventsinfo.length > 0) {
                    data = data.eventsinfo;
                    for (var id in data) { 
                        html += '   <div class="event-card"><a target= "_blank" href="eventProfile?eventId=' + data[id].event_id + '" class="list-group-item list-group-item-action flex-column align-items-start"> <div class="d-flex w-100 justify-content-between"><h5 class="mb-1">' + data[id].title + '</h5></div><div class="row"><div class="col-lg-6">' + data[id].address + ' ' + data[id].zipcode + '</div></div><div class="row"> <div class="col-lg-6">From Date: ' + formatDate(data[id].from_date) + '</div><div class="col-lg-6">To Date: ' + formatDate(data[id].to_date) + '</div> </div><div class="row"> <div class="col-lg-6">Starting at: ' + data[id].start_time + '</div><div class="col-lg-6">Ending at: ' + data[id].end_time + '</div></div><div class="event-organizer" style="text-align: end;"><small>Event creator</small> <img class="event-creator-image" src="../assets/images/user_picture/' + data[id].user_id + '.jpeg"></div><!-- <img class="event-image" src="../images/circle-cropped.png"> --></a></div>'; 
                    }
                } else {
                    html = '<div class="event-card"><a href="#" class="list-group-item list-group-item-action flex-column align-items-start"><div class="d-flex w-100 justify-content-between"><h5 class="mb-1">No Events found</h5></div></a></div>';
                }
                $("#events-list").html(html);
            } else {
                alert(response.message);
            }
        },
        error: function () {
            alert("Please try again!!!")
        },
    });
}

$("#saveEvent").on("click", function () {
    let title = $("#title").val();
    if (title.length == 0) {
        $("#title").css('border', '1px solid red');
        return;
    } else {
        $("#title").css('border', '');
    }
    let description = $("#eventdescription").val();
    if (description.length == 0) {
        $("#eventdescription").css('border', '1px solid red');
        return;
    } else {
        $("#eventdescription").css('border', '');
    }
    let address = $("#address").val();
    if (address.length == 0) {
        $("#address").css('border', '1px solid red');
        return;
    } else {
        $("#address").css('border', '');
    }
    let zipcode = $("#zipcode").val();
    if (zipcode.length == 0) {
        $("#zipcode").css('border', '1px solid red');
        return;
    } else {
        $("#zipcode").css('border', '');
    }
    let date = $("#date").val();
    if (date.length == 0) {
        $("#date").css('border', '1px solid red');
        return;
    } else {
        $("#date").css('border', '');
    }
    let startTime = $("#startTime").val();
    if (startTime.length == 0) {
        $("#startTime").css('border', '1px solid red');
        return;
    } else {
        $("#startTime").css('border', '');
    }
    let endTime = $("#endTime").val();
    if (endTime.length == 0) {
        $("#endTime").css('border', '1px solid red');
        return;
    } else {
        $("#endTime").css('border', '');
    }

    $.ajax({
        url: url + "saveEvent",
        type: "POST",
        crossDomain: true,
        data: {
            title: title,
            description: description,
            address: address,
            zipcode: zipcode,
            date: date,
            startTime: startTime,
            endTime: endTime
        },
        success: function (response) {
            if (response.status == "success") {
                alert("Event created");
                window.location.href = "events"
            } else {
                alert(response.message);
            }
        },
        error: function () {
            alert("Something went wrong. Please try again!!!");
        }
    });
});

$(document).on("click", "#join-button", function (e) {
    $.ajax({
        url: url + "joinDisjoinEvent",
        type: "POST",
        crossDomain: true,
        data: {
            event_id: $("#join-button").attr('eventid'),
            acttye: $("#join-button").attr('acttype'),
            is_joined: 1
        },
        success: function (response) {
            if (response.status == "success") {
                alert("Event Joined!!");
                $("#join-button").remove();
                window.location.reload();
            } else {
                alert(response.message);
            }
        },
        error: function () {
            alert("Could not joined!");
        }

    });
});

$(document).on("click", "#leave-button", function (e) {
    $.ajax({
        url: url + "joinDisjoinEvent",
        type: "POST",
        crossDomain: true,
        data: {
            event_id: $("#leave-button").attr('eventid'),
            acttye: $("#leave-button").attr('acttype'),
            is_joined: 0
        },
        success: function (response) {
            if (response.status == "success") {
                alert("Event Exited!!");
                $("#leave-button").remove();
                window.location.reload();
            } else {
                alert(response.message);
            }
        },
        error: function () {
            alert("Could not exit!");
        }

    });
});


$(document).on("click", "#filterSearch", function () {
    getEvents();
});

$("#searchzipevent").on("click", function () {
    $('#modal6').modal('hide');
});

$(document).on("click", ".deleteCurrentEvent", function () { 
    if (confirm("Sure DELETE event?") === true) {
        var obj  = $(this);
        var tabid = obj.attr("eveid");
        $.ajax({
            url: url + "deleteEvent",
            type: "POST",
            crossDomain: true,
            data: {
                eveid: tabid
            },
            success: function (response) {
                if (response.status == "success") {
                    alert("Event Deleted!!");
                    obj.closest(".eventBoxDel").remove();
                } else {
                    alert(response.message);
                }
            },
            error: function () {
                alert("Error deleting event!!");
            }
        });
      }
});