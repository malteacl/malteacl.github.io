# Cuentas con Supabase

Con Supabase, cada persona entra con su correo y encuentra su perfil, sus notas y su lista en cualquier dispositivo. Sin configurarlo, Maltea sigue guardando todo en el navegador.

Dentro de Claude, la página no puede conectarse a Supabase: ahí usa el almacenamiento del artefacto. Supabase funciona en el sitio publicado, por ejemplo en GitHub Pages.

## Puesta en marcha

Los nombres de los menús son los del panel de Supabase a noviembre de 2026 y pueden cambiar.

1. **Crea el proyecto.** En [supabase.com](https://supabase.com) crea un proyecto en el plan gratuito. Elige una región cercana a Chile, como São Paulo.
2. **Crea las tablas.** Abre **SQL Editor**, pega el contenido completo de `supabase/schema.sql` y ejecútalo.
3. **Desactiva la confirmación por correo.** En **Authentication > Sign In / Providers > Email**, apaga **Confirm email**. El servicio de correo incluido solo envía 2 correos por hora y únicamente a miembros del proyecto, así que con la confirmación encendida casi nadie podría registrarse.
4. **Indica la dirección del sitio.** En **Authentication > URL Configuration**, pon la dirección pública de Maltea (por ejemplo `https://malteacl.github.io/`) en **Site URL** y agrégala en **Redirect URLs**.
5. **Copia los dos datos públicos.** En **Project Settings > API Keys** copia la **Project URL** y la **Publishable key** (`sb_publishable_...`).
6. **Pégalos en `js/config.js`** y sube el cambio.

La clave publicable puede estar en el repositorio: solo permite lo que autorizan las reglas de `schema.sql`. La clave secreta (`sb_secret_...`) no debe aparecer nunca en el código.

## Qué queda guardado

| Tabla | Contenido | Quién puede leer o escribir |
|---|---|---|
| `profiles` | Nombre, país, región, mayoría de edad | Solo su dueño |
| `ratings` | Nota de 1 a 5 por cerveza | Solo su dueño |
| `wishlist` | Cervezas por probar | Solo su dueño |
| `suggestions` | Cervezas sugeridas | Su autor las crea y las lee; tú las ves en el panel de Supabase |

Los promedios salen de la función `beer_stats()`, que entrega votos y suma por cerveza sin exponer notas individuales. `delete_my_account()` borra a la persona y, en cascada, todo lo suyo.

## Cómo se comporta la página

- Sin sesión, se ve el catálogo y los promedios, pero para puntuar hay que entrar.
- Al entrar por primera vez, las notas que la persona tenía en el navegador se suben a su cuenta.
- Al cerrar sesión, el navegador queda sin datos de esa persona.
- Si Supabase no responde en 10 segundos, la página sigue funcionando en modo local.

## Google, correo y lanzamiento

Los pasos para activar Google, el servicio de correo y la recuperación de contraseña están en `docs/LANZAMIENTO.md`.

## Qué se probó

- `schema.sql` se ejecutó en un Postgres local, con dos personas y un visitante anónimo, para comprobar que nadie lee ni modifica datos ajenos.
- La página se probó en un navegador con el cliente real de Supabase contra un servidor simulado.
- El 15 de noviembre de 2026 se probó contra el proyecto real con una cuenta temporal: registro, perfil, notas, lista, sugerencias, promedios públicos y borrado de cuenta funcionaron, y las reglas rechazaron notas fuera de rango, perfiles sin mayoría de edad y escrituras a nombre de otra persona.
