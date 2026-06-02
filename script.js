// @ts-nocheck
// ── Champs du formulaire ──
const fields = {
  bailleurNom:     document.getElementById('bailleurNom'),
  bailleurAdresse: document.getElementById('bailleurAdresse'),
  locataireNom:    document.getElementById('locataireNom'),
  logementAdresse: document.getElementById('logementAdresse'),
  periodeMois:     document.getElementById('periodeMois'),
  periodeDebut:    document.getElementById('periodeDebut'),
  periodeFin:      document.getElementById('periodeFin'),
  loyerHC:         document.getElementById('loyerHC'),
  charges:         document.getElementById('charges'),
  dateQuittance:   document.getElementById('dateQuittance'),
};

const periodeInfo    = document.getElementById('periodeInfo');
const periodeError   = document.getElementById('periodeError');
const btnDl          = document.getElementById('btnTelecharger');
const champsUnique   = document.getElementById('champs-unique');
const champsMultiple = document.getElementById('champs-multiple');

function getMode() {
  return document.querySelector('input[name="mode"]:checked')?.value ?? 'unique';
}

// ── Signature ──
const signatureUploadZone = document.getElementById('signatureUploadZone');
const signatureFileInput  = document.getElementById('signatureFile');
const signatureThumb      = document.getElementById('signatureThumb');
const signatureUploadHint = document.getElementById('signatureUploadHint');
const btnSupprimerSig     = document.getElementById('btnSupprimerSignature');
const prevSignature       = document.getElementById('prev-signature');
const SIG_KEY             = 'quittus_signature';

function applySignature(dataUrl) {
  signatureThumb.src       = dataUrl;
  signatureThumb.hidden    = false;
  signatureUploadHint.hidden = true;
  btnSupprimerSig.hidden   = false;
  prevSignature.src        = dataUrl;
  prevSignature.hidden     = false;
  localStorage.setItem(SIG_KEY, dataUrl);
}

function clearSignature() {
  signatureThumb.src         = '';
  signatureThumb.hidden      = true;
  signatureUploadHint.hidden = false;
  btnSupprimerSig.hidden     = true;
  prevSignature.src          = '';
  prevSignature.hidden       = true;
  localStorage.removeItem(SIG_KEY);
}

function loadSignature() {
  const saved = localStorage.getItem(SIG_KEY);
  if (saved) applySignature(saved);
}

function readImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = e => applySignature(e.target.result);
  reader.readAsDataURL(file);
}

// Clic sur la zone → ouvre le sélecteur
signatureUploadZone.addEventListener('click', () => signatureFileInput.click());
signatureFileInput.addEventListener('change', e => readImageFile(e.target.files[0]));

// Drag & drop
signatureUploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  signatureUploadZone.classList.add('drag-over');
});
signatureUploadZone.addEventListener('dragleave', () => {
  signatureUploadZone.classList.remove('drag-over');
});
signatureUploadZone.addEventListener('drop', e => {
  e.preventDefault();
  signatureUploadZone.classList.remove('drag-over');
  readImageFile(e.dataTransfer.files[0]);
});

btnSupprimerSig.addEventListener('click', clearSignature);

// ── Sauvegarde / restauration (localStorage) ──
const STORAGE_KEY = 'quittus_form';

function saveForm() {
  const data = {};
  Object.entries(fields).forEach(([k, el]) => { data[k] = el.value; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadForm() {
  const today = new Date();
  const thisMonth = toMonthStr(today);

  // Valeurs par défaut
  fields.dateQuittance.value = today.toISOString().split('T')[0];
  fields.periodeMois.value   = thisMonth;
  fields.periodeDebut.value  = thisMonth;
  fields.periodeFin.value    = thisMonth;

  // Restaure le mode
  const savedMode = localStorage.getItem('quittus_mode') || 'unique';
  const modeRadio = document.querySelector(`input[name="mode"][value="${savedMode}"]`);
  if (modeRadio) {
    modeRadio.checked     = true;
    champsUnique.hidden   = savedMode === 'multiple';
    champsMultiple.hidden = savedMode !== 'multiple';
  }

  // Écrase avec les données sauvegardées si elles existent
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  const data = JSON.parse(saved);
  Object.entries(fields).forEach(([k, el]) => {
    if (data[k] !== undefined) el.value = data[k];
  });
}

loadForm();
loadSignature();

// ── Changement de mode ──
document.querySelectorAll('input[name="mode"]').forEach(r => {
  r.addEventListener('change', () => {
    const multi = getMode() === 'multiple';
    champsUnique.hidden   = multi;
    champsMultiple.hidden = !multi;
    localStorage.setItem('quittus_mode', getMode());
    validateRange();
    updatePreview();
  });
});

// ── Helpers ──
function toMonthStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function fmt(val) {
  const n = parseFloat(val) || 0;
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPeriode(yyyymm) {
  if (!yyyymm) return '—';
  const [y, m] = yyyymm.split('-');
  return new Date(+y, +m - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatDate(val) {
  if (!val) return '—';
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}

// Retourne la liste des mois YYYY-MM entre debut et fin (inclus)
function getMonthRange(debut, fin) {
  if (!debut || !fin) return [debut || fin || thisMonth];
  const [dy, dm] = debut.split('-').map(Number);
  const [fy, fm] = fin.split('-').map(Number);
  const result = [];
  let y = dy, m = dm;
  while (y < fy || (y === fy && m <= fm)) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return result;
}

// ── Validation plage ──
function validateRange() {
  if (getMode() === 'unique') {
    btnDl.disabled = false;
    return [fields.periodeMois.value || toMonthStr(new Date())];
  }

  const range = getMonthRange(fields.periodeDebut.value, fields.periodeFin.value);
  const count = range.length;
  const over  = count > 12;

  periodeError.hidden = !over;
  btnDl.disabled      = over;

  const label = count === 1 ? '1 quittance' : `${count} quittances`;
  periodeInfo.textContent = over ? `${count} mois — trop long !` : label;
  periodeInfo.style.color = over ? '#ff6b6b' : '#8ca0ff';

  return over ? [] : range;
}

// ── Mise à jour de l'aperçu (1er mois de la plage) ──
function updatePreview(overridePeriode) {
  const bNom  = fields.bailleurNom.value     || 'Jean Dupont';
  const bAdr  = fields.bailleurAdresse.value || '12 rue des Lilas, 75001 Paris';
  const lNom  = fields.locataireNom.value    || 'Marie Martin';
  const lAdr  = fields.logementAdresse.value || '8 avenue Voltaire, 75011 Paris';
  const hc    = parseFloat(fields.loyerHC.value) || 0;
  const ch    = parseFloat(fields.charges.value)  || 0;
  const total = hc + ch;
  const dateQ = formatDate(fields.dateQuittance.value);

  const mois  = overridePeriode
    ? formatPeriode(overridePeriode)
    : formatPeriode(getMode() === 'unique' ? fields.periodeMois.value : fields.periodeDebut.value);

  setText('prev-bailleurNom',     bNom);
  setText('prev-bailleurNom2',    bNom);
  setText('prev-bailleurNom3',    bNom);
  setText('prev-bailleurAdresse', bAdr);
  setText('prev-locataireNom',    lNom);
  setText('prev-logementAdresse', lAdr);
  setText('prev-periode',         mois);
  setText('prev-loyerHC',         fmt(hc) + ' €');
  setText('prev-charges',         fmt(ch) + ' €');
  setText('prev-total',           fmt(total));
  setText('prev-total2',          fmt(total) + ' €');
  setText('prev-dateQuittance',   dateQ);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ── Écoute des champs ──
Object.values(fields).forEach(input => {
  input.addEventListener('input', () => {
    saveForm();
    validateRange();
    updatePreview();
  });
});

// Init
validateRange();
updatePreview();

// ── Génération PDF (multi-pages) ──
btnDl.addEventListener('click', async () => {
  const range = validateRange();
  if (!range.length) return;

  const { jsPDF } = window.jspdf;
  const quittance = document.getElementById('quittance');

  const pageW  = 210, pageH = 297, margin = 10;
  const availW = pageW - margin * 2;

  // Indicateur visuel pendant la génération
  btnDl.disabled     = true;
  btnDl.textContent  = `Génération… (0 / ${range.length})`;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < range.length; i++) {
    // Met à jour l'aperçu avec le mois courant
    updatePreview(range[i]);
    await new Promise(r => setTimeout(r, 60)); // laisse le DOM se rafraîchir

    const canvas = await html2canvas(quittance, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.88);
    const imgW = canvas.width, imgH = canvas.height;
    const drawH = imgH * (availW / imgW);
    const finalH = Math.min(drawH, pageH - margin * 2);
    const finalW = finalH === drawH ? availW : imgW * (finalH / imgH);

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, margin, finalW, finalH);

    btnDl.textContent = `Génération… (${i + 1} / ${range.length})`;
  }

  // Restaure l'aperçu sur le 1er mois
  updatePreview();

  // Nom du fichier
  const lNom  = (fields.locataireNom.value || 'locataire').replace(/\s+/g, '_');
  const debut = fields.periodeDebut.value || 'debut';
  const fin   = fields.periodeFin.value   || 'fin';
  const suffix = debut === fin ? debut : `${debut}_au_${fin}`;
  pdf.save(`quittance_${lNom}_${suffix}.pdf`);

  btnDl.disabled    = false;
  btnDl.textContent = 'Télécharger le PDF';
});
