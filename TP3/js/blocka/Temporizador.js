// Clase Temporizador - Maneja el cronómetro del juego (cuenta regresiva)
class Temporizador {
    constructor(segundosIniciales) {
        this.tiempoInicio = 0;
        this.estaActivo = false;
        this.segundosIniciales = segundosIniciales;
    }

    iniciar() {
        // Guardar cuando se inició el cronómetro
        this.tiempoInicio = Date.now();
        this.estaActivo = true;
    }

    detener() {
        this.estaActivo = false;
    }

    reiniciar() {
        this.tiempoInicio = 0;
        this.estaActivo = false;
    }

    restarTiempo(segundos) {
        // Restar tiempo moviendo el tiempo de inicio hacia adelante
        if (this.estaActivo) {
            this.tiempoInicio = this.tiempoInicio - (segundos * 1000);
        }
    }

    obtenerSegundosRestantes() {
        // Si no está activo, devolver el tiempo inicial
        if (!this.estaActivo) {
            return this.segundosIniciales;
        }
        
        // Calcular cuánto tiempo pasó desde que inició
        const tiempoActual = Date.now();
        const diferencia = tiempoActual - this.tiempoInicio;
        const segundosTranscurridos = Math.floor(diferencia / 1000);
        
        // Calcular cuántos segundos quedan
        const segundosRestantes = this.segundosIniciales - segundosTranscurridos;
        
        // No puede ser negativo
        if (segundosRestantes < 0) {
            return 0;
        }
        
        return segundosRestantes;
    }

    seAcaboElTiempo() {
        // Verificar si llegó a 0
        if (this.obtenerSegundosRestantes() === 0 && this.estaActivo) {
            return true;
        }
        return false;
    }

    obtenerTiempoFormateado() {
        const segundosTotales = this.obtenerSegundosRestantes();
        const minutos = Math.floor(segundosTotales / 60);
        const segundos = segundosTotales % 60;
        
        // Agregar un 0 adelante si es menor a 10
        let minutosTexto = minutos.toString();
        if (minutos < 10) {
            minutosTexto = '0' + minutos;
        }
        
        let segundosTexto = segundos.toString();
        if (segundos < 10) {
            segundosTexto = '0' + segundos;
        }
        
        return minutosTexto + ':' + segundosTexto;
    }

    obtenerTiempoTranscurrido() {
        // Si no está activo, calcular desde cuando se detuvo
        if (!this.estaActivo) {
            const tiempoActual = Date.now();
            const diferencia = tiempoActual - this.tiempoInicio;
            const segundosTranscurridos = Math.floor(diferencia / 1000);
            
            // No puede exceder el tiempo inicial
            const segundosFinales = Math.min(segundosTranscurridos, this.segundosIniciales);
            
            const minutos = Math.floor(segundosFinales / 60);
            const segundos = segundosFinales % 60;
            
            let resultado = '';
            if (minutos > 0) {
                resultado = minutos + ':';
                if (segundos < 10) {
                    resultado = resultado + '0';
                }
            }
            resultado = resultado + segundos + 's';
            
            return resultado;
        }
        
        // Si está activo, calcular tiempo transcurrido
        const tiempoActual = Date.now();
        const diferencia = tiempoActual - this.tiempoInicio;
        const segundosTranscurridos = Math.floor(diferencia / 1000);
        
        const minutos = Math.floor(segundosTranscurridos / 60);
        const segundos = segundosTranscurridos % 60;
        
        let resultado = '';
        if (minutos > 0) {
            resultado = minutos + ':';
            if (segundos < 10) {
                resultado = resultado + '0';
            }
        }
        resultado = resultado + segundos + 's';
        
        return resultado;
    }

    dibujar(ctx, x, y) {
        // Configurar fuente
        ctx.font = '24px Nunito';
        ctx.textAlign = 'center';
        
        // Sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Relleno blanco
        ctx.fillStyle = '#213743';
        ctx.fillText('Tiempo: ' + this.obtenerTiempoFormateado(), x, y);
        
        // Limpiar efectos
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}
