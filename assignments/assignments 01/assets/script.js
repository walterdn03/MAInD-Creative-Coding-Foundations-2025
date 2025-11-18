const grid = document.querySelector('.card-grid');
const btnGrid = document.querySelector('.btn-grid');
const btnList = document.querySelector('.btn-list');

const categoryButtons = document.querySelectorAll('.category-btn');
const addCard = document.querySelector('.add-card');
const viewControls = document.querySelector('.control-view');
const headerTitle = document.querySelector('.card-header h1');

// aggiorna vista
function updateCategoryView() {
  const selected = document.querySelector('.category-btn.active').textContent.trim();

  document.querySelectorAll('.card').forEach(card => {
    if (card.classList.contains('add-card')) {
      card.style.display = (selected === "Note") ? "" : "none";
      return;
    }

    // filtro per categoria
    const show =
      (selected === "Note" && (card.dataset.category === "note" || !card.dataset.category)) ||
      (selected === "Trash" && card.dataset.category === "trash");
    card.style.display = show ? "" : "none";

    const actions = card.querySelector('.card-actions');
    const editBtn = actions.querySelector('[data-action="edit"]');
    const deleteBtn = actions.querySelector('[data-action="delete"]');
    let restoreBtn = actions.querySelector('[data-action="restore"]');

    if (selected === "Note") {
      headerTitle.textContent = "Last note";
      addCard.style.display = "";
      viewControls.style.display = "flex";
      if (editBtn) editBtn.style.display = "";
      if (deleteBtn) deleteBtn.style.display = "";
      if (restoreBtn) restoreBtn.remove();
    }

    // stato TRASH
    if (selected === "Trash") {
      headerTitle.textContent = "Note deleted";
      addCard.style.display = "none";
      viewControls.style.display = "none";
      if (editBtn) editBtn.style.display = "none";
      if (deleteBtn) deleteBtn.style.display = "none";
      if (!restoreBtn) {
        restoreBtn = document.createElement('button');
        restoreBtn.classList.add('card-action-btn');
        restoreBtn.dataset.action = "restore";
        restoreBtn.innerHTML = `<img src="assets/img/icon/restore.svg" alt="Ripristina">`;
        actions.appendChild(restoreBtn);
      }
    }
  });
}

btnList.addEventListener('click', () => {
  grid.classList.add('list-view');
  btnList.classList.add('active');
  btnGrid.classList.remove('active');
  updateCategoryView();
});

btnGrid.addEventListener('click', () => {
  grid.classList.remove('list-view');
  btnGrid.classList.add('active');
  btnList.classList.remove('active');
  updateCategoryView();
});

// cambio categoria
categoryButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateCategoryView();
  });
});

// modal
const modal = document.querySelector('.modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const noteBody = document.querySelector('.note-body');

let currentTitleSize = 20;
let currentBodySize = 16;
let currentNoteColor = "";

// azionicard
document.addEventListener('click', (event) => {
  const btn = event.target.closest('.card-action-btn');
  if (!btn) return;

  const card = btn.closest('.card');
  const action = btn.dataset.action;

  // edit
  if (action === 'edit' && (card.dataset.category === "note" || !card.dataset.category)) {
    card.classList.add('editing');
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    modal.dataset.mode = "edit";

    modalTitle.value = card.querySelector('h2').textContent;

    const ul = card.querySelector('ul');
    const p = card.querySelector('p');
    modalText.value = ul ? [...ul.querySelectorAll('li')].map(li => li.textContent).join('\n')
                         : (p ? p.textContent : "");

    const storedTitle = card.querySelector('h2').style.fontSize;
    const sample = card.querySelector('li') || card.querySelector('p');
    if (storedTitle) currentTitleSize = parseFloat(storedTitle);
    if (sample && sample.style.fontSize) currentBodySize = parseFloat(sample.style.fontSize);

    modalTitle.style.fontSize = currentTitleSize + 'px';
    modalText.style.fontSize = currentBodySize + 'px';

    const color = card.style.getPropertyValue('--note-color');
    if (color) {
      noteBody.style.setProperty('--note-color', color);
      currentNoteColor = color;
    } else {
      noteBody.style.removeProperty('--note-color');
      currentNoteColor = '';
    }
  }

  if (action === 'delete') {
    card.dataset.category = "trash";
    updateCategoryView();
  }

  if (action === 'restore') {
    card.dataset.category = "note";
    updateCategoryView();
  }
});

// nuova nota (modal)
document.addEventListener('click', (e) => {
  if (!e.target.closest('.add-card')) return;

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');

  modal.dataset.mode = "create";
  modalTitle.value = "";
  modalText.value = "";

  currentTitleSize = 20;
  currentBodySize = 16;
  modalTitle.style.fontSize = currentTitleSize + "px";
  modalText.style.fontSize = currentBodySize + "px";

  noteBody.style.removeProperty('--note-color');
  currentNoteColor = '';
});

// salva nota
document.addEventListener('click', (e) => {
  if (!e.target.closest('.note-save')) return;

  let card = document.querySelector('.card.editing');

  if (!card && modal.dataset.mode === "create") {
    card = document.createElement('div');
    card.classList.add('card');
    card.dataset.category = "note";
    card.innerHTML = `
      <h2></h2>
      <div class="card-actions">
        <button class="card-action-btn" data-action="edit"><img src="assets/img/icon/edit.svg"></button>
        <button class="card-action-btn" data-action="delete"><img src="assets/img/icon/trash.svg"></button>
      </div>`;
    grid.insertBefore(card, grid.querySelector('.add-card'));
  }

  const newTitle = modalTitle.value.trim();
  const newContent = modalText.value.trim();
  card.querySelector('h2').textContent = newTitle;

  card.querySelectorAll('ul, p').forEach(el => el.remove());
  const lines = newContent.split('\n').filter(l => l.trim());

  if (lines.length > 1) {
    const ul = document.createElement('ul');
    lines.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      li.style.fontSize = currentBodySize + 'px';
      ul.appendChild(li);
    });
    card.insertBefore(ul, card.querySelector('.card-actions'));
  } else {
    const p = document.createElement('p');
    p.textContent = lines[0] || "";
    p.style.fontSize = currentBodySize + 'px';
    card.insertBefore(p, card.querySelector('.card-actions'));
  }

  card.querySelector('h2').style.fontSize = currentTitleSize + 'px';

  if (currentNoteColor) {
    card.style.setProperty('--note-color', currentNoteColor);
    card.style.background = currentNoteColor;
  } else {
    card.style.removeProperty('--note-color');
    card.style.background = "";
  }

  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  card.classList.remove('editing');
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.note-delete') || e.target.classList.contains('modal-overlay')) {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    const editing = document.querySelector('.card.editing');
    if (editing) editing.classList.remove('editing');
  }
});

// toggle palette colori
document.getElementById('color-btn').addEventListener('click', () => {
  document.querySelector('.color-picker').classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
  const option = e.target.closest('.color-option');
  if (!option) return;
  if (option.dataset.color === "custom") {
    document.getElementById('custom-color-picker').click();
    return;
  }
  const newColor = option.dataset.color;
  noteBody.style.setProperty('--note-color', newColor);
  currentNoteColor = newColor;
});

document.getElementById('custom-color-picker').addEventListener('input', (e) => {
  const newColor = e.target.value;
  noteBody.style.setProperty('--note-color', newColor);
  currentNoteColor = newColor;
});

document.getElementById('text-btn').addEventListener('click', () => {
  document.querySelector('.text-size-menu').classList.toggle('hidden');
});

// dimensioni testo
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.text-size-option');
  if (!btn) return;

  if (btn.dataset.size === 'increase') {
    currentTitleSize += 2;
    currentBodySize += 2;
  }
  if (btn.dataset.size === 'decrease') {
    currentTitleSize -= 2;
    currentBodySize -= 2;
  }

  modalTitle.style.fontSize = currentTitleSize + 'px';
  modalText.style.fontSize = currentBodySize + 'px';
});