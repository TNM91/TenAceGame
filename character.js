(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TenAceCharacter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const palettes = {
    skin: ['#f3cba5', '#dea575', '#bc8056', '#8c553b', '#573a2d'],
    hair: ['#24252c', '#60402e', '#c58b43', '#eed8a8', '#a34336'],
    shirt: ['#b9ed62', '#5ed6ce', '#778dff', '#f37968', '#f4eee1'],
    shorts: ['#182d3b', '#e8e2d5', '#51487b', '#265750'],
    racket: ['#b9ed62', '#ffad66', '#9b9bff', '#eeeeef'],
  };
  const styles = ['crop', 'curls', 'ponytail', 'bun', 'shaved'];
  const rackets = ['classic', 'power', 'control'];
  function fresh() { return { name: 'Rookie', skin: palettes.skin[1], hair: palettes.hair[0], shirt: palettes.shirt[0], shorts: palettes.shorts[0], racket: palettes.racket[0], style: 'crop', frame: 'classic' }; }
  function normalize(input) {
    const value = fresh();
    if (!input || typeof input !== 'object') return value;
    if (typeof input.name === 'string') value.name = input.name.replace(/[<>\u0000-\u001f\u007f]/g, '').trim().slice(0, 18) || value.name;
    for (const key of Object.keys(palettes)) if (palettes[key].includes(input[key])) value[key] = input[key];
    if (styles.includes(input.style)) value.style = input.style;
    if (rackets.includes(input.frame)) value.frame = input.frame;
    return value;
  }
  return { fresh, normalize, palettes, styles, rackets };
});
