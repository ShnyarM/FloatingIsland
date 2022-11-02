const errorP = document.getElementById("error")
const nameInput = document.getElementById("name")
nameInput.addEventListener("input", checkNameInput)

function login(){
  let data = []
  data[0] = nameInput.value
  data[1] = document.getElementById("password").value

  if(data[0] == "" || data[1] == "") {errorP.innerHTML = "All fields must be filled out!"; return}//stop if one input is empty

  hash(data[1]+"123salt"+data[0]).then((hex) => {  //create Hash from password with added salt
    data[1] = hex
    send() //send data to server
  });

  function send(){
    axios.post('/req/login', data)
    .then(() => {
      window.location.href = "/";
    })
    .catch(() => {
      errorP.innerHTML = "Username or password is wrong!"
    });
  }
}

function checkNameInput(){ //Remove forbidden chars
  nameInput.value = removeSpecialChars(nameInput.value)
}