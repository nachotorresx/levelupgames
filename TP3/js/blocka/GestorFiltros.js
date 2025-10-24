// Clase para aplicar filtros a las imágenes
class GestorFiltros {
    
    static aplicarEscalaGrises(imageData) {
        const datos = imageData.data;
        for (let i = 0; i < datos.length; i += 4) {
            const gris = 0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2];
            datos[i] = gris;
            datos[i + 1] = gris;
            datos[i + 2] = gris;
        }
        return imageData;
    }

    static aplicarBrillo(imageData) {
        const datos = imageData.data;
        const factor = 1.3; // 30% más brillo
        
        for (let i = 0; i < datos.length; i += 4) {
            datos[i] = Math.min(255, datos[i] * factor);
            datos[i + 1] = Math.min(255, datos[i + 1] * factor);
            datos[i + 2] = Math.min(255, datos[i + 2] * factor);
        }
        return imageData;
    }

    static aplicarNegativo(imageData) {
        const datos = imageData.data;
        for (let i = 0; i < datos.length; i += 4) {
            datos[i] = 255 - datos[i];
            datos[i + 1] = 255 - datos[i + 1];
            datos[i + 2] = 255 - datos[i + 2];
        }
        return imageData;
    }

    static aplicarFiltroPorNivel(imageData, nivel, indicePieza = null) {
        // Nivel 1: Sin filtro 
        if (nivel === 1) {
            return imageData;
        }
        
        // Nivel 5 en adelante: Random (cada pieza con filtro diferente)
        if (nivel >= 5) {
            return this.aplicarFiltroAleatorio(imageData, indicePieza);
        }
        
        // Niveles 2-4: Rotar entre filtros
        const filtros = ['grises', 'brillo', 'negativo'];
        const tipoFiltro = filtros[(nivel - 2) % 3]; // -2 porque empezamos desde nivel 2
        
        if (tipoFiltro === 'grises') {
            return this.aplicarEscalaGrises(imageData);
        } else if (tipoFiltro === 'brillo') {
            return this.aplicarBrillo(imageData);
        } else if (tipoFiltro === 'negativo') {
            return this.aplicarNegativo(imageData);
        } else {
            return imageData;
        }
    }
    
    static aplicarFiltroAleatorio(imageData, indicePieza) {
        // Array de filtros posibles (incluye "sin filtro")
        const filtrosDisponibles = ['ninguno', 'grises', 'brillo', 'negativo'];
        
        // Si tenemos índice de pieza, usarlo para generar un filtro "consistente" para esa pieza
        // Si no, generar uno aleatorio
        let filtroSeleccionado;
        if (indicePieza !== null) {
            // Usar el índice de pieza para seleccionar un filtro de forma "pseudo-aleatoria" pero consistente
            filtroSeleccionado = filtrosDisponibles[indicePieza % filtrosDisponibles.length];
        } else {
            // Selección completamente aleatoria
            filtroSeleccionado = filtrosDisponibles[Math.floor(Math.random() * filtrosDisponibles.length)];
        }
        
        // Aplicar el filtro seleccionado
        if (filtroSeleccionado === 'grises') {
            return this.aplicarEscalaGrises(imageData);
        } else if (filtroSeleccionado === 'brillo') {
            return this.aplicarBrillo(imageData);
        } else if (filtroSeleccionado === 'negativo') {
            return this.aplicarNegativo(imageData);
        } else {
            // 'ninguno' - retornar sin cambios
            return imageData;
        }
    }
}
