import { Menu } from './Menu.js';
import { Juego } from './Juego.js';

const canvas = document.getElementById('pegCanvas');
const ctx = canvas.getContext('2d');

let menu;
let juego;
let fondo = new Image();
fondo.src = '../img/game-background.png';

fondo.onload = () => {
  menu = new Menu(ctx, canvas.width, canvas.height, iniciarJuego);
  buclePrincipal();
};

// Bucle de renderizado
function buclePrincipal() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

  if (menu && !juego) {
    menu.dibujar();
  } else if (juego) {
    juego.dibujar();
  }

  requestAnimationFrame(buclePrincipal);
}

function iniciarJuego(config) {
  if (juego) return;

  menu = null;
  juego = new Juego(ctx, canvas.width, canvas.height, config);
  juego.iniciarTimer();

  juego.callbackReiniciar = () => {
  // destruyo la instancia actual (remueve listeners y timer)
  if (juego) {
    juego.destruir();
  }
  juego = null;

  // crear nueva instancia
  iniciarJuego(config);

  // prevenir clicks fantasmas en la nueva instancia (opcional)
  if (juego) juego._lastMouseUp = Date.now();
};

juego.callbackMenu = () => {
  if (juego) {
    juego.destruir();
  }
  juego = null;
  menu = new Menu(ctx, canvas.width, canvas.height, iniciarJuego);
};


}
