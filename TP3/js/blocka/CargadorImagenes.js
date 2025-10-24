// Clase para cargar las imágenes del juego
class CargadorImagenes {
    constructor() {
        this.imagenes = [];
        this.nombresImagenes = [
             'blockaFoto1.jpg',
             'blockaFoto2.jpg',
             'blockaFoto3.jpg',
             'blockaFoto4.jpg',
             'blockaFoto5.jpg',
             'blockaFoto6.jpg',
             'blockaFoto7.jpg',
             'blockaFoto8.jpg',
             'blockaFoto9.jpg',
             'blockaFoto10.jpg'

        ];
        this.todasCargadas = false;
        this.funcionCuandoTermine = null;
        this.cuantasCargadas = 0;
        this.imagenesUsadas = []; // Array para rastrear índices de imágenes ya usadas
    }

    cargarTodas(funcionCuandoTermine) {
        // Guardar la función para llamarla después
        this.funcionCuandoTermine = funcionCuandoTermine;
        
        // Si ya están cargadas, ejecutar la función
        if (this.todasCargadas) {
            this.funcionCuandoTermine();
            return;
        }

        // Empezar a contar desde 0
        this.cuantasCargadas = 0;

        // Cargar cada imagen
        for (let i = 0; i < this.nombresImagenes.length; i++) {
            const nombre = this.nombresImagenes[i];
            const img = new Image();
            
            // Cuando se cargue una imagen
            img.onload = () => {
                this.cuantasCargadas = this.cuantasCargadas + 1;
                
                // Si se cargaron todas
                if (this.cuantasCargadas === this.nombresImagenes.length) {
                    this.todasCargadas = true;
                    this.funcionCuandoTermine();
                }
            };
            
            // Empezar a cargar  -> img.src = '../../img/' + nombre;
            img.src = '../img/' + nombre;
            this.imagenes[i] = img;
        }
    }

    obtenerImagenAleatoria() {
        // Si ya usamos todas las imágenes, resetear
        if (this.imagenesUsadas.length >= this.imagenes.length) {
            this.imagenesUsadas = [];
        }
        
        // Crear array de índices disponibles (no usados)
        const indicesDisponibles = [];
        for (let i = 0; i < this.imagenes.length; i++) {
            if (!this.imagenesUsadas.includes(i)) {
                indicesDisponibles.push(i);
            }
        }
        
        // Seleccionar un índice aleatorio de los disponibles
        const indiceAleatorio = indicesDisponibles[Math.floor(Math.random() * indicesDisponibles.length)];
        
        // Marcar esta imagen como usada
        this.imagenesUsadas.push(indiceAleatorio);
        
        return this.imagenes[indiceAleatorio];
    }
    
    resetearImagenesUsadas() {
        this.imagenesUsadas = [];
    }
}
