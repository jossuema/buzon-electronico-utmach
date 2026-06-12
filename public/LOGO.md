# Logo de la UTMACH

La animación de apertura del formulario y otros componentes pueden mostrar el
logo institucional. Para activarlo, guarda el PNG del logo aquí con este nombre:

    public/utmach-logo.png

- Recomendado: versión horizontal (sello + "UTMACH") con **fondo transparente**
  o fondo blanco (en la animación se muestra dentro de una tarjeta blanca, así
  que un fondo blanco también queda bien).
- Tamaño sugerido: alto ≥ 80 px (se escala automáticamente).

Si el archivo no existe, la interfaz simplemente **omite el logo** sin romperse
(carga elegante mediante `onError`).
