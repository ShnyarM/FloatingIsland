function checkLogin(returnFunction){ //Check if user and id cookies are correct
  axios.get('/req/checkLogin')
  .then(function (response) {
    returnFunction(true)
  })
  .catch(function (error) {
    returnFunction(false)
  });
}

//Get list of friends
function getFriends(){
  if(!loggedIn) return

  axios.get("req/getFriends")
  .then(function (response) {
    if(response.data == "") {friends = []; friendsStatus = {};  return}
    friends = response.data.split("°") //Convert string into array
    for(const friend of friends){ //Get onlineStatus of friends
      axios.post("req/onlineStatus", [friend])
      .then(data => {
        friendsStatus[friend] = data.data
        if(data.data == "Online" || data.data == "In Game"){ //Move to start if online
          friends.unshift(friends.splice(friends.indexOf(friend), 1)[0]); //Add value at start and splice old value
        }
      })
    }
  })
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function deleteCookie(cname){
  document.cookie = cname + "=; expires = Thu, 01 Jan 1970 00:00:00 GMT; path=/"
}

function removeSpecialChars(string){
  return string.replace(/[^a-zA-Z0-9 _-]/g, "")
}

//https://remarkablemark.org/blog/2021/08/29/javascript-generate-sha-256-hexadecimal-hash/
async function hash(string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
