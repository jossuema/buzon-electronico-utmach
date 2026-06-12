Tipografía institucional UTMACH: Myriad Pro
============================================

Myriad Pro es una fuente con licencia de Adobe. Por temas de licenciamiento
no se incluye en el repositorio.

Para activarla en la aplicación, coloca aquí los siguientes archivos .woff2
(puedes convertir los .otf/.ttf con https://transfonter.org):

  MyriadPro-Regular.woff2       (Regular 400)
  MyriadPro-It.woff2            (Italic 400)
  MyriadPro-Semibold.woff2      (Semibold 600)
  MyriadPro-SemiboldIt.woff2    (Semibold Italic 600)
  MyriadPro-Bold.woff2          (Bold 700)
  MyriadPro-BoldIt.woff2        (Bold Italic 700)

Las declaraciones @font-face ya están en app/globals.css.

Si los archivos no están presentes, la app usa automáticamente la pila de
respaldo definida en tailwind.config.ts (Segoe UI / Open Sans / system-ui),
muy similar a Myriad Pro, sin romper nada.
