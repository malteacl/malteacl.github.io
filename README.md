# Maltea

Prueba, puntúa y descubre tu próxima cerveza. Maltea reúne las cervezas que se venden en un país, deja que cada persona les ponga nota y recomienda otras parecidas a las que más le gustaron. La primera edición cubre Chile.

## Qué incluye

- **Registro por país de compra.** Hoy solo Chile está habilitado; el resto aparece como «próximamente».
- **Catálogo Chile:** 231 cervezas de 76 marcas y 15 países de origen, desde las masivas (Cristal, Escudo, Heineken, Coors, Corona) hasta artesanales (Kross, Granizo, Tamango, Soko's) e importadas.
- **Cata rápida:** una cerveza a la vez, para puntuar con 1 a 5 vasos, saltar o guardar en la lista.
- **Mi paladar:** mapa de sabores, niveles e insignias.
- **Recomendaciones** según estilo y perfil de sabor.
- **Guía de estilos** con las 16 familias y 75 estilos usados en el catálogo.

## Estructura

```
index.html            página
privacidad.html       política de privacidad (borrador)
css/styles.css        estilos y temas claro y oscuro
js/config.js          conexión con Supabase (vacía = modo local)
js/data.js            catálogo: familias, estilos, marcas y cervezas
js/app.js             lógica: cuentas, notas, recomendaciones, insignias
supabase/schema.sql   tablas, reglas de acceso y funciones para Supabase
docs/FUENTES.md       de dónde sale cada dato y cómo se clasifica
docs/SUPABASE.md      cómo activar las cuentas paso a paso
docs/LANZAMIENTO.md   pasos pendientes para lanzar
supabase/correos/     plantillas de correo en español
img/                  ícono e imagen para compartir
```

No hay paso de compilación ni dependencias. Para verla, abre `index.html` en un navegador o sirve la carpeta con cualquier servidor estático (por ejemplo, GitHub Pages).

## Dónde se guardan los datos

Maltea elige sola entre tres formas de guardar:

| Dónde se abre | Cuentas | Dónde quedan perfil y notas | Promedios compartidos |
|---|---|---|---|
| Sitio publicado con `js/config.js` completo | Correo y contraseña (Google opcional) | Supabase, en la cuenta de cada persona | Sí |
| Sitio publicado con `js/config.js` vacío | No hay | En el navegador (`localStorage`) | No |
| Artefacto de Claude | La cuenta de Claude | En el artefacto | Sí, entre quienes tienen acceso |

Los pasos para activar Supabase están en `docs/SUPABASE.md`.

## Cómo agregar una cerveza

En `js/data.js`, agrega una fila a `beers`:

```js
["Marca", "Variedad", "clave_de_estilo", 5.2, "", "J"],
```

1. La marca debe existir en `brands` (elaborador, país de origen, lugar, segmento).
2. La clave de estilo debe existir en `styles`. Si el estilo es nuevo, agrégalo con su familia y su perfil de 1 a 5 en amargor, dulzor de malta, cuerpo, tostado y aroma de lúpulo.
3. Usa `null` en la graduación si las fuentes no coinciden.
4. Marca con `c` las cervezas cuyo estilo no esté confirmado por la cervecería y con `r` las que no se hayan visto en un listado de venta.
5. Anota la fuente. Los códigos están en `docs/FUENTES.md`.

No cambies marca ni variedad de una cerveza ya publicada: su identificador se calcula con ambos nombres y las notas guardadas dependen de él.

## Cómo se recomienda

Cada estilo tiene un perfil de sabor. El gusto de una persona es la suma de los perfiles de lo que puntuó, ponderados por la nota y medidos contra la cerveza promedio del catálogo. La afinidad con una cerveza no probada combina la similitud con ese gusto (60 %) y la nota promedio que la persona dio a la misma familia (40 %). Se muestran hasta seis, con un máximo de dos por marca y por estilo.

## Pendientes

- Validar con cada cervecería los 13 estilos marcados «por confirmar».
- Ampliar el catálogo artesanal: Chile tiene cientos de cervecerías y aquí hay 24.
- Sumar un segundo supermercado y botillerías como fuente de disponibilidad.
- Activar Google, el servicio de correo y completar la política de privacidad: ver `docs/LANZAMIENTO.md`.
- Catálogos para otros países.
