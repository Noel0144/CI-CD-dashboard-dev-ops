function checkAuth() {
  if (!localStorage.getItem("githubUser")) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("githubUser");
  localStorage.removeItem("targetRepo");
  window.location.href = "login.html";
}