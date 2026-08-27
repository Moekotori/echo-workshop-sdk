const write = (value) => {
  document.getElementById('result').textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
};

const firstPlayable = (result) => (result.tracks || []).find((track) => track.playable !== false && track.kind !== 'collection');

document.getElementById('browse').onclick = async () => {
  const query = document.getElementById('query').value;
  const result = query.trim()
    ? await echo.sources.search('packaged-catalog', { query, page: 1, pageSize: 24 })
    : await echo.sources.browse('packaged-catalog', { page: 1, pageSize: 24 });
  write(result);
};

document.getElementById('play-first').onclick = async () => {
  const result = await echo.sources.browse('packaged-catalog', { page: 1, pageSize: 24 });
  const track = firstPlayable(result);
  if (!track) throw new Error('catalog-empty');
  const source = await echo.sources.resolve('packaged-catalog', track.providerTrackId);
  await echo.sources.playDirect(source);
  write(source);
};

document.getElementById('enqueue-first').onclick = async () => {
  const result = await echo.sources.browse('packaged-catalog', { page: 1, pageSize: 24 });
  const track = firstPlayable(result);
  if (!track) throw new Error('catalog-empty');
  const source = await echo.sources.resolve('packaged-catalog', track.providerTrackId);
  await echo.sources.enqueueDirect(source);
  write(source);
};
