export class Menu {
  constructor(ctx, ancho, alto, callbackIniciar) {
    this.ctx = ctx;
    this.ancho = ancho;
    this.alto = alto;
    this.callbackIniciar = callbackIniciar;


    this.opciones = [
      {
        valor: 'dorado',
        imagen: new Image(),
        imagenHover: new Image(),
        imagenSelec: new Image(),
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

    this.opcionSeleccionada = null;
    this.opcionHover = null;
    this.botonJugar = { x: ancho / 2 - 100, y: alto / 2 + 120, w: 200, h: 50 };

    // Cargar imágenes
    this.opciones.forEach(op => {
      op.imagen.src = op.rutas.normal;
      op.imagenHover.src = op.rutas.hover;
      op.imagenSelec.src = op.rutas.selec;
    });

    this.registrarEventos();
  }

  registrarEventos() {
    window.addEventListener('click', (e) => this.handleClick(e));
    window.addEventListener('mousemove', (e) => this.handleHover(e));
  }

  dibujarPanel() {
    const ctx = this.ctx;
    const panelW = 600;
    const panelH = 400;
    const x = (this.ancho - panelW) / 2;
    const y = (this.alto - panelH) / 2;

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#1b263b';
    ctx.fillRect(x, y, panelW, panelH);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#415a77';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, panelW, panelH);
    ctx.restore();

    return { x, y, w: panelW, h: panelH };
  }

  dibujar() {
    const ctx = this.ctx;
    const panel = this.dibujarPanel();

    // Título
    ctx.save();
    ctx.fillStyle = '#e0e1dd';
    ctx.font = 'bold 36px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText('Elegi tu Ficha:', this.ancho / 2, panel.y + 70);
    ctx.restore();

    // Dibujar fichas
    const separacion = 250;
    const yOpc = panel.y + 180;
    const tamañoFicha = 100;

    this.opciones.forEach((op, i) => {
      const xOpc = this.ancho / 2 - separacion / 2 + i * separacion;

      let img = op.imagen;
      if (this.opcionSeleccionada === op.valor) {
        img = op.imagenSelec;
      } else if (this.opcionHover === op.valor) {
        img = op.imagenHover;
      }

      ctx.drawImage(img, xOpc - tamañoFicha / 2, yOpc - tamañoFicha / 2, tamañoFicha, tamañoFicha);

      // Texto descriptivo
      ctx.fillStyle = '#e0e1dd';
      ctx.font = '18px Nunito';
      ctx.textAlign = 'center';
      const texto = op.valor === 'dorado'
        ? 'Ficha dorada'
        : 'Ficha plateada';
      ctx.fillText(texto, xOpc, yOpc + 80);
    });

    // Botón jugar
    const btn = this.botonJugar;
    ctx.save();
    ctx.fillStyle = this.opcionSeleccionada ? '#00b4d8' : '#555';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Nunito';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Comenzar', btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.restore();
  }

  handleHover(e) {
    const { offsetX, offsetY } = e;
    this.opcionHover = null;

    const yOpc = this.alto / 2 - 170 + 180;
    const separacion = 250;
    const tamañoFicha = 100;

    this.opciones.forEach((op, i) => {
      const xOpc = this.ancho / 2 - separacion / 2 + i * separacion;
      const dx = offsetX - xOpc;
      const dy = offsetY - yOpc;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < tamañoFicha / 2 + 10) {
        this.opcionHover = op.valor;
      }
    });
  }

  handleClick(e) {
    const { offsetX, offsetY } = e;
    const yOpc = this.alto / 2 - 170 + 180;
    const separacion = 250;
    const tamañoFicha = 100;

    // Click en fichas
    this.opciones.forEach((op, i) => {
      const xOpc = this.ancho / 2 - separacion / 2 + i * separacion;
      const dx = offsetX - xOpc;
      const dy = offsetY - yOpc;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < tamañoFicha / 2 + 10) {
        this.opcionSeleccionada = op.valor;
      }
    });

    // Click en botón jugar
    const btn = this.botonJugar;
    if (
      this.opcionSeleccionada &&
      offsetX > btn.x &&
      offsetX < btn.x + btn.w &&
      offsetY > btn.y &&
      offsetY < btn.y + btn.h
    ) {
      this.callbackIniciar(this.opcionSeleccionada);
    }
  }
}
