/* Vinovim — a marca: cores, o “V” em fita e o nome “vinovim”.
   O nome é a Poppins Bold (licença SIL OFL) convertida em traçados, com o espaçamento acertado à mão:
   fica igual e nítido em qualquer ecrã e tamanho, sem esperar que uma fonte carregue. */
const MARCA = {
  violeta: '#8b5cff',
  rosa: '#ff4d94',
  coral: '#ff6a6a'
};

/* o “V” em fita: a haste da esquerda (rosa → coral) passa à frente da da direita (violeta → rosa) */
function marcaV(id) {
  return `<svg class="marca-v" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${id}a" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="36"><stop offset="0" stop-color="${MARCA.rosa}"/><stop offset="1" stop-color="${MARCA.coral}"/></linearGradient><linearGradient id="${id}b" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="36"><stop offset="0" stop-color="${MARCA.violeta}"/><stop offset="1" stop-color="${MARCA.rosa}"/></linearGradient></defs><path class="v back" d="M32.6 13.6 24 34.4" fill="none" stroke="url(#${id}b)" stroke-width="6.1" stroke-linecap="round"/><path class="v front" d="M15.4 13.6 24 34.4" fill="none" stroke="url(#${id}a)" stroke-width="6.1" stroke-linecap="round"/></svg>`;
}

/* letras de “vinovim”: [traçado, ponto do “i”] */
const NOME = [
  ['M313 -160 434 -558H616L418 0H207L9 -558H192Z'],
  [
    'M827 -558V0H656V-558Z',
    'M640 -708Q640 -748 668.5 -774.5Q697 -801 742 -801Q786 -801 814.5 -774.5Q843 -748 843 -708Q843 -669 814.5 -642.5Q786 -616 742 -616Q697 -616 668.5 -642.5Q640 -669 640 -708Z'
  ],
  [
    'M1498 -326V0H1328V-303Q1328 -359 1299 -390Q1270 -421 1221 -421Q1172 -421 1143 -390Q1114 -359 1114 -303V0H943V-558H1114V-484Q1140 -521 1184 -542.5Q1228 -564 1283 -564Q1381 -564 1439.5 -500.5Q1498 -437 1498 -326Z'
  ],
  [
    'M1569 -279Q1569 -365 1607 -430.5Q1645 -496 1711 -531Q1777 -566 1859 -566Q1941 -566 2007 -531Q2073 -496 2111 -430.5Q2149 -365 2149 -279Q2149 -193 2110.5 -127.5Q2072 -62 2005.5 -27Q1939 8 1857 8Q1775 8 1709.5 -27Q1644 -62 1606.5 -127Q1569 -192 1569 -279ZM1975 -279Q1975 -346 1941.5 -382Q1908 -418 1859 -418Q1809 -418 1776 -382.5Q1743 -347 1743 -279Q1743 -212 1775.5 -176Q1808 -140 1857 -140Q1906 -140 1940.5 -176Q1975 -212 1975 -279Z'
  ],
  ['M2455 -160 2576 -558H2758L2560 0H2349L2151 -558H2334Z'],
  [
    'M2969 -558V0H2798V-558Z',
    'M2782 -708Q2782 -748 2810.5 -774.5Q2839 -801 2884 -801Q2928 -801 2956.5 -774.5Q2985 -748 2985 -708Q2985 -669 2956.5 -642.5Q2928 -616 2884 -616Q2839 -616 2810.5 -642.5Q2782 -669 2782 -708Z'
  ],
  [
    'M4024 -326V0H3854V-303Q3854 -357 3825.5 -386.5Q3797 -416 3747 -416Q3697 -416 3668.5 -386.5Q3640 -357 3640 -303V0H3470V-303Q3470 -357 3441.5 -386.5Q3413 -416 3363 -416Q3313 -416 3284.5 -386.5Q3256 -357 3256 -303V0H3085V-558H3256V-488Q3282 -523 3324 -543.5Q3366 -564 3419 -564Q3482 -564 3531.5 -537Q3581 -510 3609 -460Q3638 -506 3688 -535Q3738 -564 3797 -564Q3901 -564 3962.5 -501Q4024 -438 4024 -326Z'
  ]
];
/* o nome com o gradiente da marca; cada letra e cada ponto dos “i” é um traçado à parte (a abertura anima-os) */
function marcaNome(id) {
  const ps = NOME.map(
    ([d, dot], i) =>
      `<path class="l" style="--i:${i}" d="${d}"/>` + (dot ? `<path class="pt" style="--i:${i}" d="${dot}"/>` : '')
  ).join('');
  return `<svg class="marca-nome" viewBox="8 -802 4018 812" role="img" aria-label="vinovim"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="8" y1="0" x2="4026" y2="0"><stop offset="0" stop-color="${MARCA.violeta}"/><stop offset=".6" stop-color="${MARCA.rosa}"/><stop offset="1" stop-color="${MARCA.coral}"/></linearGradient></defs><g fill="url(#${id})">${ps}</g></svg>`;
}
