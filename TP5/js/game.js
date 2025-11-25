//JUEGO FLAPPY
// ============================================================
const GRAVEDAD = 0.2;              // Qué tan rápido cae el avatar (más alto = cae más rápido)
const FUERZA_DE_SALTO = -6;        // Qué tan fuerte salta hacia arriba (negativo porque sube)
const VELOCIDAD_MAXIMA_CAIDA = 10; // Límite de qué tan rápido puede caer
const VELOCIDAD_MAXIMA_SUBIDA = -10; // Límite de qué tan rápido puede subir

const TOPE_SUPERIOR = 0;           // Borde superior de la pantalla
const TOPE_INFERIOR = 590;         // Borde inferior de la pantalla


// Configuración de tubos
const VELOCIDAD_TUBO = 3;          // Qué tan rápido se mueven los tubos
const ANCHO_TUBO = 60;             // Ancho de los tubos en píxeles
const ESPACIO_ENTRE_TUBOS = 200;   // Espacio vertical entre tubo superior e inferior
const INTERVALO_TUBOS = 2000;      // Cada cuánto aparece un par de tubos (milisegundos)

// ============================================================
// PASO 2: VARIABLES DEL JUEGO
// ============================================================


let posicionVertical = 300;   // Dónde está el avatar en el eje Y (altura)
let velocidad = 0;            // Qué tan rápido se mueve (positivo = baja, negativo = sube)
let juegoActivo = true;       // Si el juego está corriendo o pausado

let tubos = [];               // Lista de todos los tubos en pantalla
let temporizadorTubos = null; // Para controlar cuándo aparecen tubos
let juegoIniciado = false;    // Si el juego ha sido iniciado con el botón

// Variables de manzana bonus
let manzanas = [];              // Lista de todos los manzanas bonus en pantalla
const PROBABILIDAD_MANZANA = 0.3; // 30% de chance de que aparezca un manzana con cada tubo
const PUNTOS_POR_MANZANA = 20;    // Puntos que otorga atrapar un manzana

// Variables de puntaje
let puntaje = 0;               // Cantidad de tubos pasados en la ronda actual
let puntajeTotal = 0;          // Puntos totales acumulados en todas las rondas

// Variables del sistema de vidas
let vidas = 3;                 // Cantidad de vidas del jugador
let ultimoPuntajeVidaExtra = 0; // Último puntaje en el que se dio vida extra
const PUNTOS_PARA_VIDA_EXTRA = 100; // Cada 100 puntos se otorga una vida extra

// ============================================================
// PASO 3: OBTENER ELEMENTOS HTML
// ============================================================
// Conectamos con los elementos que están en el HTML

const avatar = document.getElementById('avatar');
const contenedorTubos = document.getElementById('tubos-container');
const contenedorManzanas = document.getElementById('manzanas-container');
const notificacionPuntos = document.getElementById('points-notification');
const explosion = document.getElementById('explosion');
const explosionCtx = explosion ? explosion.getContext('2d') : null;

// ============================================================
// PASO 3.5: SISTEMA DE EXPLOSIÓN CON CANVAS
// ============================================================

let particulas = [];
let explosionActiva = false;

class Particula {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocidadX = (Math.random() - 0.5) * 8;
        this.velocidadY = (Math.random() - 0.5) * 8;
        this.vida = 1.0;
        this.tamano = Math.random() * 4 + 2;
        this.color = this.generarColor();
    }

    generarColor() {
        const colores = [
            { r: 255, g: 100, b: 0 },   // Naranja
            { r: 255, g: 200, b: 0 },   // Amarillo
            { r: 255, g: 50, b: 0 },    // Rojo-naranja
            { r: 255, g: 255, b: 100 }  // Amarillo claro
        ];
        return colores[Math.floor(Math.random() * colores.length)];
    }

    actualizar() {
        this.x += this.velocidadX;
        this.y += this.velocidadY;
        this.velocidadX *= 0.95;
        this.velocidadY *= 0.95;
        this.vida -= 0.02;
        this.tamano *= 0.96;
    }

    dibujar(ctx) {
        ctx.save();
        ctx.globalAlpha = this.vida;

        // Gradiente radial para cada partícula
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.tamano);
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 1)`);
        gradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.tamano, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function crearExplosion(x, y) {
    if (!explosionCtx) return;

    explosionActiva = true;
    particulas = [];

    // Crear 30 partículas desde el centro
    for (let i = 0; i < 30; i++) {
        particulas.push(new Particula(x, y));
    }

    // Mostrar canvas
    explosion.classList.add('active');

    // Animar explosión
    animarExplosion();
}

function animarExplosion() {
    if (!explosionActiva || !explosionCtx) return;

    // Limpiar canvas
    explosionCtx.clearRect(0, 0, 75, 75);

    // Actualizar y dibujar partículas
    for (let i = particulas.length - 1; i >= 0; i--) {
        particulas[i].actualizar();
        particulas[i].dibujar(explosionCtx);

        // Eliminar partículas muertas
        if (particulas[i].vida <= 0) {
            particulas.splice(i, 1);
        }
    }

    // Continuar animación si quedan partículas
    if (particulas.length > 0) {
        requestAnimationFrame(animarExplosion);
    } else {
        explosionActiva = false;
        explosion.classList.remove('active');
    }
}

// ============================================================
// PASO 4: CONFIGURAR CONTROLES
// ============================================================
// Hacer que el avatar salte cuando presionas teclas o haces clic
function iniciar() {
    actualizarDisplay();
}

// Actualizar displays del timer, puntaje y vidas
function actualizarDisplay() {
    const scoreDisplay = document.getElementById("score-display");
    const livesDisplay = document.getElementById("lives-display");

    if (scoreDisplay) {
        // Mostrar puntos totales acumulados + puntos de la ronda actual
        scoreDisplay.textContent = puntajeTotal + puntaje;
    }
    if (livesDisplay) {
        livesDisplay.textContent = vidas;
    }
}

/**
 * Muestra un overlay temporal con el estado del juego después de una colisión
 */
function mostrarEstadoTemporal() {
    // Pausar el juego brevemente
    juegoEnCurso = false;

    // Crear overlay temporal
    const estadoOverlay = document.createElement('div');
    estadoOverlay.className = 'estado-temporal';
    estadoOverlay.innerHTML = `
        <div class="stat-item">
            <h1>¡-1 VIDA!</h1>
        </div>
    `;
    document.body.appendChild(estadoOverlay);

    // Remover overlay y continuar después de 2 segundos
    setTimeout(() => {
        estadoOverlay.remove();
        juegoEnCurso = true;
    }, 1000);
}

// BOTÓN "COMENZAR A JUGAR"
const startBtnBat = document.getElementById("start-btn-bat");

if (startBtnBat) {
    startBtnBat.addEventListener("click", () => {
        juegoIniciado = true;
        juegoActivo = true;

        // Ocultar el overlay
        const overlay = document.getElementById("start-overlay");
        if (overlay) {
            overlay.classList.remove("active");
            overlay.classList.add("hidden");
        }

        // Mostrar estadísticas
        const gameStats = document.getElementById("game-stats");
        if (gameStats) {
            gameStats.classList.remove("hidden");
        }

        // Iniciar el juego
        iniciar();

        // Iniciar el bucle principal y los temporizadores
        buclePrincipal();
        temporizadorTubos = setInterval(crearTubos, INTERVALO_TUBOS);
    });
}

// BOTÓN "JUGAR DE NUEVO"
const restartBtnBat = document.getElementById("restart-btn-bat");

if (restartBtnBat) {
    restartBtnBat.addEventListener("click", () => {
        reiniciarJuego();
    });
}

// Cuando presionas la barra espaciadora
document.addEventListener('keydown', function (evento) {
    const teclaBarra = evento.code === 'Space';

    if (teclaBarra && juegoIniciado && juegoActivo) {
        evento.preventDefault(); // Evitar que la página se desplace
        hacerSaltar();
    }
});

// Cuando haces clic en cualquier parte
document.addEventListener('click', function (evento) {
    // Solo saltar si el juego ya inició y no es el botón de inicio
    if (juegoIniciado && juegoActivo && !evento.target.id.includes('start-btn')) {
        hacerSaltar();
    }
});

// ============================================================
// PASO 5: FUNCIÓN PARA SALTAR
// ============================================================
// Hace que el avatar suba cuando se llama

function hacerSaltar() {
    // Aplicar fuerza hacia arriba
    velocidad = FUERZA_DE_SALTO;

    // Cambiar la animación visual (inclinarlo hacia arriba)
    avatar.classList.remove('avatar-falling');
    avatar.classList.add('avatar-rising');

    // Después de 200 milisegundos, quitar la inclinación
    setTimeout(function () {
        avatar.classList.remove('avatar-rising');
    }, 200);
}

// ============================================================
// PASO 6: ACTUALIZAR EL avatar
// ============================================================
// Esta función se ejecuta muchas veces por segundo

function actualizarAvatar() {
    // --- 6.1: Aplicar Gravedad ---
    // La gravedad hace que el avatar caiga constantemente
    velocidad = velocidad + GRAVEDAD;

    // --- 6.2: Limitar la Velocidad ---
    // No dejar que caiga o suba demasiado rápido
    if (velocidad > VELOCIDAD_MAXIMA_CAIDA) {
        velocidad = VELOCIDAD_MAXIMA_CAIDA;
    }
    if (velocidad < VELOCIDAD_MAXIMA_SUBIDA) {
        velocidad = VELOCIDAD_MAXIMA_SUBIDA;
    }

    // --- 6.3: Mover al Avatar ---
    // Cambiar su posición según la velocidad
    posicionVertical = posicionVertical + velocidad;

    // --- 6.4: Animación Visual ---
    // Si está cayendo rápido, inclinarlo hacia abajo
    const estaCayendo = velocidad > 2;
    const estaSubiendo = velocidad < -2;

    if (estaCayendo) {
        avatar.classList.add('avatar-falling');
        avatar.classList.remove('avatar-rising');
    } else if (estaSubiendo) {
        avatar.classList.remove('avatar-falling');
    }

    // --- 6.5: Evitar que Salga de la Pantalla ---
    // Si toca el techo
    if (posicionVertical < TOPE_SUPERIOR) {
        posicionVertical = TOPE_SUPERIOR;
        velocidad = 0; // Detener el movimiento
    }

    // Si toca el suelo
    if (posicionVertical > TOPE_INFERIOR) {
        posicionVertical = TOPE_INFERIOR;
        velocidad = 0; // Detener el movimiento
        avatar.classList.remove('avatar-falling');
    }

    // --- 6.6: Aplicar la Nueva Posición al HTML ---
    avatar.style.top = posicionVertical + 'px';
}


// ============================================================
// PASO 7: FUNCIONES DE TUBOS
// ============================================================

// Crear un par de tubos (superior e inferior) con un espacio en el medio
function crearTubos() {
    // Calculamos una altura aleatoria para el espacio entre los tubos
    // El espacio debe estar entre el tope superior + margen y el tope inferior - margen
    const margenSeguridad = 100; //Crea un "colchón" de 100 píxeles arriba y abajo para garantizar que el hueco no toque los bordes superior e inferior
    const alturaMinima = TOPE_SUPERIOR + margenSeguridad;
    const alturaMaxima = TOPE_INFERIOR - ESPACIO_ENTRE_TUBOS - margenSeguridad;

    // Posición Y del borde inferior del tubo superior
    const alturaEspacio = Math.random() * (alturaMaxima - alturaMinima) + alturaMinima;

    // --- CREAR TUBO SUPERIOR ---
    const tuboSuperior = document.createElement('div');
    tuboSuperior.className = 'tubo tubo-top';
    tuboSuperior.style.left = '1300px';
    tuboSuperior.style.height = alturaEspacio + 'px';
    contenedorTubos.appendChild(tuboSuperior);

    // --- CREAR TUBO INFERIOR ---
    const tuboInferior = document.createElement('div');
    tuboInferior.className = 'tubo tubo-bottom';
    tuboInferior.style.left = '1300px';
    const alturaTuboInferior = TOPE_INFERIOR + 100 - (alturaEspacio + ESPACIO_ENTRE_TUBOS);
    tuboInferior.style.height = alturaTuboInferior + 'px';
    contenedorTubos.appendChild(tuboInferior);

    // Guardamos ambos tubos como un par en nuestra lista
    tubos.push({
        elementoSuperior: tuboSuperior,
        elementoInferior: tuboInferior,
        posicionX: 1300,
        alturaEspacio: alturaEspacio,
        alturaTuboInferior: alturaEspacio + ESPACIO_ENTRE_TUBOS,
        contado: false  // Para saber si ya sumamos el punto por este tubo
    });

    // --- CREAR MANZANA BONUS (30% DE PROBABILIDAD) ---
    // Generamos un número aleatorio entre 0 y 1
    const numeroAleatorio = Math.random();

    // Si el número es menor a 0.3 (30% de probabilidad), creamos un manzana
    if (numeroAleatorio < PROBABILIDAD_MANZANA) {
        crearManzana(1300, alturaEspacio);
    }
}

// ============================================================
// PASO 8: FUNCIONES DE MANZANA BONUS
// ============================================================

/**
 * Crea un manzana bonus que aparece sobre el tubo inferior
 * @param {number} posicionX - Posición horizontal inicial del manzana (donde está el tubo)
 * @param {number} alturaEspacio - Altura donde termina el tubo superior (inicio del espacio)
 */
function crearManzana(posicionX, alturaEspacio) {
    // Verificar que existe el contenedor de manzanas
    if (!contenedorManzanas) {
        console.error('No se encontró el contenedor de manzanas');
        return;
    }

    // --- PASO 1: CREAR EL ELEMENTO HTML DE LA MANZANA ---
    const manzana = document.createElement('div');
    manzana.className = 'manzana';

    // --- PASO 2: CALCULAR LA POSICIÓN HORIZONTAL ---
    // El manzana debe estar centrado en el tubo
    // Tubo: 60px de ancho, Manzana: 40px de ancho
    // Para centrar: (60 - 40) / 2 = 10px de offset
    const offsetCentrado = (ANCHO_TUBO - 40) / 2;
    const posicionXCentrada = posicionX + offsetCentrado;

    // --- PASO 3: CALCULAR LA POSICIÓN VERTICAL ---
    // El manzana debe aparecer justo arriba del tubo inferior
    // alturaEspacio + ESPACIO_ENTRE_TUBOS = donde empieza el tubo inferior
    // Le restamos 60px para que aparezca encima del tubo
    const posicionYManzana = alturaEspacio + ESPACIO_ENTRE_TUBOS - 60;

    // --- PASO 4: APLICAR LAS POSICIONES AL ELEMENTO ---
    manzana.style.left = posicionXCentrada + 'px';
    manzana.style.top = posicionYManzana + 'px';
    manzana.style.transform = 'translateY(40px)';
    manzana.style.opacity = '0';

    // --- PASO 5: AGREGAR LA MANZANA AL DOM ---
    contenedorManzanas.appendChild(manzana);
    console.log('Manzana creado en:', posicionXCentrada, posicionYManzana);

    // --- PASO 6: INICIAR LA ANIMACIÓN DE EMERGENCIA ---
    // Pequeño delay para que el CSS pueda aplicar la posición inicial
    setTimeout(() => {
        manzana.classList.add('emerging');
        console.log('Animación de manzana iniciada');
    }, 50);

    // --- PASO 7: GUARDAR LA MANZANA EN NUESTRO ARRAY ---
    manzanas.push({
        elemento: manzana,           // Referencia al elemento HTML
        posicionX: posicionX,      // Posición X inicial (igual al tubo)
        posicionY: posicionYManzana  // Posición Y calculada
    });
}

/**
 * Actualiza la posición de todos los manzanas (los mueve junto con los tubos)
 */
function actualizarManzanas() {
    // Recorremos el array de manzanas de atrás hacia adelante
    // (así podemos eliminar elementos sin problemas)
    for (let i = manzanas.length - 1; i >= 0; i--) {
        const manzana = manzanas[i];

        // --- MOVER EL MANZANA A LA IZQUIERDA ---
        // Los manzanas se mueven a la misma velocidad que los tubos
        manzana.posicionX -= VELOCIDAD_TUBO;

        // Recalcular la posición X centrada
        const offsetCentrado = (ANCHO_TUBO - 40) / 2;
        const posicionXCentrada = manzana.posicionX + offsetCentrado;

        // Actualizar la posición en el HTML
        manzana.elemento.style.left = posicionXCentrada + 'px';

        // --- ELIMINAR MANZANAS QUE SALIERON DE PANTALLA ---
        // Si el manzana salió completamente por la izquierda
        if (manzana.posicionX < -40) {
            // Eliminar del DOM
            manzana.elemento.remove();
            // Eliminar del array
            manzana.splice(i, 1);
        }
    }
}

/**
 * Verifica si el avatar colisionó con algún manzana
 */
function verificarColisionManzana() {
    // --- PASO 1: OBTENER LAS DIMENSIONES DEL AVATAR ---
    const avatarX = 100;              // Posición horizontal fija
    const avatarY = posicionVertical; // Posición vertical actual
    const avatarAncho = 75;           // Ancho del avatar
    const avatarAlto = 50;            // Alto del avatar

    // --- PASO 2: REVISAR CADA MANZANA ---
    for (let i = manzanas.length - 1; i >= 0; i--) {
        const manzana = manzanas[i];
        const manzanaAncho = 40;
        const manzanaAlto = 40;
        const MARGEN = 20;

        const colisionHorizontal =
            avatarX < manzana.posicionX + manzanaAncho + MARGEN &&
            avatarX + avatarAncho > manzana.posicionX - MARGEN;

        const colisionVertical =
            avatarY < manzana.posicionY + manzanaAlto + MARGEN &&
            avatarY + avatarAlto > manzana.posicionY - MARGEN;


        // Si hay colisión en ambos ejes, el avatar atrapó la manzana
        if (colisionHorizontal && colisionVertical) {
            // --- PASO 4: DAR PUNTOS AL JUGADOR ---
            const puntajeAnterior = puntaje;
            puntaje += PUNTOS_POR_MANZANA;

            console.log('MANZANA ATRAPADO! Puntos:', puntajeAnterior, '->', puntaje);

            actualizarDisplay();

            // Calcular el puntaje total actual (acumulado + ronda actual)
            const puntajeTotalAnterior = puntajeTotal + puntajeAnterior;
            const puntajeTotalActual = puntajeTotal + puntaje;

            // Verificar si cruzamos un múltiplo de 100 para vida extra
            const multiploVidaAnterior = Math.floor(puntajeTotalAnterior / PUNTOS_PARA_VIDA_EXTRA);
            const multiploVidaActual = Math.floor(puntajeTotalActual / PUNTOS_PARA_VIDA_EXTRA);

            // Si cruzamos a un nuevo múltiplo de 100
            if (multiploVidaActual > multiploVidaAnterior && multiploVidaActual > 0) {
                vidas++;
                ultimoPuntajeVidaExtra = multiploVidaActual * PUNTOS_PARA_VIDA_EXTRA;
                actualizarDisplay();
                console.log('¡VIDA EXTRA por manzana! Total vidas:', vidas, '| Puntos totales:', puntajeTotalActual, '| Múltiplo:', multiploVidaActual * PUNTOS_PARA_VIDA_EXTRA);

                // Mostrar notificación de vida extra
                mostrarNotificacionVidaExtra();
            }

            // --- PASO 5: MOSTRAR NOTIFICACIÓN DE PUNTOS ---
            mostrarNotificacionPuntos(manzana.posicionX, manzana.posicionY);

            // --- PASO 6: ELIMINAR EL MANZANA ---
            manzana.elemento.remove();  // Quitar del DOM
            manzanas.splice(i, 1);      // Quitar del array
        }
    }
}

/**
 * Muestra una notificación cuando se gana una vida extra
 */
function mostrarNotificacionVidaExtra() {
    const displayVidaExtra = document.getElementById('vida-extra-display');

    if (displayVidaExtra) {
        // Mostrar el display
        displayVidaExtra.classList.remove('hidden');
        displayVidaExtra.classList.add('active');

        console.log('Display de vida extra mostrado');

        // Ocultar después de 2 segundos
        setTimeout(() => {
            displayVidaExtra.classList.remove('active');
            displayVidaExtra.classList.add('hidden');
        }, 2000);
    } else {
        console.error('displayVidaExtra no encontrado!');
    }
}

/**
 * Muestra una notificación visual cuando se atrapa un manzana
 * @param {number} x - Posición X donde mostrar la notificación
 * @param {number} y - Posición Y donde mostrar la notificación
 */
function mostrarNotificacionPuntos(x, y) {
    if (!notificacionPuntos) return;

    // Posicionar la notificación donde estaba el manzana
    notificacionPuntos.style.left = x + 'px';
    notificacionPuntos.style.top = y + 'px';

    // Mostrar la notificación
    notificacionPuntos.style.display = 'block';
    notificacionPuntos.classList.add('show');

    // Ocultar después de 1 segundo
    setTimeout(() => {
        notificacionPuntos.style.display = 'none';
        notificacionPuntos.classList.remove('show');
    }, 1000);
}

/**
 * Función que se llama cuando el avatar colisiona con un tubo
 * Acumula puntos, resta 1 vida, muestra estado y continúa el juego
 * Solo hace game over cuando vidas = 0
 */
function colisionConTubo() {
    // Si ya está en proceso de game over, no hacer nada
    if (!juegoActivo) {
        return;
    }


    // Acumular puntos de esta ronda al total
    puntajeTotal += puntaje;
    console.log('Puntos de esta ronda:', puntaje);
    console.log('Puntos totales acumulados:', puntajeTotal);

    // Restar una vida
    vidas--;
    actualizarDisplay();

    // ANIMACIÓN DEL HUD DE VIDAS
    const livesDisplay = document.getElementById("lives-display");
    livesDisplay.classList.add("vida-danio");

    // Quitar la animación cuando termina (sino no vuelve a activarse la próxima vez)
    setTimeout(() => {
        livesDisplay.classList.remove("vida-danio");
    }, 600);

    // Verificar si se acabaron las vidas
    if (vidas <= 0) {
        // Desactivar el juego inmediatamente para evitar más colisiones
        juegoActivo = false;

        // Game over definitivo
        gameOver();
        puntaje = 0;
    } else {
        // Eliminar todos los tubos que están cerca del avatar para evitar colisiones inmediatas
        limpiarTubosCercanos();

        // Mostrar estado temporal y continuar
        mostrarEstadoTemporal();

        // Resetear posición del avatar
        posicionVertical = 300;
        velocidad = 0;

        // Resetear puntaje del round actual (pero mantener puntajeTotal)
        puntaje = 0;

        // Actualizar display
        actualizarDisplay();
    }
}

// Actualizar todos los tubos (moverlos y eliminar los que salen de pantalla)
function actualizarTubos() {
    const avatarX = 100; // Posición horizontal del avatar

    // Recorremos todos los pares de tubos
    for (let i = tubos.length - 1; i >= 0; i--) {
        const tubo = tubos[i];

        // Movemos los tubos hacia la izquierda
        tubo.posicionX -= VELOCIDAD_TUBO;
        tubo.elementoSuperior.style.left = tubo.posicionX + 'px';
        tubo.elementoInferior.style.left = tubo.posicionX + 'px';

        // Si el avatar pasó el tubo y aún no se contó
        if (!tubo.contado && tubo.posicionX + ANCHO_TUBO < avatarX) {
            tubo.contado = true;
            const puntajeAnterior = puntaje;
            puntaje++;

            console.log('PUNTO SUMADO:', puntaje, '| Anterior:', puntajeAnterior);

            actualizarDisplay();

            // Calcular el puntaje total actual (acumulado + ronda actual)
            const puntajeTotalActual = puntajeTotal + puntaje;
            const puntajeTotalAnterior = puntajeTotal + puntajeAnterior;

            // Verificar si cruzamos un múltiplo de 100 para vida extra
            const multiploVidaAnterior = Math.floor(puntajeTotalAnterior / PUNTOS_PARA_VIDA_EXTRA);
            const multiploVidaActual = Math.floor(puntajeTotalActual / PUNTOS_PARA_VIDA_EXTRA);

            // Si cruzamos a un nuevo múltiplo de 100
            if (multiploVidaActual > multiploVidaAnterior && multiploVidaActual > 0) {
                vidas++;
                ultimoPuntajeVidaExtra = multiploVidaActual * PUNTOS_PARA_VIDA_EXTRA;
                actualizarDisplay();
                console.log('¡VIDA EXTRA! Total vidas:', vidas, '| Puntos totales:', puntajeTotalActual, '| Múltiplo:', multiploVidaActual * PUNTOS_PARA_VIDA_EXTRA);

                // Mostrar notificación de vida extra
                mostrarNotificacionVidaExtra();
            }
        }

        // Si los tubos salieron de la pantalla
        if (tubo.posicionX < -ANCHO_TUBO) {
            // Los eliminamos del HTML
            tubo.elementoSuperior.remove();
            tubo.elementoInferior.remove();
            // Los sacamos de nuestra lista
            tubos.splice(i, 1);
        }
    }
}

/**
 * Elimina los tubos que están cerca del avatar para evitar colisiones inmediatas después de reiniciar
 */
function limpiarTubosCercanos() {
    const avatarX = 100;
    const rangoLimpieza = 300; // Limpiar tubos en un rango de 300px

    for (let i = tubos.length - 1; i >= 0; i--) {
        const tubo = tubos[i];

        // Si el tubo está cerca del avatar
        if (tubo.posicionX > avatarX - rangoLimpieza && tubo.posicionX < avatarX + rangoLimpieza) {
            // Eliminarlo del DOM
            tubo.elementoSuperior.remove();
            tubo.elementoInferior.remove();
            // Eliminarlo del array
            tubos.splice(i, 1);
            console.log('Tubo cercano eliminado en posición:', tubo.posicionX);
        }
    }
}

// Verificar colisiones entre el avatar y los tubos
function verificarColisiones() {

    // Obtener la posición y tamaño del avatar
    const avatarX = 100; // Posición horizontal fija del avatar
    const avatarY = posicionVertical;
    const avatarAncho = 75;
    const avatarAlto = 50;

    // Revisar cada par de tubos
    for (let i = 0; i < tubos.length; i++) {
        const tubo = tubos[i];

        // Si el tubo está en la zona horizontal del avatar
        if (tubo.posicionX < avatarX + avatarAncho &&
            tubo.posicionX + ANCHO_TUBO > avatarX) {

            // Verificar si choca con el tubo superior
            if (avatarY < tubo.alturaEspacio) {
                colisionConTubo();
                return;
            }

            // Verificar si choca con el tubo inferior
            if (avatarY + avatarAlto > tubo.alturaTuboInferior) {
                colisionConTubo();
                return;
            }
        }
    }
}

// Función de fin de juego
function gameOver() {
    juegoActivo = false;
    clearInterval(temporizadorTubos);

    // Ocultar el avatar
    avatar.style.display = 'none';

    // Mostrar explosión en la posición del avatar
    if (explosion) {
        explosion.style.left = avatar.style.left || '100px';
        explosion.style.top = avatar.style.top || posicionVertical + 'px';

        // Crear explosión con partículas en el centro del canvas (37.5, 37.5)
        crearExplosion(37.5, 37.5);

        // Después de la animación de explosión, mostrar game over
        setTimeout(() => {

            // Actualizar resultados finales
            const finalScore = document.getElementById("final-score");
            const finalLives = document.getElementById("final-lives");
            const finalTime = document.getElementById("final-time");

            if (finalScore) {
                // Mostrar puntos totales acumulados (ya incluye los puntos de la última ronda)
                finalScore.textContent = puntajeTotal;
            }
            if (finalLives) {
                finalLives.textContent = vidas;
            }

            // Ocultar estadísticas
            const gameStats = document.getElementById("game-stats");
            if (gameStats) {
                gameStats.classList.add("hidden");
            }

            // Mostrar overlay de game over
            const gameoverOverlay = document.getElementById("gameover-overlay");
            if (gameoverOverlay) {
                gameoverOverlay.classList.remove("hidden");
            }
        }, 600); // Duración de la animación de explosión
    }
}

// Función para reiniciar el juego
function reiniciarJuego() {
    // Si quedan vidas, es un reinicio de ronda (mantener puntos totales y vidas)
    // Si no quedan vidas, es un reinicio completo
    const esReinicioCompleto = vidas <= 0;

    if (esReinicioCompleto) {
        console.log('Reinicio completo - Sin vidas');
        vidas = 3;
        puntajeTotal = 0;
        ultimoPuntajeVidaExtra = 0;
    } else {
        console.log('Reinicio de ronda - Vidas:', vidas, 'Puntos totales:', puntajeTotal);
    }

    // Resetear variables de la ronda actual
    posicionVertical = 300;
    velocidad = 0;
    juegoActivo = true;
    puntaje = 0;

    // Limpiar todos los tubos del DOM y del array
    tubos.forEach(tubo => {
        tubo.elementoSuperior.remove();
        tubo.elementoInferior.remove();
    });
    tubos = [];

    // Limpiar todas las manzanas del DOM y del array
    manzanas.forEach(manzana => {
        manzana.elemento.remove();
    });
    manzanas = [];

    // Ocultar overlay de game over
    const gameoverOverlay = document.getElementById("gameover-overlay");
    if (gameoverOverlay) {
        gameoverOverlay.classList.add("hidden");
    }

    // Mostrar estadísticas
    const gameStats = document.getElementById("game-stats");
    if (gameStats) {
        gameStats.classList.remove("hidden");
    }

    // Reiniciar el avatar en su posición inicial
    avatar.style.display = 'block';
    avatar.style.top = posicionVertical + 'px';
    avatar.classList.remove('avatar-falling', 'avatar-rising');

    // Ocultar explosión si estaba visible
    if (explosion) {
        explosion.classList.remove('active');
    }

    // Actualizar displays
    actualizarDisplay();

    // Reiniciar la cuenta regresiva
    iniciarCuentaRegresiva();

    // Reiniciar el bucle principal y los temporizadores
    buclePrincipal();
    temporizadorTubos = setInterval(crearTubos, INTERVALO_TUBOS);
}

// ============================================================
// PASO 8: BUCLE PRINCIPAL DEL JUEGO
// ============================================================
// Este bucle se repite constantemente (60 veces por segundo aprox)

function buclePrincipal() {
    // Solo ejecutar si el juego está activo
    if (!juegoActivo) {
        return;
    }

    // Actualizar el avatar
    actualizarAvatar();

    // Actualizar todos los tubos
    actualizarTubos();

    // Actualizar todos los manzanas bonus
    actualizarManzanas();

    // Verificar colisiones con tubos
    verificarColisiones();

    // Verificar colisiones con manzanas
    verificarColisionManzana();

    // Volver a ejecutar este bucle en el próximo frame
    requestAnimationFrame(buclePrincipal);
}

// ============================================================
// PASO 9: INICIAR EL JUEGO
// ============================================================
// El juego se iniciará cuando se presione el botón "Comenzar a Jugar"
// No iniciamos automáticamente, esperamos el click del usuario
