// Clase que representa una pieza del puzzle
class Pieza {
    constructor(imagenCompleta, x, y, anchoContenedor, altoContenedor, anchoImagen, altoImagen, offsetX, offsetY, origenX, origenY, anchoOrigen, altoOrigen, indice, nivel) {
        this.imagenCompleta = imagenCompleta;
        // Posición y tamaño del contenedor cuadrado (área de rotación)
        this.x = x;
        this.y = y;
        this.ancho = anchoContenedor;
        this.alto = altoContenedor;
        
        // Dimensiones de la imagen rectangular dentro del contenedor
        this.anchoImagen = anchoImagen;
        this.altoImagen = altoImagen;
        
        // Offset para centrar la imagen en el contenedor
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        
        // Coordenadas de origen en la imagen original
        this.origenX = origenX;
        this.origenY = origenY;
        this.anchoOrigen = anchoOrigen;
        this.altoOrigen = altoOrigen;
        
        this.indice = indice;
        this.nivel = nivel;
        
        this.rotacionActual = 0;
        this.rotacionCorrecta = 0;
        
        // Rotación inicial aleatoria
        const rotaciones = [0, 90, 180, 270];
        this.rotacionActual = rotaciones[Math.floor(Math.random() * rotaciones.length)];
    }

    rotarIzquierda() {
        this.rotacionActual -= 90;
        if (this.rotacionActual < 0 ) {
            this.rotacionActual = 270;
        }
    }

    rotarDerecha() {
        this.rotacionActual += 90;
        if (this.rotacionActual >= 360) {
            this.rotacionActual = 0;
        }
    }

    estaCorrecta() {
        return this.rotacionActual === this.rotacionCorrecta;
    }

    colocarEnPosicionCorrecta() {
        this.rotacionActual = this.rotacionCorrecta;
    }

    contienePunto(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + this.ancho &&
               mouseY >= this.y && mouseY <= this.y + this.alto;
    }

    dibujar(ctx, mostrarOriginal) {
        ctx.save();
        
        // Trasladar al centro del contenedor para rotar
        const centroX = this.x + this.ancho / 2;
        const centroY = this.y + this.alto / 2;
        ctx.translate(centroX, centroY);
        ctx.rotate((this.rotacionActual * Math.PI) / 180);
        
        // Dibujar la porción de la imagen centrada en el contenedor
        ctx.drawImage(
            this.imagenCompleta,
            this.origenX, this.origenY, this.anchoOrigen, this.altoOrigen,
            -this.anchoImagen / 2, -this.altoImagen / 2, this.anchoImagen, this.altoImagen
        );
        
        ctx.restore();
        
        // Aplicar filtro si no está completado
        if (!mostrarOriginal) {
            // Obtener los píxeles del área de la imagen (no del contenedor completo)
            const xImagen = this.x + this.offsetX;
            const yImagen = this.y + this.offsetY;
            
            // Solo aplicar filtro al área donde está la imagen
            const datosImagen = ctx.getImageData(this.x, this.y, this.ancho, this.alto);
            
            // Aplicar filtro según el nivel, pasando el índice de la pieza para el nivel random
            const datosConFiltro = GestorFiltros.aplicarFiltroPorNivel(datosImagen, this.nivel, this.indice);
            
            // Volver a dibujar con el filtro aplicado
            ctx.putImageData(datosConFiltro, this.x, this.y);
        }
        
        // Dibujar borde del contenedor
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.ancho, this.alto);
    }
}
