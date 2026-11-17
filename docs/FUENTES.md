# Fuentes y criterios de los catálogos

Cada país tiene su archivo: `js/catalogo-cl.js` (Chile) y `js/catalogo-es.js` (España). Los estilos y familias son comunes y viven en `js/data.js`.

**Regla de identificadores.** El identificador de una cerveza sale de su marca y su variedad (`Mahou` + `Cinco Estrellas` → `mahou-cinco-estrellas`). Las notas de las personas cuelgan de él, así que nunca se cambian la marca ni la variedad de una cerveza publicada. Una cerveza que se vende en los dos países se escribe igual en ambos archivos y con el mismo estilo; el fabricante, el segmento y la graduación pueden variar según el país.

# Chile

Catálogo levantado el 15 de noviembre de 2026.

## Fuentes

| Código | Fuente | Para qué se usó |
|---|---|---|
| J | Listado de cervezas de Jumbo.cl (categorías Cervezas, Tradicionales y Artesanales) | Disponibilidad en Chile, nombre, variedad y graduación |
| L | Lider.cl | Disponibilidad y variedades que no aparecen en Jumbo |
| B | Birrapedia, fichas de cervezas chilenas | Estilo y graduación de artesanales |
| W | World Beer Awards, productos premiados de cada cervecería | Variedades vigentes de Kross |
| P | Prensa y sitios de las cervecerías (La Tercera, The Clinic, Diario Financiero, bares Kunstmann) | Estilo declarado por la cervecería |

## Criterios

1. **Disponibilidad.** Una cerveza entra sin marca cuando aparece en un listado de venta chileno. Las que solo figuran en bases de referencia llevan la marca `r`.
2. **Estilo.** Vale primero lo que declara la cervecería, luego Birrapedia y al final la descripción del supermercado. Cuando el nombre comercial no dice el estilo y no hay otra fuente, la cerveza lleva la marca `c` y se muestra como «Estilo por confirmar».
3. **Graduación.** Se usa la del listado de venta. Queda vacía cuando las fuentes no coinciden o no la publican.
4. **Segmentos.** En el archivo, el segmento `local` es el que la página muestra como «Artesanales y de especialidad chilenas». «Masivas» son las marcas de gran volumen de CCU y Cervecería AB InBev, propias o bajo licencia. «Artesanales y de especialidad chilenas» agrupa cervecerías independientes y marcas de especialidad de grupos grandes (Kunstmann, Austral, Guayacán, D'olbek, Volcanes del Sur, Leyendas de Origen). «Importadas» son las demás.
5. **País.** Es el país de origen de la marca, aunque se elabore en Chile bajo licencia.

## Correcciones hechas frente al listado de supermercado

| Cerveza | El listado dice | Se clasificó como | Motivo |
|---|---|---|---|
| Soko's Cosmic Walk | Imperial IPA | Belgian Dark Strong Ale | La cervecería y la prensa la describen así; ganó esa categoría en los World Beer Awards 2025 |
| Tropera Don Manu | sin estilo | American IPA | Birrapedia |
| Tropera Guadalina | sin estilo | Golden / Blonde Ale | Birrapedia y Untappd |
| Granizo IRA! | sin estilo | Red IPA (India Red Ale) | Descripción de la cervecería |
| Kunstmann Gran Torobayo | Pale Ale | Old Ale | Carta de los bares Kunstmann |
| Austral Torres del Paine | Lager | Maibock / Helles Bock | Ficha de Austral en Jumbo y Lider |
| Becker Black Lager | Black Lager | Schwarzbier | Ficha del producto |
| Oettinger Schwarz | Stout | Schwarzbier | Es una lager negra alemana |
| Westmalle Dubbel | 9,5° | 7,0° | 9,5° corresponde a la Tripel |
| Alhambra Reserva Roja | Red Ale | Bock | Es una lager fuerte de 7,2° |
| Barcelona Cerdos Voladores | Pale Ale | American IPA | Estilo declarado por la cervecería |
| Trooper | Amber Ale | English Bitter (ESB) | Estilo declarado por Robinsons |
| Samuel Adams Boston Lager | Lager | Vienna Lager | Clasificación habitual del estilo |

Las cinco últimas filas se apoyan en conocimiento general del estilo y no en una fuente consultada para este levantamiento; conviene revisarlas.

## Estilos por confirmar

AC/DC Lager (Jumbo la vende como lager; en Alemania Karlsberg la rotula como Pils, así que quedó como Pale Lager hasta confirmar), Royal Guard Sweet y Rosé, Becker B-Mix, Kunstmann Lager Blanc, Austral Patagonia Lager Mosaic y Muérdago, D'olbek Lager Belga, Kross Rosé Ale, Odissea Tropic Ale, Altamira Banana Pancake, Flensburger Pilsener y Gold, Damm Inedit y Barcelona Hoppy Flower.

## Lo que no cubre

- El listado de Jumbo muestra unas 300 presentaciones; las páginas se solapan y es posible que falten variedades.
- Marcas vistas solo en el filtro de marcas de Jumbo, sin variedad identificada, quedaron fuera: Patagonia, Bett'r, Duff, Viiking, Calatrava, Ghali y Go Barman.
- No se revisaron botillerías, Unimarc, Tottus ni tiendas especializadas.
- Del mundo artesanal hay 24 cervecerías; la asociación gremial habla de cerca de 400 en el país.
- El perfil de sabor se asigna por estilo, no por cerveza.

# España

Catálogo levantado el 16 de noviembre de 2026: 160 cervezas de 49 marcas. 27 se venden también en Chile y comparten identificador.

## Fuentes

| Código | Fuente | Para qué se usó |
|---|---|---|
| M | Webs e informes de los grupos cerveceros: Mahou San Miguel (página de marcas), Damm (estado de información no financiera 2024 y fichas), Heineken España, Hijos de Rivera, La Zaragozana, Founders | Portafolio vigente, estilo declarado y graduación |
| B | Birrapedia | Estilo y graduación |
| E | El Corte Inglés supermercado | Disponibilidad y graduación |
| O | OCU, comparativas de cervezas de supermercado | Marcas propias de Mercadona y Dia, graduación |
| P | Prensa general y especializada (lanzamientos 2025 y 2026) | Variedades nuevas y estilo declarado por la marca |
| G | Clasificación habitual del estilo, sin fuente consultada en este levantamiento | Importadas clásicas |

Las webs de Mercadona y Carrefour no se pudieron consultar; sus marcas propias salen de la OCU y de la prensa.

## Criterios

Los mismos de Chile, con estas diferencias:

1. **Segmentos.** «Masivas» son las marcas de Mahou San Miguel, Damm, Heineken España, Hijos de Rivera, La Zaragozana y Moritz, más las marcas propias de supermercado (Steinburg de Mercadona, Ramblers de Dia) y las extranjeras que se elaboran en España bajo licencia (Budweiser y Stella Artois las hace Mahou San Miguel). En el archivo, el segmento `local` es el que la página muestra como «Artesanas españolas». «Importadas» son las demás.
2. **Graduación.** Se muestra en % vol., como se rotula en España. Las «0,0» llevan 0; las que se venden como «sin» y no publican graduación (hasta 1 % vol.) se muestran como «Sin alcohol».
3. **Grupos con artesanas propias.** Nómada pertenece a Mahou San Miguel y Gran Vía a Cervecera Madrileña (la de La Virgen); se clasifican como artesanas españolas por su producto, igual que Kunstmann en Chile.
4. **Referencia.** Las artesanas llevan la marca `r` cuando su disponibilidad sale de Birrapedia o de la cervecería y no de un listado de venta.

## Estilos nuevos en la guía

Se sumaron a `js/data.js` para el catálogo español: Märzen, Doppelbock claro (Heller), Lager envejecida en barrica, Irish Red Ale, Belgian Blond Ale, Scotch Ale, Porter, Berliner Weisse y Shandy (cerveza con limonada).

## Clasificaciones que conviene conocer

| Cerveza | Se suele vender como | Se clasificó como | Motivo |
|---|---|---|---|
| Voll-Damm | Doble malta | Märzen | Estilo declarado por Damm, 7,2 % |
| Inedit | Cerveza de cocina | Witbier (por confirmar) | Damm la describe como mezcla de lager y cerveza de trigo con especias |
| Alhambra Reserva Roja | Roja | Bock | Lager fuerte de 7,2 %, no una red ale |
| Alhambra Reserva 1925 | Reserva | Strong lager | Pilsner reforzada de 6,4 % |
| Cruzcampo Gran Reserva | Gran Reserva | Strong lager | Birrapedia: strong international pale lager, 6,4 % |
| Cruzcampo Cruzial | Cerveza especial | German Pils | Birrapedia: pilsner, 5,9 % |
| San Miguel Selecta | Selecta | Märzen | Estilo declarado por la marca |
| 1906 Reserva Especial | Reserva Especial | Maibock / Helles Bock | Categoría con que la presenta Hijos de Rivera |
| 1906 Red Vintage | Red Vintage | Doppelbock claro (Heller) | Premiada en esa categoría |
| 1906 Black Coupage | Black Coupage | Bock oscura | Hijos de Rivera la presenta como Dunkler Bock |
| Ambar Export | Export | Vienna Lager | Lager ámbar de 7 % |
| Keler Brown | Brown | Schwarzbier | Lager oscura (Birrapedia) |
| Mahou Barrica | Barrica | Lager envejecida en barrica | Lager de 6,1 % reposada en madera |
| El Águila Sin Filtrar | Sin filtrar | Kellerbier | Lager sin filtrar de 5,5 % |

## Estilos por confirmar

Mahou Maestra Doble Lúpulo y Casimiro Mahou Ale, Damm Inedit, Bock-Damm, A.K. Damm y Malquerida, Estrella de Levante Negra, Cruzcampo Tremenda y 1904, Ambar 1900, Steinburg Suave y Tostada.

## Sin fuente consultada (código G)

Desperados, Moritz y Moritz Epidor, Guinness, Paulaner, Leffe, Hoegaarden, Grimbergen, Birra Moretti, Erdinger, Peroni, Carlsberg, Duvel, Chimay, Delirium y BrewDog Punk IPA. Son clasificaciones habituales, pero conviene revisar graduaciones contra la etiqueta española.

## Lo que no cubre

- No se revisaron listados completos de Mercadona, Carrefour, Lidl, Aldi, Eroski ni Dia: faltan marcas propias como Karlsquell (Aldi), Saer Brau (Carrefour) o Aurum (Eroski).
- Tampoco entran cervezas regionales de los grandes grupos con poca distribución (Victoria Diez, Estrella de Levante Reserva 60, El Alcázar, Ambar 10 o Montañesa) ni ediciones de temporada.
- Del mundo artesano hay 9 cervecerías; en España hay varios cientos.
- Mahou Sin (España) y Mahou Sin Alcohol (exportación a Chile) quedaron como cervezas distintas porque no se pudo confirmar que sean la misma receta.
