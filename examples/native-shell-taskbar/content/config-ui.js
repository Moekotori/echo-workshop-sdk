const { root, schema, config } = echoConfigUi;
const draft = { widgetWidth: 360, uiScale: 100, alignment: 'right', ...(config && typeof config === 'object' ? config : {}) };
root.textContent = '';
const note = document.createElement('p');
note.textContent = (schema && schema.title) || 'Native shell settings. Width, scale and alignment apply after save.';
root.append(note);
echoConfigUi.onSave(() => draft);
