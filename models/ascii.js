'use strict';

const ASCII_PALETTES = {
  original:     ' `.-:+*%$#',
  conservative: " .'-:;+=*%$#@",
  expanded:     '$@B%8&WM#*o;:,. ',
  detailed:     ' .,-:;+*%#@$',
  maximum:      '$@B%8&WM#*o;:,. -+=<>/|(){}[]?',
};

function selectChar(r, g, b, r2, g2, b2, pr, pg, pb, nr, ng, nb) {
  const rq  = r  >> 5, gq  = g  >> 5, bq  = b  >> 5;
  const r2q = r2 >> 5, g2q = g2 >> 5, b2q = b2 >> 5;
  const prq = pr >> 5, pgq = pg >> 5, pbq = pb >> 5;
  const nrq = nr >> 5, ngq = ng >> 5, nbq = nb >> 5;

  if (prq === r2q && pgq === g2q && pbq === b2q &&
      rq  !== prq && gq  !== pgq && bq  !== pbq) return '\\';
  if (rq  === r2q && gq  === g2q && bq  === b2q &&
      prq !== rq  && nrq !== rq)                  return '|';
  if (r2q === nrq && g2q === ngq && b2q === nbq)
    return (rq === r2q && gq === g2q && bq === b2q) ? '"' : '/';
  if (prq === nrq && pgq === ngq && pbq === nbq)
    return (prq === rq  && pgq === gq  && pbq === bq)  ? '_' : '=';
  return prq === r2q ? '*' : '.';
}

module.exports = { ASCII_PALETTES, selectChar };
