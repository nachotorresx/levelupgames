// Importamos las clases principales del proyecto:
// - Menu: pantalla inicial del juego
// - Juego: lógica del tablero, piezas, temporizador y condiciones de victoria
import { Menu } from './Menu.js';
import { Juego } from './Juego.js';

// Obtenemos el canvas del HTML y su contexto 2D para poder dibujar gráficos
const canvas = document.getElementById('pegCanvas');
const ctx = canvas.getContext('2d');

// Variables globales que representan el menú y el juego activo
let menu;
let juego;

// Cargamos la imagen de fondo general del juego
let fondo = new Image();
fondo.src = '../img/game-background.png';

// Cuando la imagen de fondo haya cargado completamente...
fondo.onload = () => {
  // Creamos la instancia del menú principal,
  // pasándole el contexto, el tamaño del canvas y la función para iniciar el juego.
  menu = new Menu(ctx, canvas.width, canvas.height, iniciarJuego);

  // Iniciamos el bucle principal de renderizado (se ejecuta constantemente)
  buclePrincipal();
};

// =======================
// 🎮 Bucle de renderizado principal
// =======================

function buclePrincipal() {
  // Limpiamos el canvas para redibujar desde cero cada frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujamos la imagen de fondo
  ctx.drawImage(fondo, 0, 0, canvas.width, canvas.height);

  // Si estamos en el menú y no hay juego iniciado, dibujamos el menú
  if (menu && !juego) {
    menu.dibujar();
  }
  // Si ya hay una partida activa, dibujamos el tablero del juego
  else if (juego) {
    juego.dibujar();
  }

  // Volvemos a llamar a esta misma función en el siguiente frame de animación.
  // Esto mantiene la animación constante (60 fps aprox)
  requestAnimationFrame(buclePrincipal);
}

// =======================
// 🚀 Función para iniciar una nueva partida
// =======================

function iniciarJuego(config) {
  // Evitamos iniciar el juego si ya existe una instancia activa
  if (juego) return;

  // Eliminamos el menú actual de pantalla
  menu = null;

  // Creamos una nueva instancia del juego, pasándole el contexto, tamaño y configuración
  juego = new Juego(ctx, canvas.width, canvas.height, config);

  // Iniciamos el temporizador del juego (contador regresivo)
  juego.iniciarTimer();

  // ====================================
  // 🔁 Callback: Reiniciar la partida
  // ====================================
  juego.callbackReiniciar = () => {
    // Si ya hay una instancia del juego, primero la destruimos:
    // - elimina listeners del mouse
    // - detiene el timer
    if (juego) {
      juego.destruir();
    }

    // Eliminamos la referencia a la partida actual
    juego = null;

    // Creamos una nueva partida con la misma configuración
    iniciarJuego(config);

    // Pequeño "delay de seguridad" para evitar que el click
    // que activó el reinicio cause efectos no deseados
    if (juego) juego._lastMouseUp = Date.now();
  };

  // ====================================
  // 🏠 Callback: Volver al menú principal
  // ====================================
  juego.callbackMenu = () => {
    // Destruimos la partida actual y limpiamos eventos
    if (juego) {
      juego.destruir();
    }

    // Borramos la instancia del juego
    juego = null;

    // Volvemos a crear el menú principal
    menu = new Menu(ctx, canvas.width, canvas.height, iniciarJuego);
  };
}
