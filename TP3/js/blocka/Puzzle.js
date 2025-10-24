// Clase que representa el puzzle completo
class Puzzle {
    constructor(imagen, tamañoCuadricula, nivel, anchoCanvas, altoCanvas) {
        this.imagen = imagen;
        this.tamañoCuadricula = tamañoCuadricula;
        this.nivel = nivel;
        this.anchoCanvas = anchoCanvas;
        this.altoCanvas = altoCanvas;
        this.piezas = [];
        this.completo = false;
        
        this.inicializar();
    }

    inicializar() {
        // Determinar filas y columnas para que las piezas se vean mejor
        let filas, columnas;
        if (this.tamañoCuadricula === 2) {
            // 4 piezas: 2x2 (piezas cuadradas)
            filas = 2;
            columnas = 2;
        } else if (this.tamañoCuadricula === 3) {
            // 6 piezas: 3x2 (piezas más verticales)
            filas = 3;
            columnas = 2;
        } else if (this.tamañoCuadricula === 4) {
            // 8 piezas: 4x2 (piezas más verticales)
            filas = 4;
            columnas = 2;
        } else {
            filas = 2;
            columnas = 2;
        }
        
        // Obtener dimensiones de la imagen original
        const anchoImagen = this.imagen.width;
        const altoImagen = this.imagen.height;
        
        // Recortar la imagen al centro para hacerla con la proporción del grid
        // Para mantener proporciones, usamos el ancho/alto que coincida con la relación columnas/filas
        let anchoRecorte, altoRecorte;
        const relacionGrid = columnas / filas; // ej: 2/2=1, 2/3=0.666, 2/4=0.5
        const relacionImagen = anchoImagen / altoImagen;
        
        if (relacionImagen > relacionGrid) {
            // La imagen es más ancha que la relación del grid
            // Usamos todo el alto y recortamos el ancho
            altoRecorte = altoImagen;
            anchoRecorte = altoImagen * relacionGrid;
        } else {
            // La imagen es más alta que la relación del grid
            // Usamos todo el ancho y recortamos el alto
            anchoRecorte = anchoImagen;
            altoRecorte = anchoImagen / relacionGrid;
        }
        
        // Centrar el recorte
        const offsetOrigenX = (anchoImagen - anchoRecorte) / 2;
        const offsetOrigenY = (altoImagen - altoRecorte) / 2;
        
        // Tamaño de cada pieza en la imagen original
        const anchoOrigenPieza = anchoRecorte / columnas;
        const altoOrigenPieza = altoRecorte / filas;
        
        // Calcular el tamaño de visualización en el canvas
        // Ajustar el espacio para configuraciones verticales
        const espacioDisponibleAncho = this.anchoCanvas * 0.6;
        const espacioDisponibleAlto = this.altoCanvas * 0.85;
        
        // Dimensiones del puzzle completo en pantalla (manteniendo la proporción)
        let anchoImagenPuzzle, altoImagenPuzzle;
        
        // Calcular basándose en ambos límites
        const escalaAncho = espacioDisponibleAncho / columnas;
        const escalaAlto = espacioDisponibleAlto / filas;
        const escalaBase = Math.min(escalaAncho, escalaAlto);
        
        // Las dimensiones de cada pieza se basan en esta escala
        const anchoPiezaImagen = escalaBase;
        const altoPiezaImagen = escalaBase;
        
        // Dimensiones totales del puzzle
        anchoImagenPuzzle = anchoPiezaImagen * columnas;
        altoImagenPuzzle = altoPiezaImagen * filas;
        
        // Las piezas son cuadradas, así que el contenedor también
        const ladoContenedor = anchoPiezaImagen; // = altoPiezaImagen
        
        // Calcular el tamaño total del grid de contenedores
        const anchoGridTotal = ladoContenedor * columnas;
        const altoGridTotal = ladoContenedor * filas;
        
        // Centrar el grid en el canvas
        const posX = (this.anchoCanvas - anchoGridTotal) / 2;
        const posY = (this.altoCanvas - altoGridTotal) / 2 + 30;
        
        // Crear las piezas
        let indice = 0;
        for (let fila = 0; fila < filas; fila++) {
            for (let col = 0; col < columnas; col++) {
                // Posición del contenedor cuadrado
                const xContenedor = posX + col * ladoContenedor;
                const yContenedor = posY + fila * ladoContenedor;
                
                // Como las piezas son cuadradas, no hay offset
                const offsetXCentrado = 0;
                const offsetYCentrado = 0;
                
                const origenX = offsetOrigenX + col * anchoOrigenPieza;
                const origenY = offsetOrigenY + fila * altoOrigenPieza;
                
                const pieza = new Pieza(
                    this.imagen,
                    xContenedor,
                    yContenedor,
                    ladoContenedor,
                    ladoContenedor,
                    anchoPiezaImagen,
                    altoPiezaImagen,
                    offsetXCentrado,
                    offsetYCentrado,
                    origenX, origenY,
                    anchoOrigenPieza, altoOrigenPieza,
                    indice,
                    this.nivel
                );
                
                this.piezas.push(pieza);
                indice++;
            }
        }
    }
    //verifica que todas las piezas esten en su posicion correcta (rotacion correcta = 0`)
    verificarCompletado() {
        let todasCorrectas = true;
        for (let i = 0; i < this.piezas.length; i++) {
            if (!this.piezas[i].estaCorrecta()) {
                todasCorrectas = false;
                break;
            }
        }
        this.completo = todasCorrectas;
        return this.completo;
    }

    obtenerPiezaEn(x, y) {
        for (let i = this.piezas.length - 1; i >= 0; i--) {
            if (this.piezas[i].contienePunto(x, y)) {
                return this.piezas[i];
            }
        }
        return null;
    }

    obtenerPiezaIncorrecta() {
        // Buscar una pieza que no esté en la rotación correcta
        for (let i = 0; i < this.piezas.length; i++) {
            if (!this.piezas[i].estaCorrecta()) {
                return this.piezas[i];
            }
        }
        return null;
    }

    dibujar(ctx) {
        for (let i = 0; i < this.piezas.length; i++) {
            this.piezas[i].dibujar(ctx, this.completo);
        }
    }
}
