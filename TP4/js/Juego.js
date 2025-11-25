// === Clase principal del juego ===
export class Juego {
    constructor(ctx, ancho, alto, config) {
        // Contexto del canvas (donde se dibuja todo)
        this.ctx = ctx;
        this.ancho = ancho;
        this.alto = alto;
        this.config = config;

        // Tiempo del juego (por ahora 300 seg)
        this.tiempoRestante = 300;
        this.intervaloTimer = null;

        // Variables de estado general
        this._lastMouseUp = 0;
        this.mostrarVictoria = false;

        // Función de fin del juego enlazada para eventos
        this._onClick = this.onClickFinJuego.bind(this);

        // === Botón Reiniciar ===
        this.botonReiniciar = {
            x: this.ancho - 150,
            y: 20,
            w: 120,
            h: 40
        };

        // === Botón de Instrucciones ===
        this.mostrarInstrucciones = false; // bandera para mostrar u ocultar
        this.botonInstrucciones = {
            x: 20,
            y: 60,
            w: 130,
            h: 35
        };

        // ==== Carga de imágenes ====
        this.tablero = new Image();
        this.ficha = new Image();
        this.fichaSeleccionada = new Image();
        this.fichaDisponible = new Image();
        this.fichaEliminada = new Image();
        this.fichaHover = new Image();

        // Configuración visual según el tema (dorado o plateado)
        if (config === "dorado") {
            this.tablero.src = "../img/tablero-plateado.png";
            this.ficha.src = "../img/ficha-dorada.png";
            this.fichaSeleccionada.src = "../img/ficha-dorada-selec.png";
            this.fichaHover.src = "../img/ficha-dorada-hover.png";
        } else {
            this.tablero.src = "../img/tablero-dorado.png";
            this.ficha.src = "../img/ficha-plateada.png";
            this.fichaSeleccionada.src = "../img/ficha-plateada-selec.png";
            this.fichaHover.src = "../img/ficha-plateada-hover.png";
        }

        // Imágenes comunes
        this.fichaDisponible.src = "../img/ficha-disponible.png";
        this.fichaEliminada.src = "../img/ficha-eliminada.png";

        // Tamaño de cada ficha en píxeles
        this.tamañoFicha = 70;

        // Área jugable dentro del tablero (coordenadas dentro del canvas)
        this.areaX = 388;
        this.areaY = 75;
        this.areaW = 550;
        this.areaH = 550;

        // === Estado inicial del juego ===
        this.matriz = this.generarMatrizInicial(); // crea la matriz 7x7
        this.seleccionada = null; // ficha seleccionada
        this.destinosDisponibles = []; // movimientos posibles
        this.dragging = false; // si se está arrastrando una ficha
        this.celdaHover = null; // celda sobre la que está el mouse
        this.dragPos = { x: 0, y: 0 }; // posición del arrastre
        this.dragOffset = { x: 0, y: 0 }; // corrección visual del arrastre

        // === Estado de fin del juego ===
        this.juegoTerminado = false;
        this.botonesFin = null;
        this.callbackReiniciar = null;
        this.callbackMenu = null;

        // === Eventos de interacción ===
        this.canvas = this.ctx.canvas;
        this._onMouseDown = (e) => this.onMouseDown(e);
        this._onMouseMove = (e) => this.onMouseMove(e);
        this._onMouseUp = (e) => this.onMouseUp(e);

        // Escucha los eventos principales del mouse
        this.canvas.addEventListener("mousedown", this._onMouseDown);
        this.canvas.addEventListener("mousemove", this._onMouseMove);
        window.addEventListener("mouseup", this._onMouseUp);

        // Evento general de click (botón de instrucciones o acciones finales)
        this.canvas.addEventListener("click", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Si hace clic en el botón de instrucciones
            const b = this.botonInstrucciones;
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                this.mostrarInstrucciones = !this.mostrarInstrucciones;
                return;
            }

            // Si no tocó el botón, sigue el flujo normal (fin del juego)
            this.onClickFinJuego(e);
        });
    }

     // Se llama cuando el jugador no tiene más movimientos válidos.
    finDelJuego() {
        // Muestra la pantalla final con un mensaje específico
        this.mostrarPantallaFin("¡Te quedaste sin movimientos!");
    }


    // === Método que se ejecuta cuando se termina el tiempo ===
    finDelTiempo() {
        // Detiene el temporizador
        clearInterval(this.intervaloTimer);

        // Marca que el juego terminó
        this.juegoTerminado = true;

        // Redibuja el tablero para mostrar el estado final
        this.dibujar();

        // Calcula el centro de la pantalla (para ubicar los botones)
        const centerX = this.ancho / 2;
        const centerY = this.alto / 2;

        // Tamaño de los botones finales
        const botonW = 220;
        const botonH = 60;

        // Define los botones que se mostrarán en la pantalla de fin
        this.botonesFin = {
            reiniciar: { x: centerX - botonW - 20, y: centerY + 60, w: botonW, h: botonH },
            menu: { x: centerX + 20, y: centerY + 60, w: botonW, h: botonH },
        };

        // Elimina los listeners de interacción para evitar clicks durante el fin
        this.canvas.removeEventListener("mousedown", this._onMouseDown);
        this.canvas.removeEventListener("mousemove", this._onMouseMove);
        window.removeEventListener("mouseup", this._onMouseUp);

        // (Podría haberse usado para reactivar el click del menú final)
        // this.canvas.addEventListener("click", this.onClickFinJuego);

        // Marca que debe mostrarse el mensaje de “fin por tiempo”
        this.mostrarCartelTiempo = true;
    }


    // === Verifica si el jugador ganó la partida ===
    verificarVictoria() {
        let cantidadFichas = 0; // Contador de fichas activas
        let fichaCentral = false; // Bandera para ver si hay una ficha en el centro

        // Recorre toda la matriz del tablero
        for (let fila = 0; fila < 7; fila++) {
            for (let col = 0; col < 7; col++) {
                if (this.matriz[fila][col] === 1) { // 1 = ficha activa
                    cantidadFichas++;

                    // Verifica si la ficha está en el centro del tablero
                    if (fila === 3 && col === 3) {
                        fichaCentral = true;
                    }
                }
            }
        }

        // Si solo queda una ficha y está en el centro → ganó
        if (cantidadFichas === 1 && fichaCentral) {
            clearInterval(this.intervaloTimer); // detiene el cronómetro
            this.mostrarVictoria = true; // activa el cartel de victoria
        }
    }


    // === Limpia completamente la instancia antes de destruir el juego ===
    destruir() {
        // Detiene el temporizador si sigue activo
        if (this.intervaloTimer) {
            clearInterval(this.intervaloTimer);
            this.intervaloTimer = null;
        }

        // Elimina todos los listeners para evitar fugas de memoria
        try {
            this.canvas.removeEventListener("mousedown", this._onMouseDown);
            this.canvas.removeEventListener("mousemove", this._onMouseMove);
            window.removeEventListener("mouseup", this._onMouseUp);
            this.canvas.removeEventListener("click", this._onClick);
        } catch (err) {
            // Si alguno ya fue removido, no genera error
        }
    }

    // === Evento cuando se presiona el mouse ===
    onMouseDown(e) {
        const { x, y } = this.getMouseCoords(e);
        const celda = this.getCeldaDesdeCoordenadas(x, y);
        if (!celda) return;

        const { fila, col } = celda;
        const val = this.matriz[fila][col];

        // Si hizo clic sobre una ficha
        if (val === 1) {
            // Marca la ficha como seleccionada
            this.seleccionada = { fila, col };
            // Calcula sus movimientos posibles
            this.destinosDisponibles = this.obtenerMovimientosDisponibles(fila, col);

            // Activa el arrastre
            this.dragging = true;

            // Calcula la posición central de la celda para centrar la ficha al arrastrar
            const espacioX = this.areaW / 7;
            const espacioY = this.areaH / 7;
            const cellCenterX = this.areaX + col * espacioX + espacioX / 2;
            const cellCenterY = this.areaY + fila * espacioY + espacioY / 2;
            this.dragOffset.x = cellCenterX - x;
            this.dragOffset.y = cellCenterY - y;

            // Guarda la posición actual del mouse
            this.dragPos.x = x;
            this.dragPos.y = y;

            // Redibuja el tablero para mostrar la ficha "levantada"
            this.dibujar();
            return;
        }

        // Si hace clic en una celda vacía y hay una ficha seleccionada
        if ((val === 0 || val === 2) && this.seleccionada) {
            const destinoValido = this.destinosDisponibles.find(d => d.fila === fila && d.col === col);
            if (destinoValido) {
                // Si el movimiento es válido, se realiza el salto
                this.confirmarMovimiento(destinoValido);
            }
        }
    }

    // === Evento cuando se mueve el mouse ===
    onMouseMove(e) {
        const { x, y } = this.getMouseCoords(e);
        const celda = this.getCeldaDesdeCoordenadas(x, y);

        // Si no está arrastrando
        if (!this.dragging) {
            // Cambia el cursor si pasa por una ficha jugable
            if (celda && this.matriz[celda.fila][celda.col] === 1) {
                this.canvas.style.cursor = "pointer";
                this.celdaHover = celda;
            } else {
                this.canvas.style.cursor = "default";
                this.celdaHover = null;
            }
        } else {
            // Si está arrastrando, actualiza la posición de la ficha
            const minX = this.areaX;
            const maxX = this.areaX + this.areaW;
            const minY = this.areaY;
            const maxY = this.areaY + this.areaH;

            // Mantiene el arrastre dentro del tablero
            this.dragPos.x = Math.max(minX, Math.min(maxX, x));
            this.dragPos.y = Math.max(minY, Math.min(maxY, y));
        }

        // Redibuja el tablero constantemente
        this.dibujar();
    }

    // === Evento cuando se suelta el mouse ===
    onMouseUp(e) {
        // Si no se estaba arrastrando una ficha, no hace nada
        if (!this.dragging) return;

        // Finaliza el arrastre
        this.dragging = false;

        // Obtiene las coordenadas del mouse dentro del canvas
        const { x, y } = this.getMouseCoords(e);

        // Determina en qué celda se soltó el mouse
        const celda = this.getCeldaDesdeCoordenadas(x, y);

        // Si no hay ficha seleccionada, se termina la función
        if (!this.seleccionada) return;

        // Si se soltó dentro de una celda válida
        if (celda) {
            // Busca si la celda de destino es un movimiento permitido
            const destinoValido = this.destinosDisponibles.find(
                d => d.fila === celda.fila && d.col === celda.col
            );

            if (destinoValido) {
                // Si el destino es válido, confirma el movimiento
                this.confirmarMovimiento(destinoValido);
                return;
            }
        }

        // Si no se soltó sobre un destino válido:
        // cancela el arrastre y vuelve todo a estado normal
        this.seleccionada = null;
        this.destinosDisponibles = [];
        this.dibujar(); // redibuja el tablero
        this._lastMouseUp = Date.now(); // guarda el momento del mouseup (para prevenir clicks fantasmas)
    }

    // === Manejador de clics en los botones del juego (HUD o pantalla final) ===
    onClickFinJuego(e) {
        // Previene "clicks fantasma" justo después de soltar el mouse (por doble evento)
        const now = Date.now();
        if (now - (this._lastMouseUp || 0) < 120) return;

        // Convierte las coordenadas del evento a coordenadas relativas al canvas
        const coords = this.getMouseCoords(e);
        const offsetX = coords.x;
        const offsetY = coords.y;

        // --- 1) Si NO estamos en la pantalla final ---
        if (!this.juegoTerminado) {
            // Detecta si se hizo click en el botón Reiniciar
            const b = this.botonReiniciar;
            if (
                offsetX >= b.x && offsetX <= b.x + b.w &&
                offsetY >= b.y && offsetY <= b.y + b.h
            ) {
                // Si el botón tiene asignada una función de callback, la ejecuta
                if (this.callbackReiniciar) this.callbackReiniciar();
                return;
            }
            // (Aquí podrías agregar más botones, por ejemplo de instrucciones)
        }

        // --- 2) Si ESTAMOS en la pantalla final (fin de juego) ---
        if (this.botonesFin) {
            const { reiniciar, menu } = this.botonesFin;

            // Click en botón "Reiniciar" (pantalla final)
            if (
                offsetX >= reiniciar.x && offsetX <= reiniciar.x + reiniciar.w &&
                offsetY >= reiniciar.y && offsetY <= reiniciar.y + reiniciar.h
            ) {
                if (this.callbackReiniciar) this.callbackReiniciar();
                return;
            }

            // Click en botón "Menú principal" (pantalla final)
            if (
                offsetX >= menu.x && offsetX <= menu.x + menu.w &&
                offsetY >= menu.y && offsetY <= menu.y + menu.h
            ) {
                if (this.callbackMenu) this.callbackMenu();
                return;
            }
        }
    }

    // === Genera la matriz inicial del tablero (7x7) ===
    generarMatrizInicial() {
        const tablero = [];
        for (let i = 0; i < 7; i++) {
            tablero[i] = [];
            for (let j = 0; j < 7; j++) {
                // Las esquinas están fuera del tablero
                const fuera =
                    (i < 2 && j < 2) ||
                    (i < 2 && j > 4) ||
                    (i > 4 && j < 2) ||
                    (i > 4 && j > 4);

                if (fuera) tablero[i][j] = -1; // zona no jugable
                else if (i === 3 && j === 3) tablero[i][j] = 2; // centro vacío
                else tablero[i][j] = 1; // ficha normal
            }
        }
        return tablero;
    }

    // === Convierte las coordenadas del mouse a coordenadas relativas dentro del canvas ===
    getMouseCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    // === Devuelve qué celda del tablero fue clickeada (fila y columna) ===
    getCeldaDesdeCoordenadas(x, y) {
        const celdas = 7;
        const espacioX = this.areaW / celdas;
        const espacioY = this.areaH / celdas;

        // Se calcula la celda según la posición relativa del click
        const col = Math.floor((x - this.areaX) / espacioX);
        const fila = Math.floor((y - this.areaY) / espacioY);

        // Si está dentro del tablero y no es una zona -1
        if (
            fila >= 0 && fila < 7 &&
            col >= 0 && col < 7 &&
            this.matriz[fila][col] !== -1
        ) {
            return { fila, col };
        }
        return null; // si se clickeó fuera del área jugable
    }

    // === Calcula todos los movimientos válidos desde una celda ===
    obtenerMovimientosDisponibles(fila, col) {
        // Direcciones posibles (arriba, abajo, izquierda, derecha)
        const dirs = [
            { df: -2, dc: 0 },
            { df: 2, dc: 0 },
            { df: 0, dc: -2 },
            { df: 0, dc: 2 },
        ];
        const movs = [];

        for (let d of dirs) {
            const nf = fila + d.df; // destino final
            const nc = col + d.dc;
            const midf = fila + Math.floor(d.df / 2); // ficha saltada (intermedia)
            const midc = col + Math.floor(d.dc / 2);

            // Revisa que:
            // - destino esté dentro del tablero
            // - destino sea una celda vacía o eliminada
            // - haya una ficha en el medio para saltar
            if (
                nf >= 0 && nf < 7 && nc >= 0 && nc < 7 &&
                this.matriz[nf][nc] !== -1 &&
                (this.matriz[nf][nc] === 0 || this.matriz[nf][nc] === 2) &&
                this.matriz[midf][midc] === 1
            ) {
                // Agrega el movimiento válido a la lista
                movs.push({ fila: nf, col: nc, medio: { fila: midf, col: midc } });
            }
        }
        return movs;
    }

    // === Verifica si aún hay movimientos posibles en el tablero ===
    tieneMovimientosPosibles() {
        for (let fila = 0; fila < 7; fila++) {
            for (let col = 0; col < 7; col++) {
                // Solo analiza las celdas que tienen una ficha
                if (this.matriz[fila][col] === 1) {
                    // Obtiene los movimientos válidos desde esa ficha
                    const movs = this.obtenerMovimientosDisponibles(fila, col);
                    if (movs.length > 0) return true; // si encuentra uno, retorna true
                }
            }
        }
        // Si ninguna ficha puede moverse, retorna false
        return false;
    }

    // === Confirma y ejecuta un movimiento válido ===
    confirmarMovimiento(destinoObjeto) {
        // Coordenadas del movimiento:
        const f1 = this.seleccionada.fila; // origen
        const c1 = this.seleccionada.col;
        const f2 = destinoObjeto.fila;     // destino
        const c2 = destinoObjeto.col;
        const fm = destinoObjeto.medio.fila; // ficha intermedia (la que se “salta”)
        const cm = destinoObjeto.medio.col;

        // El origen y la ficha intermedia se marcan como "eliminadas" visualmente
        this.matriz[f1][c1] = 2;
        this.matriz[fm][cm] = 2;

        // La celda destino pasa a tener una ficha activa
        this.matriz[f2][c2] = 1;

        // Limpia selección y lista de posibles destinos
        this.seleccionada = null;
        this.destinosDisponibles = [];

        // Redibuja el tablero para reflejar el nuevo estado
        this.dibujar();

        // Verifica si el jugador ganó (por ejemplo, queda solo una ficha)
        this.verificarVictoria();

        // Si ya no quedan movimientos posibles, finaliza el juego
        if (!this.tieneMovimientosPosibles()) {
            this.finDelJuego();
        }
    }

    // === Método principal de dibujo del juego ===
    dibujar() {
        const ctx = this.ctx;

        // Guarda el estado del contexto y dibuja el fondo del tablero
        ctx.save();
        ctx.drawImage(this.tablero, 0, 0, this.ancho, this.alto);
        ctx.restore();

        // Parámetros de las celdas
        const celdas = 7;
        const espacioX = this.areaW / celdas;
        const espacioY = this.areaH / celdas;

        // === Mostrar cronómetro ===
        const minutos = Math.floor(this.tiempoRestante / 60);
        const segundos = this.tiempoRestante % 60;

        // === Botón de Reiniciar ===
        const b = this.botonReiniciar;
        ctx.fillStyle = "#00b4d8";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = "black";
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "white";
        ctx.font = "20px Nunito";
        ctx.fillText("Reiniciar", b.x + 60, b.y + 22);

        // === Dibujo del cronómetro en pantalla ===
        ctx.font = "28px Nunito";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText(`${minutos}:${segundos.toString().padStart(2, "0")}`, 50, 35);
        ctx.fillText(`${minutos}:${segundos.toString().padStart(2, "0")}`, 50, 35);

        // === Botón de Instrucciones ===
        const btn = this.botonInstrucciones;
        ctx.fillStyle = "#00b4d8";
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = "black";
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = "white";
        ctx.font = "18px Nunito";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Como Jugar?", btn.x + btn.w / 2, btn.y + btn.h / 2);

        // === Panel emergente de instrucciones ===
        if (this.mostrarInstrucciones) {
            const panelX = btn.x;
            const panelY = btn.y + btn.h + 10;
            const panelW = 315;
            const panelH = 210;

            // Fondo del panel con transparencia
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.fillRect(panelX, panelY, panelW, panelH);
            ctx.strokeRect(panelX, panelY, panelW, panelH);

            // Texto de las instrucciones
            const instrucciones = [
                "- Seleccioná una insignia, hacela saltar",
                "sobre otra adyacente hacia un espacio vacío",
                "y la ficha superada desaparecerá del tablero.",
                "- Seguí encadenando movimientos con",
                "precisión.. ¡y convertite en el verdadero",
                "ganador dejando solo una ficha",
                "en el medio del tablero!"
            ];

            ctx.font = "15px Nunito";
            ctx.fillStyle = "white";
            ctx.textAlign = "left";

            // Escribe cada línea con un espaciado vertical
            instrucciones.forEach((texto, i) => {
                ctx.fillText(texto, panelX + 15, panelY + 30 + i * 25);
            });

            ctx.restore();
        }

        // === Dibuja las fichas del tablero ===
        for (let fila = 0; fila < celdas; fila++) {
            for (let col = 0; col < celdas; col++) {
                const val = this.matriz[fila][col];
                if (val === -1) continue; // -1 = fuera del tablero

                const x = this.areaX + col * espacioX + espacioX / 2 - this.tamañoFicha / 2;
                const y = this.areaY + fila * espacioY + espacioY / 2 - this.tamañoFicha / 2;

                // Si la ficha está siendo arrastrada, dibuja su “hueco eliminado”
                if (this.dragging && this.seleccionada &&
                    this.seleccionada.fila === fila && this.seleccionada.col === col) {
                    ctx.drawImage(this.fichaEliminada, x, y, this.tamañoFicha, this.tamañoFicha);
                    continue;
                }

                // === Celdas de destino disponibles (con animación de brillo/pulso) ===
                if (this.destinosDisponibles.some(d => d.fila === fila && d.col === col)) {
                    const t = performance.now() / 1000; // tiempo en segundos
                    const pulso = (Math.sin(t * 2 * Math.PI / 3) + 1) / 2; // ciclo de 3 segundos
                    const escala = 1 + pulso * 0.1;
                    const brillo = 1 + pulso * 0.5;
                    const alpha = 0.7 + pulso * 0.3;

                    ctx.save();
                    ctx.filter = `brightness(${brillo})`;
                    ctx.globalAlpha = alpha;

                    const tamañoAnim = this.tamañoFicha * escala;
                    const offset = (this.tamañoFicha - tamañoAnim) / 2;

                    ctx.drawImage(
                        this.fichaDisponible,
                        x + offset,
                        y + offset,
                        tamañoAnim,
                        tamañoAnim
                    );
                    ctx.restore();
                    continue;
                }

                // === Fichas normales ===
                if (val === 1) {
                    // Si el mouse está encima, usa imagen hover
                    if (this.celdaHover &&
                        this.celdaHover.fila === fila &&
                        this.celdaHover.col === col) {
                        ctx.drawImage(this.fichaHover, x, y, this.tamañoFicha, this.tamañoFicha);
                    } else {
                        ctx.drawImage(this.ficha, x, y, this.tamañoFicha, this.tamañoFicha);
                    }
                } else if (val === 2) {
                    // Ficha eliminada (visualmente gris o apagada)
                    ctx.drawImage(this.fichaEliminada, x, y, this.tamañoFicha, this.tamañoFicha);
                }
            }
        }

        // === Dibujo de la ficha que se arrastra ===
        if (this.dragging && this.seleccionada) {
            const drawX = this.dragPos.x + this.dragOffset.x - this.tamañoFicha / 2;
            const drawY = this.dragPos.y + this.dragOffset.y - this.tamañoFicha / 2;

            // Limita su movimiento dentro del área jugable
            const minX = this.areaX - this.tamañoFicha / 2;
            const maxX = this.areaX + this.areaW - this.tamañoFicha / 2;
            const minY = this.areaY - this.tamañoFicha / 2;
            const maxY = this.areaY + this.areaH - this.tamañoFicha / 2;

            const finalX = Math.max(minX, Math.min(maxX, drawX));
            const finalY = Math.max(minY, Math.min(maxY, drawY));

            // Dibuja la ficha arrastrada sobre todas las demás
            ctx.drawImage(this.fichaSeleccionada, finalX, finalY, this.tamañoFicha, this.tamañoFicha);
        }

        // === Cartel de fin del juego (pantalla final) ===
        if (this.juegoTerminado) {
            const centerX = this.ancho / 2;
            const centerY = this.alto / 2;

            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, this.ancho, this.alto);

            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";

            // Mensajes de fin
            if (this.mostrarCartelTiempo) {
                ctx.font = "24px Nunito";
                ctx.fillText("⏳ ¡Se acabó el tiempo!", centerX, centerY - 60);
                ctx.fillText("Has perdido la partida.", centerX, centerY - 15);
            } else if (this.mostrarVictoria) {
                ctx.font = "24px Nunito";
                ctx.fillText("¡Felicitaciones!", centerX, centerY - 60);
                ctx.fillText("Has ganado la partida.", centerX, centerY - 15);
            } else {
                ctx.font = "24px Nunito";
                ctx.fillText("¡Te quedaste sin movimientos!", centerX, centerY - 60);
                ctx.fillText("Has perdido la partida.", centerX, centerY - 15);
            }

            // === Botones del final ===
            if (this.botonesFin) {
                const { reiniciar, menu } = this.botonesFin;

                // Botón "Jugar de nuevo"
                ctx.fillStyle = "#00b4d8";
                ctx.fillRect(reiniciar.x, reiniciar.y, reiniciar.w, reiniciar.h);
                ctx.fillStyle = "#fff";
                ctx.font = "bold 22px Nunito";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("Jugar de nuevo", reiniciar.x + reiniciar.w / 2, reiniciar.y + reiniciar.h / 2);

                // Botón "Volver al menú"
                ctx.fillStyle = "#6c757d";
                ctx.fillRect(menu.x, menu.y, menu.w, menu.h);
                ctx.fillStyle = "#fff";
                ctx.fillText("Volver al menú", menu.x + menu.w / 2, menu.y + menu.h / 2);
            }

            ctx.restore();
        }
    }

    // === Inicia el temporizador del juego ===
    iniciarTimer() {
        this.intervaloTimer = setInterval(() => {
            this.tiempoRestante--; // resta un segundo

            // Si se acaba el tiempo, termina el juego
            if (this.tiempoRestante <= 0) {
                clearInterval(this.intervaloTimer);
                this.mostrarPantallaFin("¡Se acabó el tiempo!");
            }
        }, 1000); // cada 1 segundo
    }

     // === Muestra la pantalla final (ganó o perdió) ===
    mostrarPantallaFin(mensaje) {
        // Si el temporizador sigue corriendo, se detiene
        if (this.intervaloTimer) {
            clearInterval(this.intervaloTimer);
            this.intervaloTimer = null;
        }

        // Marca que el juego terminó
        this.juegoTerminado = true;
        this.mensajeFin = mensaje || "Fin del juego";

        // Bandera para saber si el motivo del fin fue el tiempo
        this.mostrarCartelTiempo = String(mensaje).toLowerCase().includes("tiempo");

        // Calcula la posición central para colocar los botones del final
        const centerX = this.ancho / 2;
        const centerY = this.alto / 2;
        const botonW = 220;
        const botonH = 60;

        // Define las coordenadas de los botones de la pantalla final
        this.botonesFin = {
            reiniciar: { x: centerX - botonW - 20, y: centerY + 60, w: botonW, h: botonH },
            menu: { x: centerX + 20, y: centerY + 60, w: botonW, h: botonH },
        };

        // Quita los listeners del juego (para que el jugador no mueva fichas)
        try {
            this.canvas.removeEventListener("mousedown", this._onMouseDown);
            this.canvas.removeEventListener("mousemove", this._onMouseMove);
            window.removeEventListener("mouseup", this._onMouseUp);
        } catch (err) {
            // En caso de que algún listener ya esté eliminado, evita errores
        }

        // Redibuja todo para mostrar el cartel final inmediatamente
        this.dibujar();
    }

}
