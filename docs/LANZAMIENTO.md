# Lanzamiento de Maltea

Sitio: https://malteacl.github.io/
Proyecto de Supabase: `whfcgmbqfvfpgnanahij`

Los nombres de los menús son los de Supabase, Google Cloud y Brevo a noviembre de 2026 y pueden variar un poco.

## Ya está hecho

- Catálogo de 231 cervezas, cata rápida, recomendaciones, insignias y ranking.
- Cuentas con correo y contraseña, guardadas en Supabase y probadas en el sitio real.
- Pantallas para recuperar la contraseña y para elegir una nueva (se activan en el paso 3).
- Botón «Entrar con Google», que aparece solo cuando Google está activado en Supabase.
- Ícono del sitio e imagen de vista previa para WhatsApp y redes sociales.
- Plantillas de correo en español en `supabase/correos/`.

## Pasos para lanzar

### 1. Dirección del sitio en Supabase (2 minutos, obligatorio)

Sin esto, los enlaces de los correos y el ingreso con Google llevan a una dirección equivocada.

1. Abre **Authentication > URL Configuration**.
2. En **Site URL** escribe `https://malteacl.github.io/` y guarda.
3. En **Redirect URLs** agrega `https://malteacl.github.io/**` y guarda.

Aprovecha de revisar en **Authentication > Sign In / Providers > Email** si aparece un largo mínimo de contraseña; si existe, ponlo en 8, igual que la página.

### 2. Ingreso con Google (15 minutos, recomendado)

Es la forma más simple de entrar y no depende de correos: quien entra con Google no tiene contraseña que olvidar.

En [Google Cloud Console](https://console.cloud.google.com):

1. Crea un proyecto llamado `Maltea`.
2. Abre **Google Auth Platform** (antes «Pantalla de consentimiento de OAuth») y configúrala:
   - Nombre de la app: `Maltea`. Correo de asistencia: el tuyo.
   - Público: **Externo**.
   - En **Dominios autorizados** agrega `supabase.co` y `github.io`.
3. En **Clientes**, crea un cliente de tipo **Aplicación web**:
   - **Orígenes de JavaScript autorizados:** `https://malteacl.github.io`
   - **URI de redireccionamiento autorizados:** `https://whfcgmbqfvfpgnanahij.supabase.co/auth/v1/callback`
4. Copia el **ID de cliente** y el **Secreto del cliente**.
5. En **Público**, presiona **Publicar app**. Mientras esté en modo de prueba, solo entran los usuarios de prueba que agregues.

En Supabase:

6. Abre **Authentication > Sign In / Providers > Google**, actívalo, pega el ID y el secreto, y guarda.

Al recargar Maltea aparecerá «Entrar con Google». No hay que cambiar código.

### 3. Correo para recuperar contraseñas (20 minutos, recomendado)

Sin un servicio de correo propio, quien olvide su contraseña no puede recuperarla.

En [Brevo](https://www.brevo.com) (plan gratuito, 300 correos al día):

1. Crea la cuenta. Brevo puede tardar un rato en aprobarla para enviar.
2. En **Remitentes**, agrega el correo desde el que saldrán los mensajes y confírmalo con el enlace que te llega.
3. En **SMTP y API**, genera una **clave SMTP** y anota el usuario SMTP que muestra esa pantalla.

En Supabase, **Authentication > Emails > SMTP Settings**:

4. Activa **Enable custom SMTP** y completa:
   - **Host:** `smtp-relay.brevo.com`
   - **Port:** `587`
   - **Username:** el usuario SMTP de Brevo
   - **Password:** la clave SMTP
   - **Sender email:** el remitente que confirmaste
   - **Sender name:** `Maltea`
5. En **Authentication > Emails > Templates**, reemplaza dos plantillas con las de `supabase/correos/`:
   - **Reset password:** asunto `Cambia tu contraseña de Maltea`, cuerpo `recuperar-clave.html`.
   - **Confirm signup:** asunto `Confirma tu cuenta de Maltea`, cuerpo `confirmar-cuenta.html`.
6. Avisa para cambiar `recuperarClave: true` en `js/config.js`, que muestra «¿Olvidaste tu contraseña?».

Limitación: si el remitente es una dirección de Gmail u otro servicio gratuito, Brevo la reemplaza por una suya y los correos pueden llegar a spam. Se resuelve con un dominio propio (por ejemplo `maltea.cl`) autenticado en Brevo.

### 4. Confirmación de correo (dejar apagada por ahora)

**Confirm email** sigue apagado para que cualquiera pueda registrarse en el momento. Encenderlo exige que el paso 3 funcione bien; si no, la gente se queda sin poder entrar. Conviene activarlo cuando haya dominio propio.

### 5. Política de privacidad (listo)

`privacidad.html` identifica a Maltea SA como responsable, con contacto en `malteasa.cerveza@gmail.com`. Los derechos de acceso, rectificación, supresión y portabilidad también se ejercen dentro de la app con «Descargar mis datos», «Editar perfil» y «Borrar mi cuenta». Revisa ese correo con frecuencia: las solicitudes de datos personales tienen plazos legales de respuesta. Conviene que un abogado revise la política: la Ley 21.719 de datos personales tiene fecha de entrada en vigencia el 1 de diciembre de 2026, aunque hay un proyecto en el Congreso para postergarla.

### 6. Prueba final (10 minutos)

1. Abre el sitio en tu celular y en el computador.
2. Crea una cuenta, completa el perfil y puntúa tres cervezas.
3. Entra con la misma cuenta en el otro dispositivo y revisa que las notas estén.
4. Si activaste Google, entra con Google.
5. Si activaste el correo, pide recuperar la contraseña y sigue el enlace.
6. Comparte el enlace en WhatsApp y revisa que aparezca la imagen de vista previa.

## Después del lanzamiento

- **Sugerencias:** las cervezas que la gente sugiere están en la tabla `suggestions` (Supabase, **Table Editor**).
- **Uso:** el plan gratuito de Supabase cubre 50.000 usuarios activos al mes y 500 MB de datos. Revisa **Settings > Usage** de vez en cuando.
- **Pausa:** un proyecto gratuito se pausa tras una semana sin actividad; se reactiva desde el panel.
- **Catálogo:** quedan 13 cervezas con «Estilo por confirmar» (ver `docs/FUENTES.md`).
- **Dominio propio:** mejora la confianza, la entrega de correos y permite encender la confirmación de correo.
