const hamburgerMenu = document.getElementById('hamburger-menu');
const mobileNav = document.getElementById('mobile-nav');
const mobileLinks = document.querySelectorAll('.mobile-link');

hamburgerMenu.addEventListener('click', () => {
  mobileNav.classList.toggle('active');
});

mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('active');
  });
});

function openWhatsApp(){
  const number = "5516981057459"; // número pronto (DDI 55 + DDD 16 + número)
  const msg = encodeURIComponent("Olá! Quero um orçamento para restauração de rodas.");
  window.open(`https://wa.me/${number}?text=${msg}`,'_blank');
}

function scrollToEl(id){
  const el = document.querySelector(id);
  if (!el) return;
  const header = document.querySelector('.nav');
  const headerHeight = header ? header.offsetHeight : 0;
  const y = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 10;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

// Intercepta links de âncora e aplica o mesmo deslocamento (útil para o link do cabeçalho)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e){
    const href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      scrollToEl(href);
    }
  });
});

document.getElementById('ano').textContent = new Date().getFullYear();

const form = document.getElementById("bookingForm");

// elementos do formulário usados para validação dinâmica
const dateInput = document.getElementById('data');
const timeInput = document.getElementById('hora');

// Define a menor data permitida (hoje)
function setMinDate() {
  const today = new Date();
  const iso = today.toISOString().split('T')[0];
  dateInput.min = iso;
}

// Atualiza as restrições de horário dependendo do dia selecionado
function updateTimeConstraintsForDate(dateValue) {
  // limpa opções antigas
  while (timeInput.firstChild) timeInput.removeChild(timeInput.firstChild);
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecione o horário';
  timeInput.appendChild(placeholder);

  if (!dateValue) {
    timeInput.disabled = true;
    dateInput.setCustomValidity('');
    return;
  }

  const selected = new Date(dateValue + 'T00:00:00');
  let day = selected.getDay(); // 0 = Domingo, 6 = Sábado

  // Domingo: pulamos para o próximo dia útil (segunda)
  if (day === 0) {
    // encontra próxima data que não seja domingo
    let next = new Date(selected.getTime());
    do {
      next.setDate(next.getDate() + 1);
      day = next.getDay();
    } while (day === 0);
    const iso = next.toISOString().split('T')[0];
    dateInput.value = iso;
    // feedback curto
    showFormFeedback(`Domingo indisponível — selecionado próximo dia útil: ${iso}`);
    // chama recursivamente para popular horários do novo dia
    return updateTimeConstraintsForDate(iso);
  }

  // Define faixa de horários por dia
  let minTime = '08:00';
  let maxTime = '18:00';
  if (day === 6) { // sábado
    maxTime = '12:00';
  }

  // Se a data selecionada for hoje, ajusta início do range para agora+30min
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let earliest = minTime;
  // Comentado para sempre mostrar horários disponíveis, evitando bug quando não há slots
  // if (selected.getTime() === today.getTime()) {
  //   const next = new Date(now.getTime() + 30 * 60000);
  //   const hh = String(next.getHours()).padStart(2, '0');
  //   const mm = String(next.getMinutes()).padStart(2, '0');
  //   const nextStr = `${hh}:${mm}`;
  //   if (nextStr > earliest) earliest = nextStr;
  // }

  // Gera opções espaçadas a cada 30 minutos entre earliest e maxTime
  const slots = generateTimeSlots(earliest, maxTime, 30);
  if (slots.length === 0) {
    timeInput.disabled = true;
    showFormFeedback('Não há horários disponíveis para a data selecionada. Escolha outra data.');
    return;
  }

  timeInput.disabled = false;
  slots.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    timeInput.appendChild(opt);
  });
}

// Gera array de horários no formato HH:MM entre start e end (inclusive start, exclusive end)
function generateTimeSlots(start, end, stepMinutes) {
  const result = [];
  function toMinutes(hm) { const [h, m] = hm.split(':').map(Number); return h * 60 + m; }
  function toHM(mins) { const h = String(Math.floor(mins / 60)).padStart(2, '0'); const m = String(mins % 60).padStart(2, '0'); return `${h}:${m}`; }
  const s = toMinutes(start);
  const e = toMinutes(end);
  // Gera slots de forma crescente. Inclui o horário final (e) se ele coincide com um passo.
  for (let m = s; m <= e; m += stepMinutes) {
    if (m > e) break;
    result.push(toHM(m));
  }
  // garante ordem crescente e sem duplicatas
  const uniq = Array.from(new Set(result));
  uniq.sort((a, b) => toMinutes(a) - toMinutes(b));
  return uniq;
}

// Mostra feedback curto abaixo do formulário
function showFormFeedback(text) {
  const old = form.querySelector('.form-feedback');
  if (old) old.remove();
  const msg = document.createElement('div');
  msg.className = 'form-feedback';
  msg.textContent = text;
  msg.style.color = '#f0c';
  msg.style.marginBlockStart = '0.6rem';
  form.appendChild(msg);
  setTimeout(() => { if (msg && msg.parentNode) msg.remove(); }, 5000);
}

// Escuta mudanças de data para ajustar horários e bloquear domingos
dateInput.addEventListener('change', () => {
  const selected = new Date(dateInput.value + 'T00:00:00');
  if (selected.getDay() === 0) { // Domingo
    dateInput.setCustomValidity('Domingos não trabalhamos. Escolha outro dia.');
    timeInput.disabled = true;
    while (timeInput.firstChild) timeInput.removeChild(timeInput.firstChild);
    const placeholder = document.createElement('option');
    placeholder.textContent = 'Selecione uma data válida primeiro';
    timeInput.appendChild(placeholder);
    showFormFeedback('Domingos não trabalhamos. Escolha outro dia.');
  } else {
    dateInput.setCustomValidity('');
    updateTimeConstraintsForDate(dateInput.value);
  }
});

// Validação simples quando o usuário escolhe horário
timeInput.addEventListener('change', () => {
  if (!timeInput.value) {
    timeInput.setCustomValidity('Por favor selecione um horário disponível.');
  } else {
    timeInput.setCustomValidity('');
  }
});

// Inicializa constraints ao carregar a página
setMinDate();
// Se não houver valor no date, define como hoje (ou próximo dia útil) para popular horários
if (!dateInput.value) {
  // usa o min (hoje) como valor inicial
  dateInput.value = dateInput.min;
}

// Popula horários com base na data atual/selecionada
updateTimeConstraintsForDate(dateInput.value);

form.addEventListener("submit", (e)=>{
  e.preventDefault();

  // validações sem repopular o select (evita perder seleção)
  // verifica data
  const selectedDate = dateInput.value;
  if (!selectedDate) {
    dateInput.reportValidity();
    return;
  }

  // domingo não permitido (safety)
  const selDay = new Date(selectedDate + 'T00:00:00').getDay();
  if (selDay === 0) {
    dateInput.setCustomValidity('A empresa fecha aos domingos. Escolha outro dia.');
    dateInput.reportValidity();
    return;
  } else {
    dateInput.setCustomValidity('');
  }

  // verifica horário selecionado está presente no select
  const selectedTime = document.getElementById('hora').value;
  if (!selectedTime) {
    timeInput.setCustomValidity('Por favor selecione um horário disponível.');
    timeInput.reportValidity();
    return;
  }
  // garante que o option exista (proteção contra alterações externas)
  if (!timeInput.querySelector(`option[value="${selectedTime}"]`)) {
    showFormFeedback('Horário inválido. Selecione outro horário.');
    return;
  }
  timeInput.setCustomValidity('');

  // checa outros campos obrigatórios via API do navegador
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const date = document.getElementById('data').value;
  const time = document.getElementById('hora').value;
  const name = document.getElementById('nome').value.trim();
  const service = document.getElementById('servico').value;
  const clientWhatsapp = document.getElementById('whatsapp').value.trim();
  const notes = document.getElementById('observacoes').value.trim();

  // número da empresa (pegar dos contatos): +55 16 98120-5676 -> 5516981205676
  const companyNumber = '5516981057459';

  // Formata mensagem profissional, clara e persuasiva
  // Formata mensagem profissional, clara e persuasiva incluindo o serviço e pedindo orçamento
  let messagePlain = `Olá, equipe Monster — Refinamento Automotivo.

Gostaria de agendar uma visita e solicitar orçamento para o serviço selecionado. Seguem os dados:
`;
  messagePlain += `• Serviço: ${service}
`;
  messagePlain += `• Data: ${date}
`;
  messagePlain += `• Horário desejado: ${time}
`;
  messagePlain += `• Nome completo: ${name}
`;
  messagePlain += `• WhatsApp do cliente: ${clientWhatsapp}
`;
  if (notes) {
    messagePlain += `• Observações: ${notes}
`;
  }
  messagePlain += `
Por favor, confirmar a disponibilidade e enviar orçamento estimado, prazo e procedimentos iniciais.

Agradeço — aguardo confirmação.`;

  const encoded = encodeURIComponent(messagePlain);

  // Abre o WhatsApp da empresa em nova aba com a mensagem preenchida
  const url = `https://wa.me/${companyNumber}?text=${encoded}`;
  window.open(url, '_blank');

  // Feedback visual no formulário
  const successMsg = document.createElement('div');
  successMsg.textContent = "Abrindo WhatsApp da empresa com os dados de agendamento...";
  successMsg.style.color = '#32CD32';
  successMsg.style.fontWeight = 'bold';
  successMsg.style.marginBlockStart = '0.6rem';
  // remove mensagens antigas antes de adicionar
  const old = form.querySelector('.form-feedback');
  if (old) old.remove();
  successMsg.className = 'form-feedback';
  form.appendChild(successMsg);
  setTimeout(() => successMsg.remove(), 6000);
});

// Scroll-triggered animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.services, .gallery, .booking, .contact').forEach(section => {
  section.style.opacity = '0';
  section.style.transform = 'translateY(30px)';
  section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(section);
});
