// Exporta la clase Menu para que pueda ser importada y usada en otros archivos
export class Menu {
  // ==========================
  // Constructor: inicializa todo el menú
  // ==========================
  constructor(ctx, ancho, alto, callbackIniciar) {
    // Guarda el contexto de dibujo del canvas
    this.ctx = ctx;
    // Guarda las dimensiones del canvas
    this.ancho = ancho;
    this.alto = alto;
    // Guarda la función que se ejecutará al iniciar el juego
    this.callbackIniciar = callbackIniciar;

    // --------------------------
    // Definición de las opciones (fichas disponibles)
    // Cada ficha tiene tres imágenes: normal, hover y seleccionada
    // --------------------------
    this.opciones = [
      {
        valor: 'dorado', // identificador
        imagen: new Image(), // imagen normal
        imagenHover: new Image(), // imagen cuando el mouse pasa encima
        imagenSelec: new Image(), // imagen cuando está seleccionada
        rutas: {
          normal: '../img/ficha-dorada.png',
          hover: '../img/ficha-dorada-hover.png',
          selec: '../img/ficha-dorada-selec.png'
        }
      },
      {
        valor: 'plateado',
        imagen: new Image(),
        imagenHover: new Image(),
        imagenSelec: new Image(),
        rutas: {
          normal: '../img/ficha-plateada.png',
          hover: '../img/ficha-plateada-hover.png',
          selec: '../img/ficha-plateada-selec.png'
        }
      }
    ];

    // Guarda la opción seleccionada y la que está en hover (por defecto, ninguna)
    this.opcionSeleccionada = null;
    this.opcionHover = null;

    // Define las coordenadas y tamaño del botón "Comenzar"
    this.botonJugar = { x: ancho / 2 - 100, y: alto / 2 + 120, w: 200, h: 50 };

    // --------------------------
    // Cargar imágenes de las opciones
    // --------------------------
    this.opciones.forEach(op => {
      op.imagen.src = op.rutas.normal;
      op.imagenHover.src = op.rutas.hover;
      op.imagenSelec.src = op.rutas.selec;
    });

    // --------------------------
    // Registrar eventos del mouse (click y movimiento)
    // --------------------------
    this.registrarEventos();
  }

  // ==========================
  // Registra los listeners para detectar hover y clicks
  // ==========================
  registrarEventos() {
    // Cuando se hace click, se llama a handleClick()
    window.addEventListener('click', (e) => this.handleClick(e));
    // Cuando el mouse se mueve, se llama a handleHover()
    window.addEventListener('mousemove', (e) => this.handleHover(e));
  }

  // ==========================
  // Dibuja el panel del menú (el recuadro oscuro)
  // ==========================
  dibujarPanel() {
    const ctx = this.ctx;
    const panelW = 600;
    const panelH = 400;
    // Calcula posición centrada
    const x = (this.ancho - panelW) / 2;
    const y = (this.alto - panelH) / 2;

    // Fondo del panel semitransparente
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#1b263b';
    ctx.fillRect(x, y, panelW, panelH);

    // Borde decorativo del panel
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#415a77';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, panelW, panelH);
    ctx.restore();

    // Devuelve los datos del panel (para usar luego)
    return { x, y, w: panelW, h: panelH };
  }

  // ==========================
  // Dibuja el menú completo en pantalla
  // ==========================
  dibujar() {
    const ctx = this.ctx;
    // Dibuja el panel de fondo
    const panel = this.dibujarPanel();

    // --------------------------
    // Título del menú
    // --------------------------
    ctx.save();
    ctx.fillStyle = '#e0e1dd';
    ctx.font = 'bold 36px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText('Elegi tu Ficha:', this.ancho / 2, panel.y + 70);
    ctx.restore();

    // --------------------------
    // Dibuja las fichas (dorado y plateado)
    // --------------------------
    const separacion = 250; // distancia entre fichas
    const yOpc = panel.y + 180; // posición vertical
    const tamañoFicha = 100; // tamaño de cada imagen

    this.opciones.forEach((op, i) => {
      // Calcula posición horizontal de cada ficha
      const xOpc = this.ancho / 2 - separacion / 2 + i * separacion;

      // Determina qué imagen usar según el estado
      let img = op.imagen;
      if (this.opcionSeleccionada === op.valor) {
        img = op.imagenSelec; // si está seleccionada
      } else if (this.opcionHover === op.valor) {
        img = op.imagenHover; // si el mouse está encima
      }

      // Dibuja la ficha
      ctx.drawImage(img, xOpc - tamañoFicha / 2, yOpc - tamañoFicha / 2, tamañoFicha, tamañoFicha);

      // Texto descriptivo debajo de la ficha
      ctx.fillStyle = '#e0e1dd';
      ctx.font = '18px Nunito';
      ctx.textAlign = 'center';
      const texto = op.valor === 'dorado'
        ? 'Ficha dorada'
        : 'Ficha plateada';
      ctx.fillText(texto, xOpc, yOpc + 80);
    });

    // --------------------------
    // Dibuja el botón "Comenzar"
    // --------------------------
    const btn = this.botonJugar;
    ctx.save();
    // Si no hay ficha seleccionada, el botón aparece gris
    ctx.fillStyle = this.opcionSeleccionada ? '#00b4d8' : '#555';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    // Texto del botón
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Nunito';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Comenzar', btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.restore();
  }

  // ==========================
  // Detecta cuando el mouse pasa por encima de una ficha
  // ==========================
  handleHover(e) {
    const { offsetX, offsetY } = e;
    this.opcionHover = null; // resetea el hover por defecto

    // Posiciones base de las fichas
    const yOpc = this.alto / 2 - 170 + 180;
    const separacion = 250;
    const tamañoFicha = 100;

    // Recorre cada ficha y calcula la distancia del mouse a su centro
    this.opciones.forEach((op, i) => {
      const xOpc = this.ancho / 2 - separacion / 2 + i * separacion;
      const dx = offsetX - xOpc;
      const dy = offsetY - yOpc;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Si el mouse está dentro del área de la ficha, la marca como hover
      if (dist < tamañoFicha / 2 + 10) {
        this.opcionHover = op.valor;
      }
    });
  }

  // ==========================
  // Detecta clics sobre fichas o el botón "Comenzar"
  // ==========================
  handleClick(e) {
    const { offsetX, offsetY } = e;

    // Posiciones base de las fichas
    const yOpc = this.alto / 2 - 170 + 180;
    const separacion = 250;
    const tamañoFicha = 100;

    // --------------------------
    // Clic sobre una ficha → se selecciona
    // --------------------------
    this.opciones.forEach((op, i) => {
      const xOpc = this.ancho / 2 - separacion / 2 + i * separacion;
      const dx = offsetX - xOpc;
      const dy = offsetY - yOpc;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Si el click cae dentro del radio de la ficha, se marca como seleccionada
      if (dist < tamañoFicha / 2 + 10) {
        this.opcionSeleccionada = op.valor;
      }
    });

    // --------------------------
    // Clic sobre el botón "Comenzar"
    // --------------------------
    const btn = this.botonJugar;
    if (
      this.opcionSeleccionada && // solo si hay ficha seleccionada
      offsetX > btn.x &&
      offsetX < btn.x + btn.w &&
      offsetY > btn.y &&
      offsetY < btn.y + btn.h
    ) {
      // Llama al callback recibido en el constructor (iniciar el juego)
      this.callbackIniciar(this.opcionSeleccionada);
    }
  }
}
