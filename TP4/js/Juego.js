export class Juego {
    constructor(ctx, ancho, alto, config) {
        this.ctx = ctx;
        this.ancho = ancho;
        this.alto = alto;
        this.config = config;
        this.tiempoRestante = 300;
        this.intervaloTimer = null;
        this._lastMouseUp = 0;
        this.mostrarVictoria = false;
        this._onClick = this.onClickFinJuego.bind(this);

        // === Botón Reiniciar ===
        this.botonReiniciar = {
            x: this.ancho - 150,
            y: 20,
            w: 120,
            h: 40
        };

        // === Botón de Instrucciones ===
        this.mostrarInstrucciones = false;
        this.botonInstrucciones = {
            x: 20,
            y: 60,
            w: 130,
            h: 35
        };

        // ==== Imágenes ====
        this.tablero = new Image();
        this.ficha = new Image();
        this.fichaSeleccionada = new Image();
        this.fichaDisponible = new Image();
        this.fichaEliminada = new Image();
        this.fichaHover = new Image();

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

        this.fichaDisponible.src = "../img/ficha-disponible.png";
        this.fichaEliminada.src = "../img/ficha-eliminada.png";

        // Tamaño de ficha
        this.tamañoFicha = 70;

        // Área jugable dentro del tablero 
        this.areaX = 388;
        this.areaY = 75;
        this.areaW = 550;
        this.areaH = 550;

        // Estado del juego
        this.matriz = this.generarMatrizInicial();
        this.seleccionada = null;
        this.destinosDisponibles = [];
        this.dragging = false;
        this.celdaHover = null;
        this.dragPos = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };

        // Estado de fin del juego
        this.juegoTerminado = false;
        this.botonesFin = null;
        this.callbackReiniciar = null;
        this.callbackMenu = null;

        // === Eventos ===
        this.canvas = this.ctx.canvas;
        this._onMouseDown = (e) => this.onMouseDown(e);
        this._onMouseMove = (e) => this.onMouseMove(e);
        this._onMouseUp = (e) => this.onMouseUp(e);

        this.canvas.addEventListener("mousedown", this._onMouseDown);
        this.canvas.addEventListener("mousemove", this._onMouseMove);
        window.addEventListener("mouseup", this._onMouseUp);

        // Clic general (incluye botón de instrucciones)
        this.canvas.addEventListener("click", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const b = this.botonInstrucciones;
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                this.mostrarInstrucciones = !this.mostrarInstrucciones;
                return;
            }

            // Si no clickeó el botón de instrucciones, sigue el flujo normal
            this.onClickFinJuego(e);
        });
    }

    generarMatrizInicial() {
        const tablero = [];
        for (let i = 0; i < 7; i++) {
            tablero[i] = [];
            for (let j = 0; j < 7; j++) {
                const fuera =
                    (i < 2 && j < 2) ||
                    (i < 2 && j > 4) ||
                    (i > 4 && j < 2) ||
                    (i > 4 && j > 4);
                if (fuera) tablero[i][j] = -1;
                else if (i === 3 && j === 3) tablero[i][j] = 2; // ficha eliminada visible
                else tablero[i][j] = 1;
            }
        }
        return tablero;
    }

    // --- util: conversión mouse <-> celda (solo si dentro del área válida) ---
    getMouseCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }

    getCeldaDesdeCoordenadas(x, y) {
        const celdas = 7;
        const espacioX = this.areaW / celdas;
        const espacioY = this.areaH / celdas;

        const col = Math.floor((x - this.areaX) / espacioX);
        const fila = Math.floor((y - this.areaY) / espacioY);

        if (
            fila >= 0 && fila < 7 &&
            col >= 0 && col < 7 &&
            this.matriz[fila][col] !== -1
        ) {
            return { fila, col };
        }
        return null;
    }

    // --- movimientos válidos con la regla clásica (salto sobre una pieza) ---
    obtenerMovimientosDisponibles(fila, col) {
        const dirs = [
            { df: -2, dc: 0 }, // arriba
            { df: 2, dc: 0 },  // abajo
            { df: 0, dc: -2 }, // izquierda
            { df: 0, dc: 2 },  // derecha
        ];
        const movs = [];

        for (let d of dirs) {
            const nf = fila + d.df;
            const nc = col + d.dc;
            const midf = fila + Math.floor(d.df / 2);
            const midc = col + Math.floor(d.dc / 2);


            if (
                nf >= 0 && nf < 7 && nc >= 0 && nc < 7 &&
                this.matriz[nf][nc] !== -1 && // destino dentro del área válida
                (this.matriz[nf][nc] === 0 || this.matriz[nf][nc] === 2) && // destino vacío o eliminada
                this.matriz[midf][midc] === 1 // hay pieza para saltar
            ) {
                movs.push({ fila: nf, col: nc, medio: { fila: midf, col: midc } });
            }
        }
        return movs;
    }

    // --- eventos ---
    onMouseDown(e) {
        const { x, y } = this.getMouseCoords(e);
        const celda = this.getCeldaDesdeCoordenadas(x, y);
        if (!celda) return;

        const { fila, col } = celda;
        const val = this.matriz[fila][col];

        if (val === 1) {
            // comenzar drag: no tocamos la matriz todavía (no dejarla vacía)
            this.seleccionada = { fila, col };
            this.destinosDisponibles = this.obtenerMovimientosDisponibles(fila, col);

            // preparar drag visual
            this.dragging = true;
            // offset para centrar la imagen respecto del cursor
            const espacioX = this.areaW / 7;
            const espacioY = this.areaH / 7;
            const cellCenterX = this.areaX + col * espacioX + espacioX / 2;
            const cellCenterY = this.areaY + fila * espacioY + espacioY / 2;
            this.dragOffset.x = cellCenterX - x;
            this.dragOffset.y = cellCenterY - y;

            this.dragPos.x = x;
            this.dragPos.y = y;

            // redibujar para mostrar origen como "eliminada" visualmente durante el drag
            this.dibujar();
            return;
        }

        // Si se hace mousedown en un destino válido, y ya había una seleccionada,
        // realizamos el movimiento (esto permite click rápido además del drag).
        if ((val === 0 || val === 2) && this.seleccionada) {
            const destinoValido = this.destinosDisponibles.find(d => d.fila === fila && d.col === col);
            if (destinoValido) {
                this.confirmarMovimiento(destinoValido);
            }
        }
    }

    onMouseMove(e) {
        const { x, y } = this.getMouseCoords(e);
        const celda = this.getCeldaDesdeCoordenadas(x, y);

        if (!this.dragging) {
            // 🔹 Detectar si el mouse está sobre una ficha jugable
            if (celda && this.matriz[celda.fila][celda.col] === 1) {
                this.canvas.style.cursor = "pointer";
                this.celdaHover = celda; // guardamos la celda sobre la que estamos
            } else {
                this.canvas.style.cursor = "default";
                this.celdaHover = null;
            }
        } else {
            // 🔹 Durante el arrastre, actualizamos la posición de la ficha
            const minX = this.areaX;
            const maxX = this.areaX + this.areaW;
            const minY = this.areaY;
            const maxY = this.areaY + this.areaH;

            this.dragPos.x = Math.max(minX, Math.min(maxX, x));
            this.dragPos.y = Math.max(minY, Math.min(maxY, y));
        }

        this.dibujar();
    }


    onMouseUp(e) {
        if (!this.dragging) return;
        this.dragging = false;

        const { x, y } = this.getMouseCoords(e);
        const celda = this.getCeldaDesdeCoordenadas(x, y);

        if (!this.seleccionada) return;

        if (celda) {
            const destinoValido = this.destinosDisponibles.find(d => d.fila === celda.fila && d.col === celda.col);
            if (destinoValido) {
                // confirmar movimiento
                this.confirmarMovimiento(destinoValido);
                return;
            }
        }

        // si no hay destino válido: cancelar drag (no tocar la matriz)
        this.seleccionada = null;
        this.destinosDisponibles = [];
        this.dibujar();
        this._lastMouseUp = Date.now();
    }

    // Handler de clicks en el cartel

    onClickFinJuego(e) {
        // prevenir clicks fantasma justo después del mouseup
        const now = Date.now();
        if (now - (this._lastMouseUp || 0) < 120) return;

        // coordenadas relativas al canvas (consistente con getMouseCoords)
        const coords = this.getMouseCoords(e);
        const offsetX = coords.x;
        const offsetY = coords.y;

        // 1) Si NO estamos en pantalla final: manejar HUD (Reiniciar)
        if (!this.juegoTerminado) {
            const b = this.botonReiniciar;
            if (
                offsetX >= b.x && offsetX <= b.x + b.w &&
                offsetY >= b.y && offsetY <= b.y + b.h
            ) {
                if (this.callbackReiniciar) this.callbackReiniciar();
                return;
            }
            // (aquí podrías manejar otros botones HUD como Instrucciones si los agregas)
        }

        // 2) Si estamos en pantalla final, manejar sus botones (si existen)
        if (this.botonesFin) {
            const { reiniciar, menu } = this.botonesFin;

            if (
                offsetX >= reiniciar.x && offsetX <= reiniciar.x + reiniciar.w &&
                offsetY >= reiniciar.y && offsetY <= reiniciar.y + reiniciar.h
            ) {
                if (this.callbackReiniciar) this.callbackReiniciar();
                return;
            }

            if (
                offsetX >= menu.x && offsetX <= menu.x + menu.w &&
                offsetY >= menu.y && offsetY <= menu.y + menu.h
            ) {
                if (this.callbackMenu) this.callbackMenu();
                return;
            }
        }
    }

    tieneMovimientosPosibles() {
        for (let fila = 0; fila < 7; fila++) {
            for (let col = 0; col < 7; col++) {
                if (this.matriz[fila][col] === 1) {
                    const movs = this.obtenerMovimientosDisponibles(fila, col);
                    if (movs.length > 0) return true;
                }
            }
        }
        return false;
    }


    confirmarMovimiento(destinoObjeto) {
        const f1 = this.seleccionada.fila;
        const c1 = this.seleccionada.col;
        const f2 = destinoObjeto.fila;
        const c2 = destinoObjeto.col;
        const fm = destinoObjeto.medio.fila;
        const cm = destinoObjeto.medio.col;

        // origen y medio se vuelven eliminadas visualmente
        this.matriz[f1][c1] = 2;
        this.matriz[fm][cm] = 2;

        // destino siempre se convierte en ficha activa
        this.matriz[f2][c2] = 1;

        //  IMPORTANTE: limpiar el array de destinos y selección
        this.seleccionada = null;
        this.destinosDisponibles = [];

        // Forzar redibujo completo del tablero actual
        this.dibujar();

        //  Verificar si ganó
        this.verificarVictoria();

        // 🔹 Después de mover, verificar si quedan movimientos posibles
        if (!this.tieneMovimientosPosibles()) {
            this.finDelJuego();
        }

    }

    iniciarTimer() {
        this.intervaloTimer = setInterval(() => {
            this.tiempoRestante--;

            if (this.tiempoRestante <= 0) {
                clearInterval(this.intervaloTimer);
                this.mostrarPantallaFin("¡Se acabó el tiempo!");
            }
        }, 1000);
    }

    // Pegar dentro de la clase Juego (por ejemplo justo después de iniciarTimer)

    mostrarPantallaFin(mensaje) {
        // parar timer (si quedó alguno)
        if (this.intervaloTimer) {
            clearInterval(this.intervaloTimer);
            this.intervaloTimer = null;
        }

        // marcaremos que el juego terminó y guardamos el mensaje
        this.juegoTerminado = true;
        this.mensajeFin = mensaje || "Fin del juego";

        // bandera usada en dibujar() para determinar texto
        this.mostrarCartelTiempo = String(mensaje).toLowerCase().includes("tiempo");

        // crear botones en pantalla (igual que antes)
        const centerX = this.ancho / 2;
        const centerY = this.alto / 2;
        const botonW = 220;
        const botonH = 60;

        this.botonesFin = {
            reiniciar: { x: centerX - botonW - 20, y: centerY + 60, w: botonW, h: botonH },
            menu: { x: centerX + 20, y: centerY + 60, w: botonW, h: botonH },
        };

        // quitar listeners de interacción de juego para bloquear input (pero NO quitamos el click global que maneja botones)
        try {
            this.canvas.removeEventListener("mousedown", this._onMouseDown);
            this.canvas.removeEventListener("mousemove", this._onMouseMove);
            window.removeEventListener("mouseup", this._onMouseUp);
        } catch (err) {
            // no crashear si algo ya fue removido
        }

        // forzamos un dibujado final para que se vea el cartel al instante
        this.dibujar();
    }

    // Mantener compatibilidad con confirmaciones anteriores
    finDelJuego() {
        this.mostrarPantallaFin("¡Te quedaste sin movimientos!");
    }


    finDelTiempo() {
        clearInterval(this.intervaloTimer);
        this.juegoTerminado = true;
        this.dibujar();

        const centerX = this.ancho / 2;
        const centerY = this.alto / 2;

        const botonW = 220;
        const botonH = 60;

        this.botonesFin = {
            reiniciar: { x: centerX - botonW - 20, y: centerY + 60, w: botonW, h: botonH },
            menu: { x: centerX + 20, y: centerY + 60, w: botonW, h: botonH },
        };

        this.canvas.removeEventListener("mousedown", this._onMouseDown);
        this.canvas.removeEventListener("mousemove", this._onMouseMove);
        window.removeEventListener("mouseup", this._onMouseUp);

        //this.canvas.addEventListener("click", this.onClickFinJuego);

        this.mostrarCartelTiempo = true; // para el texto en dibujar()
    }

    verificarVictoria() {
        let cantidadFichas = 0;
        let fichaCentral = false;

        for (let fila = 0; fila < 7; fila++) {
            for (let col = 0; col < 7; col++) {
                if (this.matriz[fila][col] === 1) {
                    cantidadFichas++;

                    if (fila === 3 && col === 3) {
                        fichaCentral = true;
                    }
                }
            }
        }

        if (cantidadFichas === 1 && fichaCentral) {
            clearInterval(this.intervaloTimer);

            this.mostrarVictoria = true;
        }
    }


    // Llamalo desde fuera antes de descartar la instancia
    destruir() {
        // limpiar timer
        if (this.intervaloTimer) {
            clearInterval(this.intervaloTimer);
            this.intervaloTimer = null;
        }

        // remover listeners (si existen)
        try {
            this.canvas.removeEventListener("mousedown", this._onMouseDown);
            this.canvas.removeEventListener("mousemove", this._onMouseMove);
            window.removeEventListener("mouseup", this._onMouseUp);
            this.canvas.removeEventListener("click", this._onClick);
        } catch (err) {
            // no pasa nada si ya fueron removidos
        }
    }



    // --- dibujo ---
    dibujar() {
        const ctx = this.ctx;
        ctx.save();
        ctx.drawImage(this.tablero, 0, 0, this.ancho, this.alto);
        ctx.restore();

        const celdas = 7;
        const espacioX = this.areaW / celdas;
        const espacioY = this.areaH / celdas;

        // Mostrar cronómetro
        const minutos = Math.floor(this.tiempoRestante / 60);
        const segundos = this.tiempoRestante % 60;

        // Botón Reiniciar
        const b = this.botonReiniciar;
        ctx.fillStyle = "#00b4d8";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = "black";
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = "white";
        ctx.font = "20px Nunito";
        ctx.fillText("Reiniciar", b.x + 60, b.y + 22);

        // Cronómetro
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

        // === Panel de Instrucciones (si está activo) ===
        if (this.mostrarInstrucciones) {
            const panelX = btn.x;
            const panelY = btn.y + btn.h + 10;
            const panelW = 315;
            const panelH = 210;

            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.fillRect(panelX, panelY, panelW, panelH);
            ctx.strokeRect(panelX, panelY, panelW, panelH);

            const instrucciones = [
                "- Seleccioná una insignia, hacela saltar",
                "sobre otra adyacente hacia un espacio vacío",
                "y la ficha superada desaparecerá del tablero.",
                "- Seguí encadenando movimientos con",
                "precisión.. ¡y convertite en el verdadero",
                "ganador dejando solo una ficha",
                "en el medio del tablero!"];

            ctx.font = "15px Nunito";
            ctx.fillStyle = "white";
            ctx.textAlign = "left";
            instrucciones.forEach((texto, i) => {
                ctx.fillText(texto, panelX + 15, panelY + 30 + i * 25);
            });
            ctx.restore();
        }


        // dibujar todas las celdas según valor
        for (let fila = 0; fila < celdas; fila++) {
            for (let col = 0; col < celdas; col++) {
                const val = this.matriz[fila][col];
                if (val === -1) continue; // fuera del tablero

                const x = this.areaX + col * espacioX + espacioX / 2 - this.tamañoFicha / 2;
                const y = this.areaY + fila * espacioY + espacioY / 2 - this.tamañoFicha / 2;

                // Si esta celda es el origen de la ficha que estoy arrastrando,
                // mostramos la imagen "fichaEliminada" visualmente para no dejar un hueco.
                if (this.dragging && this.seleccionada && this.seleccionada.fila === fila && this.seleccionada.col === col) {
                    ctx.drawImage(this.fichaEliminada, x, y, this.tamañoFicha, this.tamañoFicha);
                    continue;
                }
                // destinos disponibles con animación de "latido y brillo"
                if (this.destinosDisponibles.some(d => d.fila === fila && d.col === col)) {
                    // tiempo global para animación
                    const t = performance.now() / 1000; // segundos
                    // ciclo de latido: entre 0 y 1 en un ritmo constante
                    const pulso = (Math.sin(t * 2 * Math.PI / 3) + 1) / 2; // 3 seg por ciclo

                    // escala y brillo basados en el pulso
                    const escala = 1 + pulso * 0.1; // leve aumento 10%
                    const brillo = 1 + pulso * 0.5; // brillo hasta 1.5x
                    const alpha = 0.7 + pulso * 0.3; // leve respiración

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


                // valores normales
                if (val === 1) {
                    // Si el mouse está sobre esta celda, usamos la imagen hover
                    if (this.celdaHover && this.celdaHover.fila === fila && this.celdaHover.col === col) {
                        ctx.drawImage(this.fichaHover, x, y, this.tamañoFicha, this.tamañoFicha);
                    } else {
                        ctx.drawImage(this.ficha, x, y, this.tamañoFicha, this.tamañoFicha);
                    }
                } else if (val === 0) {
                    // vacío -> no dibujar
                } else if (val === 2) {
                    ctx.drawImage(this.fichaEliminada, x, y, this.tamañoFicha, this.tamañoFicha);
                }
            }
        }

        // si estamos arrastrando, dibujamos la ficha siguiendo al cursor (por encima)
        if (this.dragging && this.seleccionada) {
            // posición de la imagen centrada respecto dragPos (teniendo en cuenta offset)
            const drawX = this.dragPos.x + this.dragOffset.x - this.tamañoFicha / 2;
            const drawY = this.dragPos.y + this.dragOffset.y - this.tamañoFicha / 2;

            // limitar dibujo al área jugable (opcionalmente ya limitado en mousemove)
            const minX = this.areaX - this.tamañoFicha / 2;
            const maxX = this.areaX + this.areaW - this.tamañoFicha / 2;
            const minY = this.areaY - this.tamañoFicha / 2;
            const maxY = this.areaY + this.areaH - this.tamañoFicha / 2;

            const finalX = Math.max(minX, Math.min(maxX, drawX));
            const finalY = Math.max(minY, Math.min(maxY, drawY));

            ctx.drawImage(this.fichaSeleccionada, finalX, finalY, this.tamañoFicha, this.tamañoFicha);
        }
        // --- Cartel de fin del juego ---
        if (this.juegoTerminado) {
            const ctx = this.ctx;
            const centerX = this.ancho / 2;
            const centerY = this.alto / 2;

            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, this.ancho, this.alto);

            ctx.fillStyle = "#fff";
            ctx.font = "bold 46px Nunito";
            ctx.textAlign = "center";
            ctx.font = "24px Nunito";
            if (this.mostrarCartelTiempo) {
                ctx.fillText("⏳ ¡Se acabó el tiempo!", centerX, centerY - 60);
                ctx.fillText("Has perdido la partida.", centerX, centerY - 15);
            } else if (this.mostrarVictoria) {
                ctx.fillText("Felicitaiones!", centerX, centerY - 60);
                ctx.fillText("Has ganado la partida.", centerX, centerY - 15);
            } else {
                ctx.fillText("¡Te quedaste sin movimientos!", centerX, centerY - 60);
                ctx.fillText("Has perdido la partida.", centerX, centerY - 15);
            }


            // Botones
            if (this.botonesFin) {
                const { reiniciar, menu } = this.botonesFin;

                // Reintentar
                ctx.fillStyle = "#00b4d8";
                ctx.fillRect(reiniciar.x, reiniciar.y, reiniciar.w, reiniciar.h);
                ctx.fillStyle = "#fff";
                ctx.font = "bold 22px Nunito";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("Jugar de nuevo", reiniciar.x + reiniciar.w / 2, reiniciar.y + reiniciar.h / 2);

                // Menú
                ctx.fillStyle = "#6c757d";
                ctx.fillRect(menu.x, menu.y, menu.w, menu.h);
                ctx.fillStyle = "#fff";
                ctx.fillText("Volver al menú", menu.x + menu.w / 2, menu.y + menu.h / 2);
            }

            ctx.restore();
        }

    }

}
