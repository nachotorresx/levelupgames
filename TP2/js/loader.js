window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    loader.style.animation = "fadeOut 0.8s ease forwards";

    setTimeout(() => {
      loader.style.display = "none";
      document.getElementById("content").style.display = "block";
    }, 800);
  }, 5000);
});

/animacion de porcentaje/ 

let percentText = document.getElementById("percent");
let count = 0;

let interval = setInterval(() => {
  count++;
  percentText.textContent = count + "%";

  if (count === 100) {
    clearInterval(interval);
  }
}, 50);