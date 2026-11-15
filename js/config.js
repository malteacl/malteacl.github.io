/* Maltea · conexión con Supabase.
   Con ambos valores vacíos, Maltea guarda todo en el navegador de cada persona.
   La clave publicable (sb_publishable_...) está hecha para ir en el navegador: los permisos
   los deciden las reglas de supabase/schema.sql. Nunca pongas aquí la clave secreta (sb_secret_...). */
window.MALTEA_CONFIG = {
  supabaseUrl: "",   // https://TU-PROYECTO.supabase.co
  supabaseKey: "",   // sb_publishable_...
  google: false      // true cuando actives el ingreso con Google en Supabase
};
