(() => {
  const section = document.querySelector('#program');
  const list = section.querySelector('.agenda-list');
  const buttons = [...section.querySelectorAll('[data-agenda-type]')];
  const room = section.querySelector('#agenda-room');
  const search = section.querySelector('#agenda-search');
  const result = section.querySelector('.agenda-result');
  const overview = section.querySelector('.agenda-overview');
  const viewButtons = [...section.querySelectorAll('[data-agenda-view]')];
  const dialog = section.querySelector('.agenda-dialog');
  let sessions = [], eventFlow = [], type = 'all', view = 'overview';
  const roomOrder = (a, b) => Number(a.startsWith('普通')) - Number(b.startsWith('普通')) || parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
  const typeName = value => ({session:'技術議程',workshop:'工作坊',cloud:'Google Cloud 專場',activity:'大會流程'})[value];
  const typeOrder = {session:0, workshop:1, cloud:2, activity:3};
  const visibleFlow = () => type === 'all' && !search.value.trim() ? eventFlow : [];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function addText(parent, heading, text) {
    if (!text) return;
    parent.append(el('h4', '', heading), el('p', 'agenda-prose', text));
  }
  function hasContent(session) {
    const realText = text => Boolean(text && !/即將公布|將陸續公布|未提供|待確認/.test(text));
    return [session.description, session.outline, session.details].some(realText) ||
      session.speakers.some(speaker => realText(speaker.bio) || realText(speaker.tagline));
  }
  function sessionBody(session) {
    const body = el('div', 'agenda-card-body');
    addText(body, '議程摘要', session.description);
    if (session.outline && session.outline !== session.description) addText(body, '議程大綱', session.outline);
    if (session.details && session.details !== session.description && session.details !== session.outline) {
      const more = el('details', 'agenda-more');
      more.append(el('summary', '', '閱讀完整說明'));
      more.append(el('p', 'agenda-prose', session.details));
      body.append(more);
    }
    for (const speaker of session.speakers) {
      const bio = el('section', 'agenda-speaker');
      bio.append(el('h4', '', speaker.name));
      if (speaker.tagline) bio.append(el('p', 'agenda-tagline', speaker.tagline));
      if (speaker.bio) bio.append(el('p', 'agenda-prose', speaker.bio));
      body.append(bio);
    }
    return body;
  }
  function card(session) {
    const article = el('article', `agenda-card ${session.type}`);
    article.id = `session-${session.id}`;
    const header = el('div', 'agenda-card-header');
    const meta = el('div', 'agenda-card-meta');
    const kind = {session:'Session',workshop:'Workshop',cloud:'Google Cloud 專場',activity:'大會流程'}[session.type];
    meta.append(el('span', 'agenda-kind', kind), el('span', 'agenda-room', session.room));
    if (session.language) meta.append(el('span', 'agenda-language', session.language));
    meta.append(el('span', 'agenda-duration', `${session.start}–${session.end}`));
    header.append(meta, el('h3', '', session.title));
    const foot = el('div', 'agenda-card-foot');
    foot.append(el('p', 'agenda-names', session.speakers.map(s => s.name).join('、') || (session.type === 'cloud' ? '講師即將公布' : '')));
    if (hasContent(session)) {
      const button = el('button', 'agenda-open', '查看內容');
      button.type = 'button';
      button.setAttribute('aria-label', `查看內容：${session.title}`);
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', 'agenda-details-dialog');
      button.addEventListener('click', () => showSession(session));
      foot.append(button);
    }
    header.append(foot);article.append(header);
    return article;
  }
  function showSession(session) {
    if (!hasContent(session)) return;
    const close = el('button', 'agenda-dialog-close', '關閉');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    const heading = el('h2', '', session.title);
    heading.id = 'agenda-dialog-title';
    const meta = el('p', 'agenda-dialog-meta', `12 月 13 日 ${session.start}–${session.end} · ${session.room} · ${typeName(session.type)}`);
    const body = sessionBody(session);
    dialog.replaceChildren(close, heading, meta, body);
    dialog.showModal();
  }
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  function renderOverview(visible) {
    overview.replaceChildren();
    const base = search.value.trim() ? visible : sessions.filter(s => (type === 'all' || s.type === type) && (!room.value || s.room === room.value));
    const rooms = [...new Set(base.map(s => s.room))].sort(roomOrder);
    const activities = visibleFlow();
    if (!base.length && !activities.length) {
      overview.append(el('p', 'agenda-empty', '沒有符合的場次，試試其他教室或關鍵字。'));
      return;
    }
    const times = [...new Set([...base, ...activities].map(s => s.start))].sort();
    const pending = times.map(start => rooms.map(r => !activities.some(a => a.start === start) &&
      !visible.some(s => s.room === r && s.start <= start && s.end > start)));
    const merged = times.map(() => rooms.map(() => false));
    const table = el('table', 'agenda-table');
    table.style.minWidth = rooms.length > 2 ? `${80 + rooms.length * 128}px` : '0';
    const caption = el('caption', '', '2026 年 12 月 13 日全天議程，時間皆為臺北時間');
    table.append(caption);
    const head = el('thead'), headers = el('tr');
    const timeHeader = el('th', 'agenda-table-time', '時間');
    timeHeader.scope = 'col'; headers.append(timeHeader);
    rooms.forEach(r => { const th = el('th', '', r); th.scope = 'col'; headers.append(th); });
    head.append(headers); table.append(head);
    const body = el('tbody');
    times.forEach((start, index) => {
      const row = el('tr');
      const time = el('th', 'agenda-table-time');
      time.scope = 'row';
      const activity = activities.find(s => s.start === start);
      const end = activity ? activity.end : index === times.length - 1 ? base.map(s => s.end).sort().at(-1) : base.filter(s => s.start === start).map(s => s.end).sort()[0];
      time.append(el('strong', '', start), el('span', '', end));
      row.append(time);
      if (activity) {
        row.className = 'agenda-flow-row';
        const cell = el('td', 'agenda-flow-cell');
        cell.colSpan = Math.max(rooms.length, 1);
        const button = el('div', 'agenda-flow-button');
        button.append(el('strong', '', activity.title), el('span', '', activity.room));
        if (activity.id === 'panel') button.append(el('span', 'agenda-flow-pending', '詳細內容即將公布'));
        cell.append(button); row.append(cell); body.append(row);
        return;
      }
      rooms.forEach((r, column) => {
        if (merged[index][column]) return;
        if (visible.some(s => s.room === r && s.start < start && s.end > start)) return;
        const cell = el('td');
        const session = visible.find(s => s.room === r && s.start === start);
        if (session) {
          cell.rowSpan = times.filter(t => t >= start && t < session.end).length;
          const interactive = hasContent(session);
          const button = el(interactive ? 'button' : 'div', `agenda-cell ${session.type}`);
          if (interactive) { button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', 'agenda-details-dialog'); }
          button.title = session.title;
          button.setAttribute('aria-label', `${session.start}–${session.end} ${r} ${session.title}，${session.speakers.map(s => s.name).join('、')}`);
          if (session.end !== end) button.append(el('span', 'agenda-cell-time', `${session.start}–${session.end}`));
          button.append(el('strong', 'agenda-cell-title', session.title), el('span', 'agenda-cell-speaker', session.speakers.map(s => s.name).join('、') || (session.type === 'cloud' ? '講師即將公布' : '')));
          if (interactive) button.addEventListener('click', () => showSession(session));
          cell.append(button);
        } else {
          let width = 1, height = 1;
          while (column + width < rooms.length && pending[index][column + width] && !merged[index][column + width]) width++;
          while (index + height < times.length && Array.from({length:width}, (_, i) => column + i).every(c => pending[index + height][c] && !merged[index + height][c])) height++;
          for (let y = index; y < index + height; y++) for (let x = column; x < column + width; x++) merged[y][x] = true;
          cell.colSpan = width; cell.rowSpan = height;
          cell.className = 'agenda-pending-cell';
          cell.setAttribute('aria-label', `${rooms.slice(column, column + width).join('、')} ${start} 起尚無已公布場次`);
        }
        row.append(cell);
      });
      body.append(row);
    });
    table.append(body); overview.append(table);
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = sessions.filter(s => (type === 'all' || s.type === type) && (!room.value || s.room === room.value) &&
      (!query || [s.title, s.description, s.tags, ...s.speakers.map(p => p.name)].join(' ').toLocaleLowerCase().includes(query)));
    list.replaceChildren();
    const groups = new Map();
    for (const session of [...visible, ...visibleFlow()].sort((a, b) => a.start.localeCompare(b.start) || typeOrder[a.type] - typeOrder[b.type] || roomOrder(a.room, b.room))) {
      if (!groups.has(session.start)) groups.set(session.start, []);
      groups.get(session.start).push(session);
    }
    for (const [start, group] of groups) {
      const block = el('section', 'agenda-slot');
      block.setAttribute('aria-label', `${start} 場次`);
      const time = el('div', 'agenda-time');
      time.append(el('h3', '', start), el('span', '', '12 月 13 日'));
      const cards = el('div', 'agenda-cards');
      group.forEach(s => cards.append(card(s)));
      block.append(time, cards);
      list.append(block);
    }
    const talks = visible.filter(s => s.type !== 'cloud').length;
    const tracks = visible.length - talks;
    result.textContent = type === 'all' ? `全天流程・${talks} 場議程${tracks ? `・${tracks} 個 Google Cloud 專場` : ''}` : `顯示 ${visible.length} ${type === 'cloud' ? '個' : '場'}${typeName(type)}`;
    if (!visible.length) list.append(el('p', 'agenda-empty', '沒有符合的場次，試試其他教室或關鍵字。'));
    overview.hidden = view !== 'overview';
    list.hidden = view !== 'list';
    section.querySelector('.agenda-scroll-hint').hidden = view !== 'overview';
    if (view === 'overview') renderOverview(visible);
  }
  viewButtons.forEach(button => button.addEventListener('click', () => {
    view = button.dataset.agendaView;
    viewButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render();
  }));
  for (const button of buttons) button.addEventListener('click', () => {
    type = button.dataset.agendaType;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    room.value = '';
    render();
  });
  room.addEventListener('change', render);
  search.addEventListener('input', render);
  Promise.all(['data/agenda.json', 'data/event-flow.json'].map(path => fetch(`${path}?v=20261122-agenda-dialog`).then(response => {
    if (!response.ok) throw new Error('Agenda unavailable');
    return response.json();
  }))).then(([data, flow]) => {
    sessions = data; eventFlow = flow;
    for (const value of [...new Set(sessions.map(s => s.room))].sort(roomOrder)) {
      const option = el('option', '', value); option.value = value; room.append(option);
    }
    render();
  }).catch(() => {
    result.textContent = '';
    list.replaceChildren(el('p', 'agenda-empty', '議程暫時無法載入，請重新整理頁面。'));
  });
})();
