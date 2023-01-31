document.querySelector("#subscribeForm").addEventListener("submit", function (e) {
if (!document.querySelector("#email").value.match(/[a-zA-Z0-9_\-\.]+@[a-z]+[\.][a-z]/)) {
    alert("Please enter a valid email Id!");
    e.preventDefault();
}
})
