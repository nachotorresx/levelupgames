// Clase principal del Juego
class Juego {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ancho = canvas.width;
        this.alto = canvas.height;

        // Estados posibles
        this.MENU = 'menu';
        this.JUGANDO = 'jugando';
        this.COMPLETADO = 'completado';
        this.PERDIDO = 'perdido';

        this.estadoActual = this.MENU;

        // Componentes
        this.cargadorImagenes = new CargadorImagenes();
        this.menu = new MenuPrincipal(this.ancho, this.alto);
        this.temporizador = new Temporizador(30); // 30 segundos por nivel
        this.puzzle = null;

        // Niveles
        this.nivelActual = 1;
        this.nivelMaximo = 10;
        this.tamañoCuadricula = 2;

        // Tiempo al completar nivel
        this.tiempoAlCompletar = '';

        // Sistema de ayuda
        this.ayudaDisponible = true;
        this.botonAyuda = null;
        this.crearBotonAyuda();

        // Fondo
        this.imagenFondo = new Image();
        this.imagenFondo.src = '../img/fondoPuzzle.jpg';

        // Botones de pantalla completada
        this.botonesCompletado = [];
        this.crearBotonesCompletado();

        // Botones de pantalla perdido
        this.botonesPerdido = [];
        this.crearBotonesPerdido();

        // Configurar eventos
        this.configurarEventos();

        // Cargar imágenes
        this.cargarImagenes();
    }

    // Método auxiliar para dibujar texto con estilo
    dibujarTextoConEstilo(texto, x, y, tamaño, colorRelleno, shadowBlur, shadowOffset) {
        this.ctx.font = `${tamaño}px Nunito`;

        // Sombra
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = shadowBlur;
        this.ctx.shadowOffsetX = shadowOffset;
        this.ctx.shadowOffsetY = shadowOffset;

        // Relleno
        this.ctx.fillStyle = colorRelleno;
        this.ctx.fillText(texto, x, y);

        // Limpiar efectos
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    cargarImagenes() {
        // Llamar a cargar y pasarle una función que se ejecutará cuando termine
        this.cargadorImagenes.cargarTodas(() => {
            // Las imágenes ya están cargadas, el juego puede continuar
            this.bucleJuego();
        });
    }

    configurarEventos() {
        // Click izquierdo
        this.canvas.addEventListener('click', (e) => {
            this.manejarClick(e);
        });

        // Click derecho
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.manejarClickDerecho(e);
        });

        // Movimiento del mouse
        this.canvas.addEventListener('mousemove', (e) => {
            this.manejarMovimientoMouse(e);
        });
    }

    obtenerPosicionMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    manejarClick(e) {
        const pos = this.obtenerPosicionMouse(e);

        if (this.estadoActual === this.MENU) {
            const accion = this.menu.manejarClick(pos.x, pos.y);
            if (accion === 'comenzar') {
                this.comenzarJuego();
            }
        } else if (this.estadoActual === this.JUGANDO) {
            // Verificar si hizo click en el botón de ayuda
            if (this.clickEnBotonAyuda(pos.x, pos.y)) {
                this.usarAyuda();
            } else {
                const pieza = this.puzzle.obtenerPiezaEn(pos.x, pos.y);
                if (pieza) {
                    pieza.rotarIzquierda();
                    this.verificarCompletado();
                }
            }
        } else if (this.estadoActual === this.COMPLETADO) {
            this.manejarClickCompletado(pos.x, pos.y);
        } else if (this.estadoActual === this.PERDIDO) {
            this.manejarClickPerdido(pos.x, pos.y);
        }
    }

    manejarClickDerecho(e) {
        const pos = this.obtenerPosicionMouse(e);

        if (this.estadoActual === this.JUGANDO) {
            const pieza = this.puzzle.obtenerPiezaEn(pos.x, pos.y);
            if (pieza) {
                pieza.rotarDerecha();
                this.verificarCompletado();
            }
        }
    }

    manejarMovimientoMouse(e) {
        const pos = this.obtenerPosicionMouse(e);

        if (this.estadoActual === this.MENU) {
            // Detecta si el mouse está sobre algún botón del menú
            this.menu.manejarMovimientoMouse(pos.x, pos.y);
        } else if (this.estadoActual === this.JUGANDO) {
            // Detecta si el mouse está sobre el botón de ayuda
            this.actualizarHoverBotonAyuda(pos.x, pos.y);
        } else if (this.estadoActual === this.COMPLETADO) {
            // Detecta si el mouse está sobre los botones "Menú" o "Siguiente"
            this.actualizarHoverBotonesCompletado(pos.x, pos.y);
        } else if (this.estadoActual === this.PERDIDO) {
            // Detecta si el mouse está sobre los botones de pantalla perdido
            this.actualizarHoverBotonesPerdido(pos.x, pos.y);
        }
    }

    comenzarJuego() {
        this.nivelActual = 1;
        this.tamañoCuadricula = this.menu.obtenerTamañoCuadricula();
        // Resetear las imágenes usadas al comenzar un nuevo juego
        this.cargadorImagenes.resetearImagenesUsadas();
        this.iniciarNivel();
    }

    iniciarNivel() {
        const imagenAleatoria = this.cargadorImagenes.obtenerImagenAleatoria();
        this.puzzle = new Puzzle(imagenAleatoria, this.tamañoCuadricula, this.nivelActual, this.ancho, this.alto);
        this.temporizador.reiniciar();
        this.temporizador.iniciar();
        this.estadoActual = this.JUGANDO;
        // Resetear la ayuda para el nuevo nivel
        this.ayudaDisponible = true;
    }

    clickEnBotonAyuda(x, y) {
        const btn = this.botonAyuda;
        return (x >= btn.x && x <= btn.x + btn.ancho &&
            y >= btn.y && y <= btn.y + btn.alto);
    }

    actualizarHoverBotonAyuda(x, y) {
        if (this.ayudaDisponible) {
            this.botonAyuda.hover = this.clickEnBotonAyuda(x, y);
        } else {
            this.botonAyuda.hover = false;
        }
    }

    usarAyuda() {
        // Solo se puede usar si está disponible
        if (!this.ayudaDisponible) {
            return;
        }

        // Buscar una pieza incorrecta
        const piezaIncorrecta = this.puzzle.obtenerPiezaIncorrecta();

        if (piezaIncorrecta) {
            // Colocar la pieza en la posición correcta
            piezaIncorrecta.colocarEnPosicionCorrecta();

            // Restar 5 segundos al temporizador
            this.temporizador.restarTiempo(5);

            // Marcar la ayuda como usada
            this.ayudaDisponible = false;

            // Verificar si se completó el puzzle
            this.verificarCompletado();
        }
    }

    verificarCompletado() {
        if (this.puzzle.verificarCompletado()) {
            // Guardar el tiempo transcurrido ANTES de detener el temporizador
            this.tiempoAlCompletar = this.temporizador.obtenerTiempoTranscurrido();
            this.temporizador.detener();
            //agrego 1 segundo antes de mostrar el cartel GANASTE
            this.estadoActual = this.JUGANDO;
            setTimeout(() => {
                this.estadoActual = this.COMPLETADO;
            }, 500)
        }
    }

    verificarTiempo() {
        // Verificar si se acabó el tiempo
        if (this.temporizador.seAcaboElTiempo()) {
            this.temporizador.detener();
            this.estadoActual = this.PERDIDO;
        }
    }

    crearBotonesCompletado() {
        const anchoBton = 200;
        const altoBton = 50;
        const centroX = this.ancho / 2;
        const posY = this.alto - 100;

        this.botonesCompletado = [
            {
                id: 'menu',
                x: centroX - anchoBton - 20,
                y: posY,
                ancho: anchoBton,
                alto: altoBton,
                texto: 'Menú Principal',
                color: '#1475E1',
                colorHover: '#0F5BB4',
                hover: false
            },
            {
                id: 'siguiente',
                x: centroX + 20,
                y: posY,
                ancho: anchoBton,
                alto: altoBton,
                texto: 'Siguiente Nivel',
                color: '#1475E1',
                colorHover: '#0F5BB4',
                hover: false
            }
        ];
    }

    crearBotonAyuda() {
        this.botonAyuda = {
            x: this.canvas.width / 2 + 100,
            y: 15,
            ancho: 100,
            alto: 35,
            texto: 'Ayudita!',
            color: '#00C853',
            colorHover: '#45a049',
            colorDeshabilitado: '#BDBDBD',
            hover: false
        };
    }

    crearBotonesPerdido() {
        const anchoBton = 200;
        const altoBton = 50;
        const centroX = this.ancho / 2;
        const posY = this.alto - 100;

        this.botonesPerdido = [
            {
                id: 'menu',
                x: centroX - anchoBton - 20,
                y: posY,
                ancho: anchoBton,
                alto: altoBton,
                texto: 'Menú Principal',
                color: '#2196F3',
                colorHover: '#0b7dda',
                hover: false
            },
            {
                id: 'reintentar',
                x: centroX + 20,
                y: posY,
                ancho: anchoBton,
                alto: altoBton,
                texto: 'Reintentar',
                color: '#1475E1',
                colorHover: '#0A4186',
                hover: false
            }
        ];
    }

    actualizarHoverBotonesCompletado(x, y) {
        for (let i = 0; i < this.botonesCompletado.length; i++) {
            const btn = this.botonesCompletado[i];
            btn.hover = (x >= btn.x && x <= btn.x + btn.ancho &&
                y >= btn.y && y <= btn.y + btn.alto);
        }
    }

    manejarClickCompletado(x, y) {
        for (let i = 0; i < this.botonesCompletado.length; i++) {
            const btn = this.botonesCompletado[i];
            if (x >= btn.x && x <= btn.x + btn.ancho &&
                y >= btn.y && y <= btn.y + btn.alto) {

                if (btn.id === 'menu') {
                    this.estadoActual = this.MENU;
                } else if (btn.id === 'siguiente') {
                    this.nivelActual++;
                    if (this.nivelActual > this.nivelMaximo) {
                        this.nivelActual = 1;
                    }
                    this.iniciarNivel();
                }
                break;
            }
        }
    }

    actualizarHoverBotonesPerdido(x, y) {
        for (let i = 0; i < this.botonesPerdido.length; i++) {
            const btn = this.botonesPerdido[i];
            btn.hover = (x >= btn.x && x <= btn.x + btn.ancho &&
                y >= btn.y && y <= btn.y + btn.alto);
        }
    }

    manejarClickPerdido(x, y) {
        for (let i = 0; i < this.botonesPerdido.length; i++) {
            const btn = this.botonesPerdido[i];
            if (x >= btn.x && x <= btn.x + btn.ancho &&
                y >= btn.y && y <= btn.y + btn.alto) {

                if (btn.id === 'menu') {
                    this.estadoActual = this.MENU;
                } else if (btn.id === 'reintentar') {
                    this.iniciarNivel();
                }
                break;
            }
        }
    }

    bucleJuego() {
        // Crear un bucle que se ejecuta cada 16 milisegundos (aproximadamente 60 veces por segundo)
        const self = this;
        setInterval(function () {
            self.dibujar();
        }, 16);
    }

    dibujar() {
        // Limpiar canvas
        this.ctx.fillStyle = '#e8e8e8ff';
        this.ctx.fillRect(0, 0, this.ancho, this.alto);

        if (this.estadoActual === this.MENU) {
            this.menu.dibujar(this.ctx);
            this.dibujarInstruccionesMenu();
        } else if (this.estadoActual === this.JUGANDO) {
            this.verificarTiempo();
            this.dibujarJugando();
        } else if (this.estadoActual === this.COMPLETADO) {
            this.dibujarCompletado();
        } else if (this.estadoActual === this.PERDIDO) {
            this.dibujarPerdido();
        }
    }

        dibujarInstruccionesMenu() {
        const ctx = this.ctx;

        // === Fondo del panel de instrucciones ===
        const anchoPanel = 600;
        const altoPanel = 230;
        const x = (this.ancho - anchoPanel) / 2;
        const y = (this.alto - altoPanel) / 2 - 210; // un poco más abajo del centro
        const radio = 20;

        // Sombra suave para el panel
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.roundRect(x, y, anchoPanel, altoPanel, radio);
        ctx.fillStyle = 'rgba(26, 44, 56, 0.85)';
        ctx.fill();

        // Quitar sombra
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // === Texto ===
        const instrucciones = [
            '🧩  Cómo jugar:',
            '• Hacé clic en “Comenzar” para iniciar el nivel.',
            '• Girá las piezas con clic izquierdo o derecho.',
            '• Ordená la imagen antes de que se acabe el tiempo.',
            '• Usá la ayudita si te trabás (resta 5 segundos).',
            '¡Scrollea y mira las imagenes representativas del juego!'
        ];

        ctx.fillStyle = 'white';
        ctx.font = '18px Nunito';
        ctx.textAlign = 'center';

        let yTexto = y + 50;
        const interlineado = 28;

        instrucciones.forEach((linea) => {
            ctx.fillText(linea, this.ancho / 2, yTexto);
            yTexto += interlineado;
        });
    }

    dibujarInstruccionesDuranteJuego() {
        const instrucciones = [
            '• Hacé clic en “Comenzar” para iniciar',
                 'el nivel y activar el temporizador..',
            '• Seleccioná una subimagen para girarla:' ,
                '-Clic izquierdo gira hacia la izquierda', 
                '-Clic derecho gira hacia la derecha',
            '• Ordená las piezas hasta completar',
            '   la imagen',
            '• Usá la ayudita si te trabás (resta 5 seg)',
            '• Elegí si querés volver al Menú Principal ',
             'o avanzar al siguiente nivel mas difícil.'
        ];

        const x = 20;
        const yInicial = 120;
        const interlineado = 24;

        this.ctx.fillStyle = '#213743';
        this.ctx.font = '18px Nunito';
        this.ctx.textAlign = 'left';

        instrucciones.forEach((texto, i) => {
            this.ctx.fillText(texto, x, yInicial + i * interlineado);
        });
    }


    dibujarJugando() {
        // Fondo
        this.ctx.fillStyle = '#F1B252';

        this.ctx.fillRect(0, 0, this.ancho, this.alto);

        // Nivel
        this.ctx.textAlign = 'left';
        this.dibujarTextoConEstilo('Nivel ' + this.nivelActual, 20, 40, 28, '#213743', 3, 4, 2);

        this.dibujarInstruccionesDuranteJuego();

        // Timer
        this.temporizador.dibujar(this.ctx, this.ancho / 2, 40);

        // Botón de ayuda
        this.dibujarBotonAyuda();

        // Puzzle
        if (this.puzzle) {
            this.puzzle.dibujar(this.ctx);
        }
    }

    dibujarBotonAyuda() {
        const btn = this.botonAyuda;

        // Determinar el color según el estado
        let color;
        if (!this.ayudaDisponible) {
            color = btn.colorDeshabilitado;
        } else if (btn.hover) {
            color = btn.colorHover;
        } else {
            color = btn.color;
        }

        const radio = 12; // radio de esquinas redondeadas

        // Sombra suave
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 3;

        // Fondo del botón redondeado
        this.ctx.beginPath();
        this.ctx.roundRect(btn.x, btn.y, btn.ancho, btn.alto, radio);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Quitar sombra
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Texto
        this.ctx.fillStyle = this.ayudaDisponible ? 'white' : '#757575';
        this.ctx.font = '18px Nunito';
        this.ctx.textAlign = 'center';
        const centroY = btn.y + btn.alto / 2 + 6;
        this.ctx.fillText(btn.texto, btn.x + btn.ancho / 2, centroY);
    }


    dibujarCompletado() {
        // === Fondo general del canvas ===
        this.ctx.fillStyle = '#F1B252';

        this.ctx.fillRect(0, 0, this.ancho, this.alto);

        // Puzzle completado
        if (this.puzzle) {
            this.puzzle.dibujar(this.ctx);
        }

        // === MODAL CENTRAL ===
        const modalAncho = 480;
        const modalAlto = 230;
        const modalX = this.ancho / 2 - modalAncho / 2;
        const modalY = this.alto / 2 - modalAlto / 2 - 40;
        const radio = 20;

        // Sombra del modal
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 16;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 8;

        // Fondo redondeado del modal
        this.ctx.beginPath();
        this.ctx.roundRect(modalX, modalY, modalAncho, modalAlto, radio);
        this.ctx.fillStyle = '#213743';
        this.ctx.fill();

        // Quitar sombra
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        // === TEXTOS DENTRO DEL MODAL ===
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'white';

        // “GANASTE!!”
        this.dibujarTextoConEstilo('GANASTE!!', this.ancho / 2, modalY + 80, 56, 'white', 4, 10, 4);

        // “Tiempo”
        this.dibujarTextoConEstilo('Tiempo: ' + this.tiempoAlCompletar, this.ancho / 2, modalY + 140, 36, 'white', 3, 6, 3);

        // “Nivel completado”
        this.dibujarTextoConEstilo('Nivel ' + this.nivelActual + ' completado', this.ancho / 2, modalY + 190, 28, 'white', 2, 5, 2);

        // === BOTONES ===
        for (let i = 0; i < this.botonesCompletado.length; i++) {
            const btn = this.botonesCompletado[i];
            const color = btn.hover ? btn.colorHover : btn.color;
            const radioBtn = 12;

            // Sombra de los botones
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 4;

            // Fondo del botón redondeado
            this.ctx.beginPath();
            this.ctx.roundRect(btn.x, btn.y, btn.ancho, btn.alto, radioBtn);
            this.ctx.fillStyle = color;
            this.ctx.fill();

            // Quitar sombra
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;

            // Texto del botón
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Nunito';
            this.ctx.textAlign = 'center';
            const centroY = btn.y + btn.alto / 2 + 6;
            this.ctx.fillText(btn.texto, btn.x + btn.ancho / 2, centroY);
        }
    }


    dibujarPerdido() {
        // === Fondo general ===
        this.ctx.fillStyle = '#F1B252';

        this.ctx.fillRect(0, 0, this.ancho, this.alto);

        // Puzzle incompleto
        if (this.puzzle) {
            this.puzzle.dibujar(this.ctx);
        }

        // === MODAL CENTRAL ===
        const modalAncho = 480;
        const modalAlto = 230;
        const modalX = this.ancho / 2 - modalAncho / 2;
        const modalY = this.alto / 2 - modalAlto / 2 - 40;
        const radio = 20;

        // Sombra del modal
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 16;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 8;

        // Fondo redondeado del modal
        this.ctx.beginPath();
        this.ctx.roundRect(modalX, modalY, modalAncho, modalAlto, radio);
        this.ctx.fillStyle = '#213743';
        this.ctx.fill();

        // Quitar sombra
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // === TEXTOS DENTRO DEL MODAL ===
        this.ctx.textAlign = 'center';

        // Texto principal: ¡SE ACABÓ EL TIEMPO!
        this.dibujarTextoConEstilo('¡Fin del Tiempo!', this.ancho / 2, modalY + 80, 50, 'white', 4, 10, 4
        );

        // Texto secundario: ¡Perdiste!
        this.dibujarTextoConEstilo('¡Perdiste!', this.ancho / 2, modalY + 140, 36, 'white', 3, 6, 3
        );

        // Nivel actual
        this.dibujarTextoConEstilo('Nivel ' + this.nivelActual, this.ancho / 2, modalY + 190, 28, 'white', 2, 5, 2
        );

        // === BOTONES ===
        for (let i = 0; i < this.botonesPerdido.length; i++) {
            const btn = this.botonesPerdido[i];
            const color = btn.hover ? btn.colorHover : btn.color;
            const radioBtn = 12;

            // Sombra del botón
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 4;

            // Botón redondeado
            this.ctx.beginPath();
            this.ctx.roundRect(btn.x, btn.y, btn.ancho, btn.alto, radioBtn);
            this.ctx.fillStyle = color;
            this.ctx.fill();

            // Quitar sombra
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;

            // Texto del botón
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Nunito';
            this.ctx.textAlign = 'center';
            const centroY = btn.y + btn.alto / 2 + 6;
            this.ctx.fillText(btn.texto, btn.x + btn.ancho / 2, centroY);
        }
    }

}
