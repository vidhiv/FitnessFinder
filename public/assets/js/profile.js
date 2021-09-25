var url = "http://localhost:3000/";
url = "http://44.199.33.44:3000/";
var workout_requests = [];

function updateWorkoutRequest() {
  const nodes = workout_requests.map((el, idx) => {
    return `<div class="messages"><div class="avatar"><img id="workout_avatar_${idx}" src="../assets/images/user_picture/${el.from_user_id}.jpeg" alt=""></div><div class="friend">
        <div class="user">${el.name}</div></div></div>`;
  });
  $("#request_body").html(nodes.join());
}

$("#changePassword").on("click", function () {
  const password = $("#password").val();
  if(password.length >=6 && password.length <= 12) {
    $.ajax({
      url: url + "changePassword",
      type: "POST",
      crossDomain: true,
      data: {
        password: password,
      },
      success: function (response) {
        if (response.status === "success") {
          $("#modal3").modal("hide");
        } 
        alert(response.message);
      },
      error: function () {
        alert("Plkease try again!!!");
      },
    });
  } else {
    alert("Please provide a password with length (6-12).");
  }
});

$("#deactive").on("click", function () {
  $.ajax({
    url: url + "deactiveUser",
    type: "POST",
    crossDomain: true,
    success: function (response) {
      if (response.status === "success") {
        $("#modaldeactive").modal("hide");
      }
      alert("You will be logged out!");
      window.location.href = "/";
    },
    error: function () {
      alert("failed");
    },
  });
});

$("#editProfile").on("click", function () {
  const profile = $("#profile_form")[0];
  const fd = new FormData(profile);
  $.ajax({
    url: url + "modifyUserInfo",
    type: "POST",
    crossDomain: true,
    data: fd,
    processData: false,
    contentType: false,
    success: function (response) {
      if (response.status === "success") {
        $("#modal4").modal("hide");
        alert("Profile Updated");
        window.location.reload();
      }
    },
    error: function () {
      alert("failed");
    },
  });
});

$("#delaccount").on("click", function () {
  $.ajax({
    url: url + "deleteUser",
    type: "POST",
    crossDomain: true, 
    success: function (response) {
      if (response.status === "success") {
        $("#modaldel").modal("hide");
      }
      alert("Account deleted");
      window.location.href = "/";
    },
    error: function () {
      alert("failed");
    },
  });
});

$("#modal11-button").on("click", function () {
  $.ajax({
    url: url + "getWorkoutRequest",
    type: "POST",
    crossDomain: true,
    success: function (response) {
      if (response.status === "success") {
        const list = response.data;
        workout_requests = list;
        updateWorkoutRequest();
      } else {
        alert(response.message);
      }
    },
    error: function () {
      alert("failed");
    },
  });
})