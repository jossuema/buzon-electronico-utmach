# Logo de la UTMACH (opcional)

La animación de apertura del formulario muestra el logo institucional **si el
archivo existe**. Para activarlo, guarda el PNG aquí con este nombre exacto:

    public/utmach-logo.png

Luego haz commit y push: el despliegue lo incluirá en la imagen y el logo
aparecerá automáticamente dentro de una tarjeta blanca sobre el fondo azul.

- Recomendado: versión horizontal (sello + "UTMACH"), fondo transparente o blanco.
- Alto sugerido: ≥ 80 px (se escala solo).

Si el archivo NO está, la intro simplemente **omite el logo** y muestra solo la
frase: nunca aparece una imagen rota. La comprobación se hace en el servidor al
arrancar la aplicación, así que el archivo debe estar presente **antes** del
despliegue.
