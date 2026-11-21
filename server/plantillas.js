// Motor de respaldo sin IA: guiones por plantilla, para que la demo nunca falle.
const pick = (a, s) => a[Math.abs(s) % a.length];

export function plantilla({ leccion, perfil = {}, formato, semilla = Date.now() }) {
  const t = `${leccion.tema} ${leccion.titulo}`.toLowerCase();
  const idolo = perfil.idolos?.[0] || pick(['Messi', 'Bad Bunny', 'MrBeast', 'Peso Pluma'], semilla);
  const h = formato === 'horizontal';
  let g;
  if (/esfera|volumen|cubo|cilindro/.test(t)) g = volumen(idolo);
  else if (/velocidad|distancia|km|rapidez|tiempo/.test(t)) g = velocidad(idolo);
  else if (/porcentaje|descuento|%|interes|inter[eé]s/.test(t)) g = porcentaje(idolo);
  else if (/fracci|probabil|azar|raz[oó]n/.test(t)) g = probabilidad(idolo);
  else g = ecuacion(idolo);
  g.tema = leccion.tema;
  if (!h) g.escenas = g.escenas.filter((e) => !e.soloLargo);
  return g;
}

const volumen = (idolo) => ({
  titulo: `¿Cuántos diamantes lleva ${idolo} en el cuello? 💎`, etiquetas: ['dinero', 'música'], estilo_gancho: 'fama', paleta: 'oro',
  variables: { r: '0.4', n: '120' },
  calculos: [{ id: 'r3', calc: 'r**3' }, { id: 'v1', calc: '4/3*pi*r**3' }, { id: 'total', calc: 'v1*n', final: true }],
  verificacion: { calc: '120*4/3*pi*0.4**3', contra: 'total' },
  escenas: [
    { tipo: 'gancho', texto: `¿CUÁNTO *DIAMANTE* LLEVA ${idolo.toUpperCase()} EN EL *CUELLO*?`, emoji: '💎', extras: ['⛓️', '🤑'], narracion: `¿Cuánto diamante lleva ${idolo} colgado en el cuello? Spoiler: es pura matemática.` },
    { tipo: 'datos', titulo: 'Lo que sabemos', emoji: '⛓️', datos: [{ simbolo: 'n', etiqueta: 'Diamantes en la cadena', valor: '{n}', emoji: '💎' }, { simbolo: 'r', etiqueta: 'Radio de cada uno', valor: '{r} cm', emoji: '📏' }], narracion: 'Digamos que la cadena trae {n} diamantes redonditos de {r} centímetros de radio.' },
    { tipo: 'formula', formula: 'V = 4/3 · π · r³', nota: 'Volumen de una esfera', narracion: 'Cada diamante es una esfera. Ve es igual a cuatro tercios por pi por erre al cubo.' },
    { tipo: 'pregunta', pregunta: '¿Qué hacemos con el radio?', opciones: ['Lo elevamos al cubo', 'Lo multiplicamos por 3'], correcta: 0, narracion: 'Pregunta rápida: ¿qué le hacemos al radio? ¿Vos qué harías?', si_bien: '¡Exacto! Al cubo: el radio por sí mismo tres veces.', si_mal: '¡No! Al cubo no es por tres: es multiplicar el radio por sí mismo tres veces.' },
    { tipo: 'paso', expr: 'V = 4/3 · π · ({r})³', nota: 'Sustituimos r', narracion: 'Metemos el radio: {r}.' },
    { tipo: 'paso', expr: 'V = 4/3 · π · {r3}', nota: 'Elevamos al cubo', narracion: '{r} al cubo da {r3}.', soloLargo: true },
    { tipo: 'paso', expr: 'V = {v1} cm³', nota: 'Un diamante', narracion: 'Un solo diamante: {v1} centímetros cúbicos.' },
    { tipo: 'paso', expr: 'V = {v1} · {n}', nota: 'Toda la cadena', narracion: 'Y lo multiplicamos por los {n} diamantes.' },
    { tipo: 'iconos', cantidad: '{n}', emoji: '💎', texto: '{n} diamantes', narracion: 'Imaginate los {n} brillando en fila.', soloLargo: true },
    { tipo: 'resultado', valor: '{total}', unidad: 'cm³', comparacion: '¡Como 5 dados de puro diamante!', emoji: '🤑', narracion: '{total} centímetros cúbicos de diamante. Eso no es cadena, es inversión.' },
    { tipo: 'cta', texto: '¿Y si fueran 200 diamantes?', narracion: 'Ahora vos: ¿y si fueran 200? Resolvelo en el reto que aparece al terminar.' },
  ],
  quiz: [
    { pregunta: '¿Qué volumen tiene un diamante de radio 0.5 cm?', calc: '4/3*pi*0.5**3', unidad: 'cm³', explicacion: 'V = 4/3·π·0.5³' },
    { pregunta: 'Si el radio se duplica, el volumen…', opciones: ['Se duplica', 'Se multiplica por 8', 'Se triplica', 'Queda igual'], correcta: 1, explicacion: 'El radio va al cubo: 2³ = 8' },
    { pregunta: '¿Cuánto volumen tienen 200 diamantes de radio 0.4 cm?', calc: '200*4/3*pi*0.4**3', unidad: 'cm³', explicacion: 'Volumen de uno por 200' },
  ],
});

const velocidad = (idolo) => ({
  titulo: `¿A cuántos km/h va el Lambo de ${idolo} a Antigua? 🏎️`, etiquetas: ['autos', 'dinero'], estilo_gancho: 'dinero', paleta: 'fuego',
  variables: { d: '45', t: '0.25' },
  calculos: [{ id: 'v', calc: 'd/t', final: true }, { id: 'min', calc: 't*60' }],
  verificacion: { calc: '45*4', contra: 'v' },
  escenas: [
    { tipo: 'gancho', texto: `¿A CUÁNTOS *KM/H* VA EL LAMBO DE ${idolo.toUpperCase()}?`, emoji: '🏎️', extras: ['💨', '🔥'], narracion: `Si ${idolo} quiere llegar a Antigua en un cuarto de hora, ¿a cuánto tiene que ir su Lambo?` },
    { tipo: 'datos', titulo: 'El viaje', emoji: '🏎️', datos: [{ simbolo: 'd', etiqueta: 'Guate → Antigua', valor: '{d} km', emoji: '🛣️' }, { simbolo: 't', etiqueta: 'Tiempo', valor: '{t} h', emoji: '⏱️' }], narracion: 'Son {d} kilómetros y quiere hacerlo en {t} horas, o sea {min} minutos.' },
    { tipo: 'formula', formula: 'v = d ÷ t', nota: 'Rapidez = distancia ÷ tiempo', narracion: 'La rapidez es distancia entre tiempo.' },
    { tipo: 'pregunta', pregunta: '¿Qué operación hacemos?', opciones: ['Distancia ÷ tiempo', 'Distancia × tiempo'], correcta: 0, narracion: 'A ver vos: ¿multiplicamos o dividimos?', si_bien: '¡Eso! Rapidez es distancia entre tiempo.', si_mal: '¡No! Si multiplicás te da un número sin sentido. Rapidez es distancia ENTRE tiempo.' },
    { tipo: 'paso', expr: 'v = {d} ÷ {t}', nota: 'Sustituimos', narracion: 'Metemos {d} kilómetros entre {t} horas.' },
    { tipo: 'paso', expr: 'v = {v} km/h', nota: 'Dividimos', narracion: 'Y da {v} kilómetros por hora.' },
    { tipo: 'comparacion', unidad: 'km/h', barras: [{ etiqueta: 'Lambo', valor: '{v}', emoji: '🏎️' }, { etiqueta: 'Camioneta', valor: '60', emoji: '🚌' }, { etiqueta: 'Guepardo', valor: '110', emoji: '🐆' }], narracion: 'Más rápido que un guepardo y que la camioneta del Roosevelt.', soloLargo: true },
    { tipo: 'resultado', valor: '{v}', unidad: 'km/h', comparacion: '¡Más rápido que un guepardo! 🐆', emoji: '💨', narracion: '{v} kilómetros por hora. Ojo, con esa velocidad la multa sale más cara que el carro.' },
    { tipo: 'cta', texto: '¿Y si quisiera llegar en 20 minutos?', narracion: 'Tu turno: ¿y si quiere llegar en veinte minutos? Calculalo en el reto del final.' },
  ],
  quiz: [
    { pregunta: 'Si recorre 45 km en 20 minutos (1/3 h), ¿a cuántos km/h va?', calc: '45/(1/3)', unidad: 'km/h', explicacion: 'v = d ÷ t = 45 ÷ (1/3)' },
    { pregunta: 'Si duplicás el tiempo con la misma distancia, la rapidez…', opciones: ['Se duplica', 'Se reduce a la mitad', 'No cambia', 'Se triplica'], correcta: 1, explicacion: 'v = d ÷ t: más tiempo, menos rapidez' },
    { pregunta: 'A 90 km/h, ¿cuántas horas tarda en recorrer 45 km?', calc: '45/90', unidad: 'h', explicacion: 't = d ÷ v' },
  ],
});

const porcentaje = (idolo) => ({
  titulo: `Los tenis de ${idolo} con 35% de descuento: ¿cuánto pagás? 👟`, etiquetas: ['moda', 'dinero'], estilo_gancho: 'dinero', paleta: 'neon',
  variables: { p: '1400', d: '35' },
  calculos: [{ id: 'desc', calc: 'p*d/100' }, { id: 'pagar', calc: 'p-desc', final: true }],
  verificacion: { calc: '1400*0.65', contra: 'pagar' },
  escenas: [
    { tipo: 'gancho', texto: `¿CUÁNTO PAGÁS POR LOS *TENIS* DE ${idolo.toUpperCase()}?`, emoji: '👟', extras: ['🛍️', '💸'], narracion: `Los tenis edición ${idolo} tienen 35 por ciento de descuento. ¿Te alcanza o no te alcanza?` },
    { tipo: 'datos', titulo: 'La oferta', emoji: '👟', datos: [{ simbolo: 'p', etiqueta: 'Precio normal', valor: 'Q{p}', emoji: '🏷️' }, { simbolo: 'd', etiqueta: 'Descuento', valor: '{d}%', emoji: '🔥' }], narracion: 'Cuestan {p} quetzales y tienen {d} por ciento de descuento.' },
    { tipo: 'formula', formula: 'desc = p · d ÷ 100', nota: 'El descuento en quetzales', narracion: 'El descuento es el precio por el porcentaje, entre cien.' },
    { tipo: 'pregunta', pregunta: '¿Cómo sacamos el 35%?', opciones: ['Precio × 35 ÷ 100', 'Precio − 35'], correcta: 0, narracion: 'Pregunta: ¿cómo sacamos el treinta y cinco por ciento? ¿Vos qué harías?', si_bien: '¡Exacto! Por treinta y cinco, entre cien.', si_mal: '¡No! Restar 35 quetzales no es restar el 35 por ciento. Es precio por 35 entre 100.' },
    { tipo: 'paso', expr: 'desc = {p} · {d} ÷ 100', nota: 'Sustituimos', narracion: '{p} por {d}, entre cien…' },
    { tipo: 'paso', expr: 'desc = Q{desc}', nota: 'Te ahorrás esto', narracion: 'Te ahorrás {desc} quetzales.' },
    { tipo: 'paso', expr: 'Q{p} − Q{desc}', nota: 'Restamos', narracion: 'Ahora restamos el descuento al precio.' },
    { tipo: 'fraccion', partes: 20, marcadas: 7, etiqueta: '35%', narracion: '35 por ciento es como 7 de cada 20 partes del precio.', soloLargo: true },
    { tipo: 'resultado', valor: 'Q{pagar}', unidad: '', comparacion: '¡Y te sobra para el shuco! 🌭', emoji: '🤑', narracion: 'Pagás {pagar} quetzales. Y con lo que ahorraste, te sobra para el shuco.' },
    { tipo: 'cta', texto: '¿Y si el descuento fuera 50%?', narracion: 'Tu turno: ¿y si el descuento fuera del cincuenta por ciento? Hacelo en el reto del final.' },
  ],
  quiz: [
    { pregunta: '¿Cuánto pagás por unos tenis de Q1,400 con 50% de descuento?', calc: '1400*0.5', unidad: 'Q', explicacion: 'Q1,400 − 50% = Q700' },
    { pregunta: 'Un 25% equivale a…', opciones: ['1/4', '1/2', '1/5', '2/5'], correcta: 0, explicacion: '25/100 = 1/4' },
    { pregunta: '¿Cuánto es el 20% de Q900?', calc: '900*20/100', unidad: 'Q', explicacion: '900 · 20 ÷ 100' },
  ],
});

const probabilidad = (idolo) => ({
  titulo: `¿Le gana ${idolo} a la ruleta del casino? 🎰`, etiquetas: ['dinero', 'juegos'], estilo_gancho: 'reto', paleta: 'neon',
  variables: { casos: '1', total: '37' },
  calculos: [{ id: 'p', calc: 'casos/total', como: 'fraccion' }, { id: 'pct', calc: 'casos/total*100', final: true, decimales: 1 }],
  verificacion: { calc: '100/37', contra: 'pct' },
  escenas: [
    { tipo: 'gancho', texto: `¿PUEDE ${idolo.toUpperCase()} GANARLE AL *CASINO*?`, emoji: '🎰', extras: ['🎲', '💰'], narracion: `${idolo} le apuesta todo a un número de la ruleta. ¿Qué tan probable es que gane?` },
    { tipo: 'datos', titulo: 'La ruleta', emoji: '🎡', datos: [{ simbolo: 'f', etiqueta: 'Casos a favor', valor: '{casos}', emoji: '✅' }, { simbolo: 'T', etiqueta: 'Casillas totales', valor: '{total}', emoji: '🎡' }], narracion: 'La ruleta tiene {total} casillas y él apuesta a una sola.' },
    { tipo: 'formula', formula: 'P = favorables ÷ totales', nota: 'Probabilidad clásica', narracion: 'La probabilidad es casos favorables entre casos totales.' },
    { tipo: 'pregunta', pregunta: '¿Cuál es la probabilidad?', opciones: ['1 de 37', '1 de 2: gana o pierde'], correcta: 0, narracion: 'Ojo: ¿qué probabilidad tiene? ¿Vos qué decís?', si_bien: '¡Exacto! Una casilla entre treinta y siete.', si_mal: '¡No! Ganar o perder no es mitad y mitad: hay 37 casillas y solo una es la suya.' },
    { tipo: 'paso', expr: 'P = {casos} ÷ {total}', nota: 'Sustituimos', narracion: 'Uno entre {total}.' },
    { tipo: 'fraccion', partes: 37, marcadas: 1, etiqueta: '1/37', narracion: 'Una rebanadita de {total}. Así de flaco está el chance.' },
    { tipo: 'paso', expr: 'P = {pct}%', nota: 'En porcentaje', narracion: 'En porcentaje: {pct} por ciento.' },
    { tipo: 'resultado', valor: '{pct}', unidad: '%', comparacion: 'La casa SIEMPRE gana 🏦', emoji: '😬', narracion: 'Apenas {pct} por ciento. Por eso la casa siempre gana. Mejor invertí.' },
    { tipo: 'cta', texto: '¿Y si apuesta a 3 números?', narracion: 'Tu turno: ¿y si apuesta a tres números? Calculalo en el reto del final.' },
  ],
  quiz: [
    { pregunta: 'Si apuesta a 3 números de 37, ¿qué porcentaje de probabilidad tiene?', calc: '3/37*100', unidad: '%', explicacion: 'P = 3 ÷ 37' },
    { pregunta: 'Una probabilidad de 1/2 significa…', opciones: ['Que siempre gana', 'Que gana la mitad de las veces en promedio', 'Que nunca gana', 'Que gana 2 veces'], correcta: 1, explicacion: '1/2 = 50 %' },
    { pregunta: 'En un dado, ¿qué porcentaje de probabilidad hay de sacar 6?', calc: '1/6*100', unidad: '%', explicacion: 'P = 1 ÷ 6' },
  ],
});

const ecuacion = (idolo) => ({
  titulo: `¿Cuántos meses para comprar la camisola de ${idolo}? ⚽`, etiquetas: ['fútbol', 'metas'], estilo_gancho: 'reto', paleta: 'selva',
  variables: { a: '150', b: '300', c: '1800' },
  calculos: [{ id: 'resta', calc: 'c-b' }, { id: 'x', resolver: '150*x+300=1800', incognita: 'x', final: true }],
  verificacion: { calc: '(1800-300)/150', contra: 'x' },
  escenas: [
    { tipo: 'gancho', texto: `¿CUÁNTOS *MESES* PARA LA CAMISOLA DE ${idolo.toUpperCase()}?`, emoji: '⚽', extras: ['👕', '💸'], narracion: `La camisola original de ${idolo} cuesta mil ochocientos. ¿Cuántos meses tenés que ahorrar?` },
    { tipo: 'datos', titulo: 'Tu plan', emoji: '🐷', datos: [{ simbolo: 'a', etiqueta: 'Ahorrás por mes', valor: 'Q{a}', emoji: '🪙' }, { simbolo: 'b', etiqueta: 'Ya tenés', valor: 'Q{b}', emoji: '👛' }, { simbolo: 'c', etiqueta: 'Precio', valor: 'Q{c}', emoji: '👕' }], narracion: 'Ahorrás {a} al mes y ya tenés {b}. La meta: {c}.' },
    { tipo: 'formula', formula: '150x + 300 = 1800', nota: 'x = meses', narracion: 'Ciento cincuenta por equis, más trescientos, igual a mil ochocientos.' },
    { tipo: 'pregunta', pregunta: '¿Qué pasa con el +300?', opciones: ['Pasa restando', 'Pasa sumando', 'Pasa dividiendo'], correcta: 0, narracion: 'Pregunta clave: ¿cómo se pasa el más trescientos al otro lado?', si_bien: '¡Exacto! Lo que suma pasa restando.', si_mal: '¡No! Si suma de un lado, pasa restando del otro. Ese es el error más común.' },
    { tipo: 'paso', expr: '150x = 1800 − 300', nota: 'El +300 cruza restando', narracion: 'El trescientos pasa al otro lado restando.' },
    { tipo: 'paso', expr: '150x = {resta}', nota: 'Restamos', narracion: 'Nos queda ciento cincuenta equis igual a {resta}.' },
    { tipo: 'paso', expr: 'x = {resta} ÷ 150', nota: 'El 150 cruza dividiendo', narracion: 'El ciento cincuenta pasa dividiendo.' },
    { tipo: 'resultado', valor: '{x}', unidad: 'meses', comparacion: '¡Para el próximo clásico ya la tenés! 🏟️', emoji: '🏆', narracion: '{x} meses. Para el próximo clásico ya la estás estrenando.' },
    { tipo: 'cta', texto: '¿Y si ahorrás Q250 al mes?', narracion: 'Tu turno: ¿y si ahorrás doscientos cincuenta al mes? Resolvelo en el reto del final.' },
  ],
  quiz: [
    { pregunta: 'Si ahorrás Q250 al mes y ya tenés Q300, ¿en cuántos meses llegás a Q1,800?', calc: '(1800-300)/250', unidad: 'meses', explicacion: '250x + 300 = 1800' },
    { pregunta: 'En 150x + 300 = 1800, ¿qué pasa con el +300 al despejar?', opciones: ['Pasa multiplicando', 'Pasa restando', 'Pasa dividiendo', 'Desaparece'], correcta: 1, explicacion: 'Lo que suma pasa restando' },
    { pregunta: 'Resolvé: 4x + 8 = 40', calc: '(40-8)/4', unidad: '', explicacion: 'x = (40 − 8) ÷ 4' },
  ],
});
