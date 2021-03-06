var url = "http://localhost:3000/";
url = "http://44.199.33.44:3000/";

// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
  'use strict';
  window.addEventListener('load', function () {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function (form) {
      form.addEventListener('submit', function (event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          event.preventDefault();
          event.stopPropagation();
          registerUser();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();

function registerUser() {
  let phone = $("#phone").val();
  if (phone.length != 10) {
    $("#contactfeedback").css("display", "block");
    return;
  } else {
    $("#contactfeedback").css("display", "none");
  }

  let activity_type = "";
  $("#activities button").each(function (index) {
    if ($(this).hasClass("active") === true) {
      activity_type += "," + $(this).data('info');
    }
  });

  if (activity_type == "") {
    $("#actfeedback").css("display", "block");
    return;
  } else {
    $("#actfeedback").css("display", "none");
  }
  activity_type = activity_type.replace(/^,/, '');

  let zip = $("#zip_code").val();
  if (zip.length != 5) {
    $("#zipfeedback").css("display", "block");
    return;
  } else {
    $("#zipfeedback").css("display", "none");
  }

  const birth = $("#validationCustom04").val().split("T")[0];
  const age = new Date().getFullYear() - new Date(birth).getFullYear();
  if (age < 18) {
    alert("You must be 18+ to create account!");
    return;
  }

  // console.log(activity_type);
  $.ajax(
    {
      url: url + "registerUser",
      type: "POST",
      crossDomain: true,
      data: {
        phone: phone,
        zip_code: zip,
        name: $("#validationCustom01").val(),
        gender: $("input[type='radio'][name='radio-stacked']:checked").val(),
        activity_type: activity_type,
        address: $("#address").val(),
        email_id: $("#email_id").val(),
        password: $("#password").val(),
        birthdate: $("#validationCustom04").val()
      },
      success: function (response) {
        if (response.status == "success") {
          alert("Thank you for registering. Go to home page and then log in!!!");
          window.location.href = '/';
        } else {
          alert(response.message);
        }

      },
      error: function () {
        alert("Error!");
      }
    });
}
