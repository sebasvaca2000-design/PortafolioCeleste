# Portafolio Celeste

Portafolio interactivo de Vaca Ramos Freddy Sebastián con una estética inspirada en *The Legend of Zelda: Tears of the Kingdom*. Incluye cinco islas, rutas a pie, animación por capas, minimapa y paneles de información.

## Abrir en Windows, macOS o Linux

1. Extrae el ZIP completo.
2. Entra a `portafolio-celeste` y abre `index.html` en un navegador moderno.
3. También puedes abrir la carpeta con VS Code y servirla con Live Server, o ejecutar `python -m http.server 8000` desde esta carpeta y visitar `http://localhost:8000`.

No requiere npm, una base de datos ni conexión a Internet. Los enlaces a GitHub sí requieren conexión y el progreso local depende del navegador.

## Cómo explorar

- Selecciona una isla en el mapa principal o en el menú superior para que Zelda camine hasta ella.
- Para explorar manualmente, usa WASD, las flechas del teclado o los controles táctiles.
- Al llegar, el marcador se ilumina. Púlsalo o presiona **E** para abrir la ventana del santuario. Ciérrala con **Esc** o el botón ×.
- El indicador cuenta las islas descubiertas. El botón **?** reúne los controles y permite reiniciar el progreso.

## Personalizar

| Archivo | Contenido |
| --- | --- |
| `contenido.js` | Bio, proyectos, diario, tecnologías, GitHub y correo opcional. |
| `index.html` | Nombre, título profesional y estructura de los paneles. |
| `estilos.css` | Paleta, tamaños, diseño adaptable y animación visual. |
| `aventura.js` | Coordenadas del mapa, conexiones entre puntos y cálculo de rutas. |
| `app.js` | Controles, animación, progreso y ventanas emergentes. |
| `assets/` | Paisaje, personaje por capas, retrato y emblema. |

Stack: HTML5, CSS, JavaScript sin frameworks, SVG y WebP. Fan art independiente, no afiliado con Nintendo.


## Edición Explora — mejoras

- Princesa de fantasía original con rostro frontal nuevo, cabello trenzado y atuendo azul/dorado.
- Orientación contextual: al avanzar hacia arriba se ve de espalda, al regresar hacia abajo se ve de frente y en desplazamientos laterales gira hacia el lado correspondiente.
- Animaciones de marcha en ambas direcciones y seguimiento de recorrido.
- Nueva interfaz con efectos luminosos, HUD estilo videojuego, marcadores de destino, paneles de contenido mejorados y vista adaptable.
- Todo funciona sin internet, compilación o instalación: abrir `index.html`.
- Edita `contenido.js` para modificar tus textos, proyectos y enlaces.
