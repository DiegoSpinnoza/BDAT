# Carrusel de BDAT para un portfolio

`bdat-carousel.html` es una página autónoma con avance automático, botones, indicadores y soporte para teclado y preferencia de movimiento reducido.

## Abrir la demo

Abre `bdat-carousel.html` en un navegador. El HTML carga las imágenes de `docs/screenshots/` mediante rutas relativas; conserva ambas carpetas al moverlo o publicarlo.

## Integrarlo en un portfolio web

Publica el HTML y la carpeta `screenshots` en un sitio accesible por HTTPS. Si tu portfolio puede insertar un `iframe`, adapta este ejemplo con la URL pública de la página:

```html
<iframe
  src="https://tu-dominio.example/bdat/bdat-carousel.html"
  title="Recorrido interactivo por BDAT"
  loading="lazy"
  style="display:block;width:100%;height:min(760px,90vh);border:0;border-radius:24px;overflow:hidden"
></iframe>
```

En un portfolio React u otro sitio que bloquee los `iframe`, copia los archivos de la página y sus estilos y lógica en un componente nativo, y conserva las rutas de las cinco capturas.

Las pantallas de simulaciones y cola llevan datos de demostración para ilustrar la interfaz; no muestran mediciones reales.
