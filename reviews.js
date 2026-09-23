(() => {
  'use strict';

  const SUPABASE_REST_URL = 'https://mywxqcspxrvwkdgggdtr.supabase.co/rest/v1';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5yVXOsH3FJWQNZOkPVImCQ_NfIsqU0d';

  const section = document.getElementById('yorumlar');
  const form = document.getElementById('reviewForm');
  if (!section || !form) return;

  // Existing page copy -> automatic publishing copy
  const heading = section.querySelector('.section-head h2');
  const lead = section.querySelector('.section-head p');
  const grid = section.querySelector('.testimonial-grid');
  const formLead = section.querySelector('.review-submit > p');
  const button = form.querySelector('.review-btn');
  const note = section.querySelector('.testimonial-note');

  if (heading) heading.textContent = 'Gerçek öğrenci ve veli yorumları.';
  if (lead) {
    lead.textContent =
      'Yayın izni verilen yorumlar, kullanıcının seçtiği isim biçimiyle gönderildikten sonra otomatik olarak burada görünür.';
  }
  if (formLead) {
    formLead.textContent =
      'Formu gönderdiğinde yorumun seçtiğin isim biçimiyle sitede otomatik yayınlanır. Ad Soyad seçersen tam adın; yalnızca adını seçersen ilk adın; baş harfleri seçersen yalnızca baş harflerin; anonim seçersen “Anonim” kaydedilir.';
  }
  if (button) button.textContent = 'Yorumu Yayınla';
  if (note) {
    note.textContent =
      'Yorumlar yayın izni verildikten sonra otomatik olarak sitede görünür. Spam veya uygunsuz içerikler sonradan kaldırılabilir. Yorum sahibi seçtiği isim/gizlilik biçimini kullanır.';
  }

  const trustNote = document.querySelector('.trust-note');
  if (trustNote) {
    trustNote.textContent =
      'Koçluk başvuru formu bu web sitesi tarafından veritabanına kaydedilmez ve kullanıcı onayıyla WhatsApp’a yönlendirilir. Yorum formunda ise yalnızca sitede yayınlanacak isim biçimi, öğrenci/veli bilgisi, hizmet türü, yorum metni ve yayın izni Supabase altyapısında saklanır. Ayrıntılar için Gizlilik & KVKK metnini inceleyebilirsin.';
  }

  const nameInput = document.getElementById('yorumAd');
  const commentInput = document.getElementById('yorumMetin');
  if (nameInput) {
    nameInput.maxLength = 80;
    nameInput.autocomplete = 'name';
  }
  if (commentInput) {
    commentInput.minLength = 10;
    commentInput.maxLength = 1500;
  }

  // Light anti-spam honeypot
  let honeypot = document.getElementById('yorumWebsite');
  if (!honeypot) {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.style.cssText =
      'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
    const label = document.createElement('label');
    label.htmlFor = 'yorumWebsite';
    label.textContent = 'Web sitesi';
    honeypot = document.createElement('input');
    honeypot.id = 'yorumWebsite';
    honeypot.name = 'yorumWebsite';
    honeypot.type = 'text';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    wrapper.append(label, honeypot);
    form.appendChild(wrapper);
  }

  // Styles for live review cards.
  const style = document.createElement('style');
  style.textContent = `
    #yorumlar .testimonial-card .review-meta{
      margin:0 0 10px;
      color:#315fb9;
      font-size:12px;
      font-weight:800;
    }
    #yorumlar .review-status{
      grid-column:1/-1;
      border:1px dashed #cfd9ef;
      border-radius:18px;
      padding:22px;
      text-align:center;
      color:#667085;
      background:#fbfcff;
    }
    #yorumlar .review-btn:disabled{
      opacity:.65;
      cursor:not-allowed;
    }
  `;
  document.head.appendChild(style);

  function publicReviewName(fullName, mode) {
    const clean = fullName.trim().replace(/\s+/g, ' ');
    if (mode === 'Anonim') return 'Anonim';
    if (mode === 'Yalnızca adım') return clean.split(' ')[0] || 'Anonim';
    if (mode === 'Baş harflerim') {
      return clean
        .split(' ')
        .filter(Boolean)
        .map(part => part.charAt(0).toLocaleUpperCase('tr-TR') + '.')
        .join('');
    }
    return clean;
  }

  function createReviewCard(review) {
    const article = document.createElement('article');
    article.className = 'testimonial-card';

    const quote = document.createElement('div');
    quote.className = 'quote';
    quote.textContent = '“';

    const title = document.createElement('h3');
    title.textContent = review.public_name || 'Anonim';

    const meta = document.createElement('p');
    meta.className = 'review-meta';
    meta.textContent = [review.reviewer_type, review.service_type]
      .filter(Boolean)
      .join(' · ');

    const body = document.createElement('p');
    body.textContent = review.comment_text || '';

    article.append(quote, title, meta, body);
    return article;
  }

  function showStatus(message) {
    if (!grid) return;
    grid.replaceChildren();
    const state = document.createElement('div');
    state.className = 'review-status';
    state.textContent = message;
    grid.appendChild(state);
  }

  async function loadReviews() {
    if (!grid) return;
    showStatus('Yorumlar yükleniyor…');

    try {
      const response = await fetch(
        SUPABASE_REST_URL +
          '/reviews?select=public_name,reviewer_type,service_type,comment_text,created_at&order=created_at.desc&limit=30',
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY
          }
        }
      );

      if (!response.ok) throw new Error('Yorumlar alınamadı');
      const reviews = await response.json();
      grid.replaceChildren();

      if (!reviews.length) {
        showStatus('Henüz yayınlanmış yorum bulunmuyor. İlk yorumu sen bırakabilirsin.');
        return;
      }

      reviews.forEach(review => grid.appendChild(createReviewCard(review)));
    } catch (error) {
      showStatus('Yorumlar şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.');
    }
  }

  // Capture phase + stopImmediatePropagation disables the old WhatsApp review handler.
  form.addEventListener(
    'submit',
    async function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (honeypot && honeypot.value.trim()) {
        form.reset();
        return;
      }

      const lastSubmit = Number(localStorage.getItem('reviewLastSubmit') || 0);
      if (Date.now() - lastSubmit < 60000) {
        alert('Yeni bir yorum göndermek için lütfen yaklaşık 1 dakika bekleyin.');
        return;
      }

      if (!form.reportValidity()) return;

      const payload = {
        public_name: publicReviewName(form.yorumAd.value, form.yorumYayin.value),
        reviewer_type: form.yorumRol.value,
        service_type: form.yorumSinav.value,
        comment_text: form.yorumMetin.value.trim(),
        consent: true
      };

      const originalText = button ? button.textContent : '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Yayınlanıyor…';
      }

      try {
        const response = await fetch(SUPABASE_REST_URL + '/reviews', {
          method: 'POST',
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          throw new Error(detail || 'Yorum kaydedilemedi');
        }

        localStorage.setItem('reviewLastSubmit', String(Date.now()));

        if (typeof gtag === 'function') {
          gtag('event', 'submit_review', {
            reviewer_type: form.yorumRol.value || 'Bilinmiyor',
            service_type: form.yorumSinav.value || 'Bilinmiyor'
          });
        }

        form.reset();
        await loadReviews();
        alert('Yorumunuz yayınlandı. Teşekkür ederiz.');
      } catch (error) {
        alert('Yorum şu anda yayınlanamadı. Lütfen daha sonra tekrar deneyin.');
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalText || 'Yorumu Yayınla';
        }
      }
    },
    true
  );

  loadReviews();
})();
