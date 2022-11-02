const errorP = document.getElementById("error")
const nameInput = document.getElementById("name")
nameInput.addEventListener("input", checkNameInput)

function register(){
  let data = []
  data[0] = nameInput.value
  data[1] = document.getElementById("password").value
  data[2] = document.getElementById("confirmPassword").value

  if(data[0] == "" || data[1] == "" || data[2] == "") {errorP.innerHTML = "All fields must be filled out!"; return} //stop if one input is empty
  if(data[1] != data[2]) {errorP.innerHTML = "Passwords do not match up!"; return} //stop if passwords dont match up

  hash(data[1]+"123salt"+data[0]).then((hex) => {  //create Hash from password with added salt
    data[1] = hex
    data.pop() //remove last element
    send() //send data to server
  });

  function send(){
    axios.post('/req/register', data)
    .then(function (response) {
      window.location.href = "/";
    })
    .catch(function (error) {
      if(error.response.data == "usernameTaken") errorP.innerHTML = "Username is already taken!"
      else errorP.innerHTML = "Invalid data!"
    });
  }
}

function checkNameInput(){ //Remove forbidden chars
  nameInput.value = removeSpecialChars(nameInput.value)
}