// Clase del Menú Principal
class MenuPrincipal {
    constructor(anchoCanvas, altoCanvas) {
        this.anchoCanvas = anchoCanvas;
        this.altoCanvas = altoCanvas;
        this.botones = [];
        this.piezasSeleccionadas = 4;
        this.imagenFondo = null;
        this.imagenCargada = false;
        
        this.cargarImagenFondo();
        this.crearBotones();
    }

    cargarImagenFondo() {
        this.imagenFondo = new Image();
        this.imagenFondo.onload = () => {
            this.imagenCargada = true;
        };
        this.imagenFondo.src = '../img/fondoPuzzle.jpg';
    }

    crearBotones() {
        const anchoBton = 160;
        const altoBton = 60;
        const centroX = this.anchoCanvas / 2;
        const inicioY = this.altoCanvas / 2 - 50;
        const espacio = 70;

        // Botón Comenzar
        this.botones.push({
            id: 'comenzar',
            x: centroX - anchoBton / 2,
            y: inicioY,
            ancho: anchoBton,
            alto: altoBton,
            texto: 'Comenzar',
            color: '#1475E1',
            colorHover: '#0A4186',
            hover: false,
        });

        // Botón Piezas
        this.botones.push({
            id: 'piezas',
            x: centroX - anchoBton / 2,
            y: inicioY + espacio,
            ancho: anchoBton,
            alto: altoBton,
            texto: 'Piezas: ' + this.piezasSeleccionadas,
            color: '#1475E1',
            colorHover: '#0A4186',
            hover: false
        });
    }

    actualizarBotonPiezas() {
        for (let i = 0; i < this.botones.length; i++) {
            if (this.botones[i].id === 'piezas') {
                this.botones[i].texto = 'Piezas: ' + this.piezasSeleccionadas;
                break;
            }
        }
    }

    clickDentroDelBoton(x, y, boton) {
        // Verifica si el click está dentro del área del botón
        const dentroEnX = x >= boton.x && x <= boton.x + boton.ancho;
        const dentroEnY = y >= boton.y && y <= boton.y + boton.alto;
        
        if (dentroEnX && dentroEnY) {
            return true;
        } else {
            return false;
        }
    }

    cambiarNumeroDePiezas() {
        // Rotar entre 4, 6 y 8 piezas
        if (this.piezasSeleccionadas === 4) {
            this.piezasSeleccionadas = 6;
        } else if (this.piezasSeleccionadas === 6) {
            this.piezasSeleccionadas = 8;
        } else {
            this.piezasSeleccionadas = 4;
        }
        this.actualizarBotonPiezas();
    }

    manejarClick(x, y) {
        // Buscar qué botón fue clickeado
        for (let i = 0; i < this.botones.length; i++) {
            const boton = this.botones[i];
            
            // Ver si el click fue dentro de este botón
            if (this.clickDentroDelBoton(x, y, boton)) {
                
                // Si es el botón de piezas, cambiar el número
                if (boton.id === 'piezas') {
                    this.cambiarNumeroDePiezas();
                    return null;
                }
                
                // Si es otro botón, devolver su id
                return boton.id;
            }
        }
        
        // No se clickeó ningún botón
        return null;
    }

    manejarMovimientoMouse(x, y) {
        for (let i = 0; i < this.botones.length; i++) {
            const boton = this.botones[i];
            boton.hover = (x >= boton.x && x <= boton.x + boton.ancho &&
                          y >= boton.y && y <= boton.y + boton.alto);
        }
    }

    obtenerTamañoCuadricula() {
        if (this.piezasSeleccionadas === 4) {
            return 2;
        } else if (this.piezasSeleccionadas === 6) {
            return 3;
        } else if (this.piezasSeleccionadas === 8) {
            return 4;
        } else {
            return 2;
        }
    }

    dibujar(ctx) {
        // Dibujar imagen de fondo si está cargada
        if (this.imagenCargada && this.imagenFondo) {
            ctx.drawImage(this.imagenFondo, 0, 0, this.anchoCanvas, this.altoCanvas);
            
            // Overlay semi-transparente para mejorar legibilidad
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, this.anchoCanvas, this.altoCanvas);
        } else {
            // Fondo por defecto si la imagen no está cargada
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, this.anchoCanvas, this.altoCanvas);
        }

        // Dibujar todos los botones
        for (let i = 0; i < this.botones.length; i++) {
            this.dibujarBoton(ctx, this.botones[i]);
        }
    }

    dibujarBoton(ctx, boton) {
    // Elegir el color del botón
    let color = boton.color;
    if (boton.hover) {
        color = boton.colorHover;
    }

    const radio = 12; // radio de las esquinas redondeadas

    // Dibujar sombra del botón
    ctx.shadowColor = '#0003';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Dibujar el rectángulo redondeado
    ctx.beginPath();
    ctx.roundRect(boton.x, boton.y, boton.ancho, boton.alto, radio);
    ctx.fillStyle = color;
    ctx.fill();

    // Quitar la sombra
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Dibujar el texto
    ctx.fillStyle = 'white';
    ctx.font = '22px Nunito';
    ctx.textAlign = 'center';
    const centroX = boton.x + boton.ancho / 2;
    const centroY = boton.y + boton.alto / 2 + 8;
    ctx.fillText(boton.texto, centroX, centroY);
}

}
