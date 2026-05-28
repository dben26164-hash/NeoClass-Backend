const form = document.getElementById('upload-form');
const statusCard = document.getElementById('status-card');
const statusMessage = document.getElementById('status-message');
const statusProgress = document.getElementById('status-progress');
const logsContainer = document.getElementById('logs');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fileInput = document.getElementById('document');
  const file = fileInput.files[0];

  if (!file) {
    alert('Sélectionnez un fichier.');
    return;
  }

  const data = new FormData();
  data.append('document', file);

  statusCard.hidden = false;
  statusMessage.textContent = 'Envoi du fichier...';
  statusProgress.value = 0;
  logsContainer.textContent = '';

  try {
    const response = await fetch('/api/import/upload', {
      method: 'POST',
      body: data
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Erreur pendant l import');
    }

    trackStatus(payload.jobId);
  } catch (error) {
    statusMessage.textContent = `Erreur : ${error.message}`;
  }
});

async function trackStatus(jobId) {
  statusMessage.textContent = 'Import en cours...';

  const interval = setInterval(async () => {
    const response = await fetch(`/api/import/status/${jobId}`);
    const payload = await response.json();

    if (response.ok) {
      statusProgress.value = payload.job.progress;
      statusMessage.textContent = `${payload.job.status} — ${payload.job.progress}%`;
      logsContainer.textContent = payload.logs
        .map((log) => `[${new Date(log.createdAt).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`)
        .join('\n');

      if (payload.job.status === 'COMPLETED' || payload.job.status === 'FAILED') {
        clearInterval(interval);
        statusMessage.textContent = `Import terminé : ${payload.job.status}`;
      }
    } else {
      clearInterval(interval);
      statusMessage.textContent = `Erreur de suivi : ${payload.error}`;
    }
  }, 2000);
}
